/*jslint node:true*/
/*global navigator, document, console */
var liveness = require('./liveness').getStatus;
var fetchHandler = require('./serviceworker');
var activist = {};

activist.connect = function () {
  'use strict';
  var scripts = document.getElementsByTagName('script'),
    script = scripts[scripts.length - 1],
    scriptSrc = script.src;
  if (navigator && navigator.serviceWorker) {
    // Service Worker Entry
    navigator.serviceWorker.register(scriptSrc, {
      scope: "/*"
    }).then(function (worker) {
      console.log('got worker: ' + worker);
      fetchHandler.query(navigator.serviceWorker).then(function (state) {
        liveness(state, activist.render);
      });
    }, function (err) {
      console.error(err);
    });
  } else {
    // appCache Entry
    liveness([], activist.render);
  }
};

activist.serve = function () {
  'use strict';
  console.log("Registering service worker.");
  fetchHandler.register(['fallback.html', 'activist.js']);
};

activist.render = function (status) {
  'use strict';
  console.log('Status is: ', status);
};

if (typeof document !== 'undefined') {
  activist.connect();
} else {
  activist.serve();
}
