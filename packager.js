/*jslint node:true*/
'use strict';

var browserify = require('browserify');
var fs = require('fs');
var zipstream = require('zip-stream');

var files = [
  'activist-frame.html',
  'activist-offline.html',
  'README.md',
].map(function (file) {
  return {name: file, data: fs.readFileSync('activist/' + file).toString() };
});

var appcache = fs.readFileSync('activist/activist.appcache').toString().split('#{buildtime}');
var activistTemplate;

function buildTemplate() {
  var b = browserify({debug: true});
  b.require('./views/render', {expose: './render'});
  b.add(require.resolve('activist/src/activist'));
  b.plugin('minifyify');
  b.bundle(function (err, buf) {
    if (err) {
      throw err;
    }
    activistTemplate = buf.toString().split('#{msg}');
  });
}
buildTemplate();

var next = function (s, n, err) {
  if (err) {
    s.finish();
    return;
  }
  if (n > 2) {
    s.finish();
  } else {
    s.entry(files[n].data, {name: files[n].name}, next.bind({}, s, n + 1));
  }
};

var makeActivist = function (msg) {
  return activistTemplate[0] + "\"+" + JSON.stringify(msg) + "+\"" + activistTemplate[1];
};

var makeAppcache = function () {
  return appcache[0] + new Date() + appcache[1];
}

exports.pack = function (msg) {
  var stream = new zipstream({'comment': 'Generated ' + new Date()});

  stream.entry(makeActivist(msg), {name: 'activist.js'}, function (err) {
    if (err) {
      s.finish();
      throw err;
    }
    stream.entry(makeAppcache(), {name: 'activist.appcache'}, next.bind({}, stream, 0));
  });
  return stream;
};
