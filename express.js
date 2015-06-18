/**
 * This file provides an express middleware to add activist to an express
 * served site.
 * Intended Usage:
 * ```javascript
 * var app = express();
 * app.use(require('activist'));
 * ```
 */
'use strict';

var fs = require('fs');
var parseUrl = require('parseurl');
var etag = require('etag');
var fresh = require('fresh');

var packager = require('./packager');
var version = JSON.parse(fs.readFileSync(__dirname + '/package.json')).version;

var maxMaxAge = 60 * 60 * 24 * 365 * 1000; // 1 year

/**
 * Get the contents of a file as a buffer.
 * @private
 */
function loadContents (path, prefix) {
  var fullFile = require.resolve(path);
  var data = fs.readFileSync(fullFile).toString();
  return data.replace(/%%PREFIX%%/g, prefix).replace(/%%DATE%%/g, version);
}

/**
 * Get the contents of activist.js as a buffer - minified w/ browserify.
 * @private
 */
function loadActivist (prefix, options, rsrc) {
  var config = {};
  var defaultConfig = require('./src/config');
  for (var i in defaultConfig) {
    if (defaultConfig.hasOwnProperty(i) && !options[i]) {
      config[i] = defaultConfig[i];
    } else if (options[i]) {
      config[i] = options[i];
    }
  }
  config.url = prefix + '.js';
  config.frame = prefix + '.html';
  config.offline = prefix + '-offline.html';

  rsrc.type = 'text/javascript';
  packager(config, function (data) {
    rsrc.body = data;
    rsrc.headers = {
      'Cache-Control': 'public, max-age=' + Math.floor(rsrc.maxAge / 1000),
      'ETag': etag(data)
    };
  });
}

/**
 * Create the 'resource' to send, namely the headers & body for the file.
 */
function createResource (data, maxAge, type) {
  return {
    body: data,
    headers: {
      'Cache-Control': 'public, max-age=' + Math.floor(maxAge / 1000),
      'ETag': etag(data)
    },
    type: type
  };
}

/**
 * Send a response of a 'createResource' object to a request.
 */
function send(req, res, resource) {
  var headers = resource.headers;

  // Set headers
  var keys = Object.keys(headers);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    res.setHeader(key, headers[key]);
  }

  if (fresh(req.headers, res._headers)) {
    res.statusCode = 304;
    res.end();
    return;
  }

  res.statusCode = 200;
  res.setHeader('Content-Length', resource.body.length);
  res.setHeader('Content-Type', resource.type);
  res.end(resource.body);
}

/**
 * Serve activist.
 *
 * @public
 * @param {Object} options
 * @return {Function} middleware
 */
function activist(options) {
  var opts = options || {};
  var prefix = opts.prefix || '/activist';
  var maxAge = opts.maxAge || maxMaxAge;
  var rsrc_activist = {maxAge: maxAge};
  loadActivist(prefix, opts, rsrc_activist);
  var rsrc_appcache = createResource(opts.cache || loadContents('./assets/cache.appcache', prefix), maxAge, 'text/cache-manifest');
  var rsrc_frame = createResource(opts.frame || loadContents('./assets/frame.html', prefix), maxAge, 'text/html');
  var rsrc_offline = createResource(opts.offline || loadContents('./assets/offline.html', prefix), maxAge, 'text/html');

  return function (req, res, next) {
    var path = parseUrl(req).pathname;
    if (path !== prefix + '.appcache' &&
        path !== prefix + '.js' &&
        path !== prefix + '-offline.html' &&
        path !== prefix + '.html') {
      next();
      return;
    }

    // These resources are 'get' only.
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.statusCode = req.method === 'OPTIONS' ? 200 : 405;
      res.setHeader('Allow', 'GET, HEAD, OPTIONS');
      res.setHeader('Content-Length', '0');
      res.end();
      return;
    }

    if (path === prefix + '.appcache') {
      send(req, res, rsrc_appcache);
    } else if (path === prefix + '.js') {
      send(req, res, rsrc_activist);
    } else if (path === prefix + '-offline.html') {
      send(req, res, rsrc_offline);
    } else if (path === prefix + '.html') {
      send(req, res, rsrc_frame);
    } else {
      throw new Error('Unhandled Request: ' + path);
    }
  };
}

module.exports = activist;
