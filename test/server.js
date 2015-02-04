/*jslint node:true, nomen:true */
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
var minimist = require('minimist');
var serverDestroyer = require('server-destroy');
var moment = require('moment');
var ipTables = require('./iptables');
var mime = require('mime');

var MODES = {
  NORMAL: 0,
  NEVER_SEND: 1,
  SSL_SPOOF: 2,
  BLOCK_404: 3,
  BLOCK_302: 4,
  BLOCK_ALL: 5,
  CLOSE_EMPTY: 6,
  DROP_PACKAGE: 7
};

var MODES_VERBOSE = [
    'normal',
    'never send',
    'ssl spoof',
    'block 404',
    'block 302',
    'block all',
    'close empty',
    'drop package'
  ];
var port = 8080;
var ssl_port = port + 1;
var maintenance_port = port + 2;
var mode = MODES.NORMAL;
var root = __dirname;
var server, secure_server;

function setOptions(opts) {
  'use strict';
  if (opts.port) {
    port = opts.port;
  }
  if (opts.ssl_port) {
    ssl_port = opts.ssl_port;
  } else {
    ssl_port = port + 1;
  }
  if (opts.maintenance_port) {
    maintenance_port = opts.maintenance_port;
  } else {
    maintenance_port = port + 2;
  }
  if (opts.mode) {
    mode = opts.mode;
  }
  if (opts.root) {
    root = opts.root;
  }
}

var LOG_LEVELS = {
  SERVER : 0,
  CLIENT : 1
};

var logs = [];
var sseClients = [];



function usage() {
  'use strict';
  console.error("Usage: server.js [--port=8080] [--ssl_port=port+1] [--m_port=port+2] [--mode=0] [--root=./]");
  process.exit(1);
}


function sendSSE(event, data) {
  'use strict';
  sseClients.forEach(function (client) {
    client.sse(event, data);
  });
}

function addLog(level, message) {
  'use strict';
  var logEntry = [moment().format(), level, message];
  logs.push(logEntry);
  sendSSE("log", logEntry);
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

var restartHTTPSServer;
var onRequest = function (req, res) {
  'use strict';
  var modes, file, filename, mimetype;
  
  addLog(LOG_LEVELS.CLIENT, "[" + MODES_VERBOSE[mode] + "][" + req.url + "] " + req.headers['user-agent']);
  try {
    filename = root + req.url;
    file = fs.readFileSync(filename);
    mimetype = mime.lookup(filename);
  } catch (e) {
    addLog(LOG_LEVELS.SERVER, "[" + MODES_VERBOSE[mode] + "][" + req.url + "] File not found");
    return make_404(res);
  }

  if (mode === MODES.NORMAL || mode === MODES.SSL_SPOOF) {
    res.writeHead(200, {
      'Content-Type': mimetype
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

  console.log("mode not matched");
  
};

var secure_server;
function startHTTPSServer() {
  'use strict';
  var keys;
  if (!fs.existsSync('certs/my-server.key.pem')) {
    console.warn('Certs not generated. Not testing HTTPS.');
    return;
  }

  if (mode === MODES.SSL_SPOOF) {
    keys = {
      key: fs.readFileSync('certs/unrooted.key.pem'),
      cert: fs.readFileSync('certs/unrooted.crt.pem')
    };
  } else {
    keys = {
      key: fs.readFileSync('certs/my-server.key.pem'),
      cert: fs.readFileSync('certs/my-server.crt.pem')
    };
  }
  secure_server = https.createServer(keys, onRequest);
  secure_server.listen(port + 1, function () {
    serverDestroyer(secure_server);
  });
}

restartHTTPSServer = function () {
  'use strict';
  if (secure_server) {
    secure_server.destroy(function () {
      startHTTPSServer();
    });
  } else {
    startHTTPSServer();
  }
};

function setMode(newmode) {
  'use strict';
  var needRestart = false;
  if (newmode === MODES.SSL_SPOOF || mode === MODES.SSL_SPOOF) {
    needRestart = true;
  }

  if (newmode === MODES.DROP_PACKAGE) {
    ipTables.enablePackageDrop(ssl_port, addLog.bind({}, LOG_LEVELS.SERVER));
    ipTables.enablePackageDrop(port, addLog.bind({}, LOG_LEVELS.SERVER));
  }

  if (mode === MODES.DROP_PACKAGE) {
    ipTables.disablePackageDrop(ssl_port, addLog.bind({}, LOG_LEVELS.SERVER));
    ipTables.disablePackageDrop(port, addLog.bind({}, LOG_LEVELS.SERVER));
  }

  mode = newmode;
  if (needRestart) {
    restartHTTPSServer();
  }
  console.log('Mode is now ' + mode);

  sendSSE('mode', newmode.toString());
  addLog(LOG_LEVELS.SERVER, 'Mode is now ' + MODES_VERBOSE[mode]);
}

if (!module.parent) {
  var argv = minimist(process.argv.slice(2));
  setOptions(argv);

  if (argv.h || argv.help) {
    usage();
    process.exit(0);
  } else {
    server = http.createServer(onRequest).listen(port);
    startHTTPSServer();
  }
} else {
  module.exports = function (options) {
    'use strict';
    setOptions(options);
    console.log('Server listening on port', port);
    server = http.createServer(onRequest).listen(port);
    startHTTPSServer();
    var resp = {
      MODES: MODES,
      stop: function () {
        if (server) {
          server.close();
        }
        if (secure_server) {
          secure_server.destroy();
        }
      },
      setMode: setMode
    };
    return resp;
  };
}

