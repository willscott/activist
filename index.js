var express = require('express');
var http = require('http');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.static(__dirname + '/static'));

app.get('/', function (req, res) {
  res.render('index');
});

var server = http.createServer(app);
server.listen(8080);
