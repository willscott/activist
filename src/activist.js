/*global navigator, document, console */
(function () {
    'use strict';
    var distress = {};
    
    distress.connect = function () {
        var scripts = document.getElementsByTagName('script'),
            script = scripts[scripts.length - 1],
            scriptSrc = script.src;
        if (navigator && navigator.serviceWorker) {
            navigator.serviceWorker.register(scriptSrc, {
                scope: "/*"
            }).then(function (worker) {
                console.log('got worker: ' + worker);
            }, function (err) {
                console.error(err);
            });
        }
    };

    distress.serve = function () {
        console.warn("added as service worker");
    };

    if (typeof document !== 'undefined') {
        distress.connect();
    } else {
        distress.serve();
    }
}());