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
var net = require('net');
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
  DROP_PACKAGE: 7,
  OFF: 8
};

var MODES_VERBOSE = [
    'normal',
    'never send',
    'ssl spoof',
    'block 404',
    'block 302',
    'block all',
    'close empty',
    'drop package',
    'off'
  ];
var port = 8080;
var ssl_port = port + 1;
var maintenance_port = port + 2;
var mode = MODES.NORMAL;
var root = __dirname;
var server, secure_server;
var certs = root + '/certs';

function setOptions(opts) {
  'use strict';
  if (opts.port) {
    port = opts.port;
  }
  if (opts.certs) {
    certs = opts.certs;
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


function usage() {
  'use strict';
  console.error("Usage: server.js [--port=8080] [--ssl_port=port+1] [--m_port=port+2] [--mode=0] [--root=./]");
  process.exit(1);
}

function addLog(level, message) {
  'use strict';
  var logEntry = [moment().format(), level, message];
  logs.push(logEntry);
  if (logs.listener) {
    logs.listener("log", logEntry);
  }
}

// can be used to simulate DNS forwarding
function setRoot(new_root){
  'use strict';
  var old_root = root;
  root = new_root;
  addLog(LOG_LEVELS.SERVER, "changed root from '"+old_root+"' to '"+root+"'");
}

function getRoot(){
  return root;
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
  var modes, file, filename, mimetype, notfound = false;

  addLog(LOG_LEVELS.CLIENT, "[" + MODES_VERBOSE[mode] + "][" + req.url + "] " + req.headers['user-agent']);
  try {
    if (req.url === '' || req.url === '/') {
      req.url = 'index.html';
    }
    filename = root + req.url;
    file = fs.readFileSync(filename);
    mimetype = mime.lookup(filename);
  } catch (e) {
    addLog(LOG_LEVELS.SERVER, "[" + MODES_VERBOSE[mode] + "][" + req.url + "] File not found");
    notfound = true;
  }

  if (mode === MODES.NORMAL || mode === MODES.SSL_SPOOF) {
    if (notfound) {
      return make_404(res);
    }
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
    if (req.url === "index.html") {
      return make_block(res);
    } else {
      return make_404(res);
    }
  } else if (mode === MODES.BLOCK_302) {
    if (req.url === "index.html") {
      return make_block(res);
    } else {
      return make_302(res);
    }
  } else if (mode === MODES.BLOCK_ALL) {
    return make_block(res);
  }
};

// A TCP server on port that closes TCP session with no HTTP headers after requests.
function startSocketServer() {
  'use strict';
  server = net.createServer(function (c) {
    c.on('data', function (d) {
      if (d.toString().indexOf('\r\n\r\n') > -1) {
        c.end();
      }
    });
  }).listen(port);
  serverDestroyer(server);
}

var secure_server;
function startHTTPSServer() {
  'use strict';
  var keys;
  if (!fs.existsSync(certs + '/my-server.key.pem')) {
    console.warn('Certs not generated. Not testing HTTPS.');
    return;
  }

  if (mode === MODES.SSL_SPOOF) {
    keys = {
      key: fs.readFileSync(certs + '/unrooted.key.pem'),
      cert: fs.readFileSync(certs + '/unrooted.crt.pem')
    };
  } else {
    keys = {
      key: fs.readFileSync(certs + '/my-server.key.pem'),
      cert: fs.readFileSync(certs + '/my-server.crt.pem')
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

function setMode(newmode, cb) {
  'use strict';
  var needRestart = false,
    cbed = false;
  if (!cb) {
    cb = function () {};
  }

  if (newmode === MODES.SSL_SPOOF || mode === MODES.SSL_SPOOF) {
    needRestart = true;
  }

  if ((mode === MODES.OFF ||
      mode === MODES.CLOSE_EMPTY) && (
      newmode !== MODES.OFF &&
      newmode !== MODES.CLOSE_EMPTY
    )) {
    if (mode === MODES.CLOSE_EMPTY) {
      server.destroy();
    }
    server = http.createServer(onRequest).listen(port, cb);
    serverDestroyer(server);
    cbed = true;
  }
  if (newmode === MODES.OFF ||
      newmode === MODES.CLOSE_EMPTY) {
    if (newmode === MODES.OFF) {
      server.destroy(cb);
    } else {
      server.destroy(startSocketServer);
    }
    cbed = true;
    server = null;
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
  if (!cbed && needRestart) {
    restartHTTPSServer(cb);
  } else if (!cbed) {
    cb();
  }
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
    serverDestroyer(server);
    startHTTPSServer();
    var resp = {
      MODES: MODES,
      MODES_VERBOSE: MODES_VERBOSE,
      stop: function () {
        if (server) {
          server.destroy();
        }
        if (secure_server) {
          secure_server.destroy();
        }
      },
      getMode: function () {
        return mode;
      },
      setRoot:setRoot,
      getRoot:getRoot,
      port: port,
      ssl_port: ssl_port,
      maint_port: maintenance_port,
      setMode: setMode,
      logs: logs
    };
    return resp;
  };
}
