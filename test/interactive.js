/*jslint node:true, nomen:true */
"use strict";

/**
 * Interactive test server for experimenting with application cache.
 */

var express = require('express');
var minimist = require('minimist');
var server = require('./server');
var serverEvent = require('server-event');

var argv = minimist(process.argv.slice(2));
var runningServer = server(argv);

var sseClients = [];

function sendSSE(event, data) {
  sseClients.forEach(function (client) {
    client.sse(event, data);
  });
}
runningServer.logs.listener = sendSSE;


/** Control server **/
var app = express();

// serve static files from 
app.use('/', express['static'](__dirname + "/backend"));

// return collected logs as json object
app.get('/logs', function (req, res) {
  res.send(JSON.stringify(runningServer.logs));
});

// return server modes
app.get('/modes', function (req, res) {
  res.send(JSON.stringify(runningServer.MODES_VERBOSE));
});

// return current mode
app.get('/mode', function (req, res) {
  res.send(runningServer.getMode().toString());
});

app.post('/mode/:mode', function (req, res) {
  runningServer.setMode(parseInt(req.params.mode, 10));
  res.send(req.params.mode);
});

// initialize server sent events to push logs
serverEvent = serverEvent();

app.get('/sse', function (req, res) {
  serverEvent(req, res);
  sseClients.push(res);
  res.sse("console", "SSE initialized");
});

// start the maintenance server
var mserver = app.listen(argv.maintenance_port, function () {
  console.log('maintenance server listening on http://127.0.0.1:' + argv.maintenance_port);
});