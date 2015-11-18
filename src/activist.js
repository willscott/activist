/*jslint node:true*/
/*global navigator, document, console */
'use strict';

var liveness = require('./liveness').getStatus;
var fetchHandler = require('./serviceworker');
var activist = {};

activist.connect = function () {
  var script = require('./config').url;
  if (navigator && navigator.serviceWorker) {
    // Service Worker Entry
    navigator.serviceWorker.register(script, {
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
    // Wait until loaded:
    if (document.readyState !== 'complete') {
      return window.addEventListener('load', activist.appCache, true);
    }

    // Register the appCache.
    var iframe = document.createElement('iframe');
    iframe.src = require('./config').frame;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
  }
};

activist.serve = function () {
  console.log("Registering service worker.");
  var config = require('./config');
  fetchHandler.register([config.offline, config.url]);
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
