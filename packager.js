/*jslint node:true*/
'use strict';

var fs = require('fs');
var zipstream = require('zip-stream');
var activist = require('activist/packager');
var version = JSON.parse(fs.readFileSync(require.resolve('activist/package.json'))).version;

var files = {
  'activist.html': require.resolve('activist/assets/frame.html'),
  'activist-offline.html': require.resolve('activist/assets/offline.html'),
  'activist.appcache': require.resolve('activist/assets/cache.appcache'),
  'README.md': __dirname + '/assets/README.md'
};
var orderedFiles = [];
Object.keys(files).forEach(function (file) {
  orderedFiles.push({
    name: file,
    data: fs.readFileSync(files[file]).toString().replace(/%%PREFIX%%/g, '/activist')
  });
});

var activistTemplate;

activist({
  message: '%%MSG%%',
  style: {
    display: "block",
    position: "fixed",
    background: "#f14141",
    color: "#333",
    fontWeight: "700",
    textAlign: "center",
    top: "10vh",
    height: "80vh",
    left: 0,
    width: "100%",
    padding: "10px",
    fontFamily: "sans-serif"
  }
}, function (data) {
  activistTemplate = data.split('%%MSG%%');
});

var next = function (s, n, err) {
  if (err) {
    s.finish();
    return;
  }
  if (n > 3) {
    s.finish();
  } else {
    s.entry(orderedFiles[n].data.replace(/%%DATE%%/g, new Date()), {name: orderedFiles[n].name}, next.bind({}, s, n + 1));
  }
};

var makeActivist = function (msg) {
  return activistTemplate[0] + "\"+" + JSON.stringify(msg) + "+\"" + activistTemplate[1];
};

exports.pack = function (msg) {
  var stream = new zipstream({'comment': 'Activist ' + version + '. Generated ' + new Date()});

  stream.entry(makeActivist(msg), {name: 'activist.js'}, function (err) {
    if (err) {
      stream.finish();
      throw err;
    }
    next(stream, 0);
  });
  return stream;
};
