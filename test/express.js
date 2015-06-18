var express = require('express');
var app = express();

var activist = require('../express');

app.use(activist());

app.use(express.static('./'));
app.listen(8080);
