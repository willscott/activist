/*jslint node:true */
/**
 * A node.js web server that serves pages while attempting to mimic a variety
 * of the network conditions which may be introduced through interference.
 * The primary network interface runs on two ports (http and https), and a
 * Third port is opened with an administrative interface allowing a client to
 * change the serving behavior of the activist.js enabled demo. The general
 * architecture is designed to be run behind an nginx reverse proxy.
 *
 * Interference modes are:
 * * Keeping the connection alive, but never sending data.
 * * Providing an incorrect SSL Certificate.
 * * Providing a block page for the index and a 404 for other requests.
 * * Providing a block page for the index and a 302 for other requests.
 * * Providing a block page for all requests.
 * * Closing the connection for all request
 *
 * The notably absent modes are IP / DNS related, which is harder for a server
 * to demonstrate by itself.
 */
var crypto = require('crypto');
var fs = require('fs');
var http = require('http');
var https = require('https');

var MODES = {
  NORMAL: 0,
  NEVER_SEND: 1,
  SSL_SPOOF: 2,
  BLOCK_404: 3,
  BLOCK_302: 4,
  BLOCK_ALL: 5,
  CLOSE_EMPTY: 6
};

var usage = function () {
  'use strict';
  console.error("Usage: server.js [port]");
  process.exit(1);
};

var port = 8080;
var mode = MODES.NORMAL;
try {
  if (process.argv[2]) {
    port = parseInt(process.argv[2], 10);
  }
} catch (e) {
  usage();
}

var make_404 = function (res) {
  'use strict';
  res.writeHead(404, {
    'Content-Type': 'text/html'
  });
  res.end('<html>404 Not Found</html>');
};
var make_302 = function (res) {
  'use strict';
  res.writeHead(302, {
    'Location': '/'
  });
  res.end();
};

var make_block = function (res) {
  'use strict';
  res.writeHead(200, {
    'Content-Type': 'text/html'
  });
  res.end('<html><body><h1>The requested content is unavailable</h1>' +
          '<h2>Please check with your local authority to request access</h2>' +
          '<h3>Normally block pages have images and other contents to make ' +
          'them distinguishable from a 404 block page in terms of content ' +
          'length, an interesting trait of internet explorer specifically ' +
          'is to treat responses different if they are above or below a ' +
          'content length that the IE developers thought was appropriate ' +
          'for a 404 page, and replaces the content with the browser native ' +
          'error page. to avoid this you need to have your page content ' +
          'long enough that the browser realizes you have some content you ' +
          'would prefer to have displayed instead of its default ungly error' +
          '</body></html>');
};


var onRequest = function (req, res) {
  'use strict';
  var modes, file;
  if (req.url === '/control') {
    if (req.method === 'POST') {
      req.on('data', function(d) {
        var data = d.toString();
        if (data.indexOf('mode=') === 0) {
          mode = parseInt(data.substr(5), 10);
          console.log('Mode is now ' + mode);
        }
      });
    }

    res.writeHead(200, {
      'Content-Type': 'text/html'
    });
    Object.keys(MODES).forEach(function (mode) {
      modes += "<option value='" + MODES[mode] + "'>" + mode + "</option>";
    });
    res.end('<html>Choose Mode: ' +
            '<form action="/control" method="POST"><select name="mode">' +
            modes +
            '</select><input type="submit" /></form></html>');
  } else {
    try {
      file = fs.readFileSync(req.url.substr(1));
    } catch (e) {
      return make_404(res);
    }
    if (mode === MODES.NORMAL) {
      res.writeHead(200, {
        'Content-Type': 'text/html'
      });
      res.end(file);
    } else if (mode === MODES.NEVER_SEND) {
      res.writeHead(200, {
        'Content-Type': 'text/html',
        'Content-Length': 2048 * 2
      });
      return;
    } else if (mode === MODES.BLOCK_404) {
      if (req.url === "/") {
        return make_block(res);
      } else {
        return make_404(res);
      }
    } else if (mode === MODES.BLOCK_302) {
      if (req.url === "/") {
        return make_block(res);
      } else {
        return make_302(res);
      }
    } else if (mode === MODES.BLOCK_ALL) {
      return make_block(res);
    } else if (mode === MODES.CLOSE_EMPTY) {
      return res.end();
    }
  }
};

var server = http.createServer(onRequest).listen(port);

// For SSL.
var certs = {
  good: crypto.createCredentials({
    key: fs.readFileSync('certs/my-server.key.pem'),
    cert: fs.readFileSync('certs/my-server.crt.pem')
  }).context,
  bad: crypto.createCredentials({
    key: fs.readFileSync('certs/unrooted.key.pem'),
    cert: fs.readFileSync('certs/unrooted.crt.pem')
  }).context
};

https.createServer({
  SNICallback: function (hostname) {
    'use strict';
    if (mode === MODES.SSL_SPOOF) {
      return certs.bad;
    } else {
      return certs.good;
    }
  },
  key: fs.readFileSync('certs/my-server.key.pem').toString(),
  cert: fs.readFileSync('certs/my-server.crt.pem').toString()
}, onRequest).listen(port + 1);
