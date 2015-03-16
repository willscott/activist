/*jslint node:true*/
/*global navigator, document, console */
'use strict';

var liveness = require('./liveness').getStatus;
var fetchHandler = require('./serviceworker');
var activist = {};

activist.connect = function () {
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
      // Appcache downgrade
      activist.appCache();
    });
  } else {
    activist.appCache();
  }
};

activist.appCache = function () {
  // Is this loaded by the offline page?
  if (window.applicationCache.status > 0) {
    liveness([], activist.render);
  } else {
    // Register the appCache.
    var iframe = document.createElement('iframe');
    iframe.src = 'iframe.html';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
  }
};

activist.serve = function () {
  console.log("Registering service worker.");
  fetchHandler.register(['fallback.html', 'activist.js']);
};

activist.render = function (status) {
  console.log('Activist believes your connection is: ', status);
  if (status === "Blocked") {
    require('./render').render();
  }
};

if (typeof document !== 'undefined') {
  activist.connect();
} else {
  activist.serve();
}
