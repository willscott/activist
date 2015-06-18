/*jslint node:true*/
'use strict';

var browserify = require('browserify');
var stream = require('stream');

function buildActivist(config, callback) {
  var b = browserify({debug: true});
  var configStream = new stream.Readable();
  configStream._read = function noop() {};
  configStream.push("module.exports=");
  configStream.push(JSON.stringify(config));
  configStream.push(null);
  b.require(configStream, {
    basedir: './',
    expose: './config'
  });

  b.add(require.resolve('./src/activist'));
  b.plugin('minifyify');
  b.bundle(function (err, buf) {
    if (err) {
      console.warn(err);
      throw err;
    }
    callback(buf.toString());
  });
}

module.exports = buildActivist;
