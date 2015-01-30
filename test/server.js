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
var minimist = require('minimist');
var serverDestroyer = require('server-destroy');
var express = require('express');
var moment = require('moment');
var serverEvent = require('server-event');
var exec = require('child_process').exec;

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

var LOG_LEVELS = {
  SERVER : 0,
  CLIENT : 1
}

var logs = [];
var sseClients = [];



function usage() {
  'use strict'; 
  console.error("Usage: server.js [--port=8080] [--ssl_port=port+1] [--m_port=port+2] [--mode=0] [--root=./]");
  process.exit(1);
}

var argv = minimist(process.argv.slice(2));
var port = argv.port || 8080;
var ssl_port = argv.ssl_port || port + 1;
var maintenance_port = argv.m_port || port + 2;
var mode = argv.mode || MODES.NORMAL;
var root = argv.root || __dirname;

if (argv.h || argv.help) {
  usage();
}

function sendSSE(event, data){
  sseClients.forEach(function(client){
    client.sse(event, data);
  });
}

function addLog(level, message){
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

function enablePackageDrop(port_){
  addLog(LOG_LEVELS.SERVER, "enabling package drop on port "+ port_);
  exec('iptables -A INPUT -p tcp --destination-port '+port_+' -j DROP', function(error, stdout, stderr){
    addLog(LOG_LEVELS.SERVER, "[EXECV STDOUT] "+stdout);
    addLog(LOG_LEVELS.SERVER, "[EXECV STDERR] "+stderr);

    if (error !== null) {
      addLog(LOG_LEVELS.SERVER, "[EXECV ERR] "+error);
    }else{
      addLog(LOG_LEVELS.SERVER, "package drop enabled");      
    }
  });
}

function disablePackageDrop(port_){
  addLog(LOG_LEVELS.SERVER, "disabling package drop on port "+port_);
  exec('iptables -D INPUT -p tcp --destination-port '+port_+' -j DROP', function(error, stdout, stderr){
    addLog(LOG_LEVELS.SERVER, "[EXECV STDOUT] "+stdout);
    addLog(LOG_LEVELS.SERVER, "[EXECV STDERR] "+stderr);

    if (error !== null) {
      addLog(LOG_LEVELS.SERVER, "[EXECV ERR] "+error);
    }else{
      addLog(LOG_LEVELS.SERVER, "package drop disabled");      
    }
  });
}


var onRequest = function (req, res) {
  'use strict';
  var modes, file;
  
  addLog(LOG_LEVELS.CLIENT, "["+MODES_VERBOSE[mode]+"]["+req.url+"] "+req.headers['user-agent']);
  try {
    file = fs.readFileSync(root + req.url);
  } catch (e) {
    addLog(LOG_LEVELS.SERVER, "["+MODES_VERBOSE[mode]+"]["+req.url+"] File not found");
    return make_404(res);
  }

  if (mode === MODES.NORMAL || mode === MODES.SSL_SPOOF) {
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

  console.log("mode not matched");
  
};



var server = http.createServer(onRequest).listen(port);



var secure_server;
function restartHTTPSServer() {
  if (secure_server) {
    secure_server.destroy(function () {
      startHTTPSServer();
    });
  } else {
    startHTTPSServer();
  }
}

function startHTTPSServer() {
  var keys;
  if (mode === MODES.SSL_SPOOF) {
    keys = {
      key: fs.readFileSync('certs/unrooted.key.pem'),
      cert: fs.readFileSync('certs/unrooted.crt.pem')
    };
  } else {
    keys = {
      key: fs.readFileSync('certs/my-server.key.pem'),
      cert: fs.readFileSync('certs/my-server.crt.pem')
    }
  }
  secure_server = https.createServer(keys, onRequest);
  secure_server.listen(port + 1, function () {
    serverDestroyer(secure_server);
  });
};



startHTTPSServer();

changeMode(mode);

function changeMode(newmode, oldmode){

  if (newmode === MODES.SSL_SPOOF || mode === MODES.SSL_SPOOF) {
    mode = newmode;
    restartHTTPSServer();
  }

  if(newmode === MODES.DROP_PACKAGE){
    enablePackageDrop(ssl_port);
    enablePackageDrop(port);
  }

  if(oldmode === MODES.DROP_PACKAGE){
    disablePackageDrop(ssl_port);
    disablePackageDrop(port);
  }

  mode = newmode;
  console.log('Mode is now ' + mode);

  sendSSE("mode",newmode.toString());
  addLog(LOG_LEVELS.SERVER, "Mode is now "+MODES_VERBOSE[mode]);
}


/** maintenance server **/
var app = express();

// serve static files from 
app.use('/',express.static(__dirname+"/backend"));

// return collected logs as json object
app.get('/logs', function(req, res){
  res.send(JSON.stringify(logs));
});

// return server modes
app.get('/modes', function(req, res){
  res.send(JSON.stringify(MODES_VERBOSE));
});

// return current mode
app.get('/mode', function(req, res){
  res.send(mode.toString());
});

app.post('/mode/:mode', function(req, res){
  var oldmode = mode;
  changeMode(parseInt(req.params.mode), mode);  
  res.send(oldmode.toString());
});

// initialize server sent events to push logs
serverEvent = serverEvent();

app.get('/sse', function(req, res){
  serverEvent(req, res);
  sseClients.push(res);
  res.sse("console","SSE initialized");
});

// start the maintenance server
var mserver = app.listen(maintenance_port, function(){
  console.log('maintenance server listening');
});





