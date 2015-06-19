var express = require('express');
var activist = require('activist');
var http = require('http');
var cookieParser = require('cookie-parser');
var csrf = require('csurf');
var bodyParser = require('body-parser');
var packager = require('./packager');

var csrfProtection = csrf({ cookie: true });
var parseForm = bodyParser.urlencoded({ extended: false });

var app = express();

app.disable('x-powered-by');

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.static(__dirname + '/static'));
app.use(cookieParser());
app.use(activist());

app.get('/faq.html', csrfProtection, function (req, res) {
  res.render('faq', { csrfToken: req.csrfToken() });
});

app.get('/', csrfProtection, function (req, res) {
  res.render('index', { csrfToken: req.csrfToken() });
});

app.use(function (err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);

  // handle CSRF token errors here
  res.status(403);
  res.end();
});

app.post('/dl', parseForm, csrfProtection, function (req, res) {
  var stream = packager.pack(req.body.message);
  var data = '';
  stream.on('data', function (chunk) {
    data += chunk;
  });

  stream.on('end', function() {
    res.writeHead(200, {
      'Content-Disposition': 'attachment; filename="activist.zip"',
      'Content-Type': 'application/octet-stream',
      'Content-Transfer-Encoding': 'binary',
      'Content-Length': data.length
    });

    res.end(data);
  });
});

var server = http.createServer(app);
server.listen(8080);
