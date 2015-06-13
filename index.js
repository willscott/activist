var express = require('express');
var http = require('http');
var cookieParser = require('cookie-parser');
var csrf = require('csurf');
var bodyParser = require('body-parser');
var packager = require('./packager');

var csrfProtection = csrf({ cookie: true });
var parseForm = bodyParser.urlencoded({ extended: false });

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.static(__dirname + '/static'));
app.use(cookieParser());

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
  res.setHeader('Content-Disposition', 'attachment; filename="activist.zip"');
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Transfer-Encoding', 'binary');
  var stream = packager.pack(req.body.message);
  stream.on('end', function() {
    if (res.finish) {
      res.finish();
    }
  });
  stream.pipe(res);
});

var server = http.createServer(app);
server.listen(8080);
