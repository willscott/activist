/*jslint node:true*/
/*global self, navigator, caches, console, Request, fetch, Promise, setTimeout*/

// Register the service worker.
function register(fallbacks) {
  'use strict';
  self.addEventListener('install', function (event) {
    event.waitUntil(caches.open().then(function (cache) {
      cache.addAll(fallbacks.map(function (url) {
        return new Request(url, {mode: 'no-cors'});
      })).then(function () {
        console.log('fallback ready.');
      });
    }).catch(function () {
      console.warn('Registration of activist.js failed.');
    }));
  });
  
  self.addEventListener('message', function (event) {
    //TODO: histogram of state of recent requests.
    event.source.postMessage('ACTIVE!');
  });

  self.addEventListener('fetch', function (event) {
    event.respondWith(caches.match(event.request).then(function (response) {
      if (response) {
        return response;
      }
      return fetch(event.request).then(function (response) {
        return response;
      }).catch(function (err) {
        var fallback = new Request(fallbacks[0], {mode: 'no-cors'});
        return caches.match(fallback).then(function (response) {
          if (response) {
            return response;
          }
          console.warn('Failed to find preloaded fallback on error');
          throw err;
        });
      });
    }));
  });
}

// Query the service worker for its state, return promise for that state.
function query(worker) {
  'use strict';
  return new Promise(function (resolve, reject) {
    worker.controller.addEventListener('message', function (msg) {
      resolve(msg.data);
    });
    worker.controller.postMessage('ping');
  });
}

exports.register = register;
exports.query = query;
