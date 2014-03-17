/*global define, navigator, console, XMLHttpRequest, setTimeout*/
define(function (require, exports, module) {
    "use strict";


    var waittime = 1000,
        run = false,
        callbacks = [],
        pending = [],
        results = {0: [], 1: [], 2: []};
  
    function interpret(callback) {
        var concensus = [0.0, 0.0, 0.0],
            i = 0,
            j = 0;
        for (i = 0; i < 3; i += 1) {
            for (j = 0; j < results[i].length; j += 1) {
                if (results[i][j]) {
                    concensus[i] += 1.0;
                }
            }
            if (concensus[i] / results[i].length > 0.5) {
                concensus[i] = 1;
            } else {
                concensus[i] = 0;
            }
        }
      
        if (concensus[0]) {
            return callback('Connected');
        } else if (concensus[1] || concensus[2]) {
            return callback('Blocked');
        } else {
            return callback('Disconnected');
        }
    }
  
    function finishDispatch() {
        var i;
        if (!pending.lenth) {
            for (i = 0; i < callbacks.length; i += 1) {
                interpret(callbacks[i]);
            }
            callbacks = [];
        }
    }
  
    function cleanup(xhr) {
        var index = pending.indexOf(xhr);
        if (index > -1) {
            pending.splice(index, 1);
        }
    }

    function done(category, xhr) {
        results[category].push(1);
        cleanup(xhr);
        finishDispatch();
    }

    function progress(category, xhr, event) {
        if (event.lengthComputable && event.loaded > 0) {
            results[category].push(1);
            xhr.abort();
            cleanup(xhr);
            finishDispatch();
        }
    }

    function error(category, xhr, err) {
        cleanup(xhr);
        console.warn(err);
        if (err.message.contains("INVALID")) {
            results[category].push(1);
        } else {
            results[category].push(0);
        }
        finishDispatch();
    }
  
    function timeout(category, xhr) {
        if (pending.indexOf(xhr) > -1) {
            cleanup(xhr);
            results[category].push(0);
            finishDispatch();
        }
    }

    function dispatch(url, cat) {
        var xhr = new XMLHttpRequest();
        pending.push(xhr);
        xhr.addEventListener("progress", progress.bind({}, cat, xhr), false);
        xhr.addEventListener("load", done.bind({}, cat, xhr), false);
        xhr.addEventListener("error", error.bind({}, cat, xhr), false);
        xhr.timeout = waittime;
        xhr.ontimeout = timeout.bind({}, cat, xhr);

        xhr.open("HEAD", url);
        xhr.send();
    }


    /*
     * Class determining the current connectivity status of the domain.
     * Usage: require('liveness').getStatus(callback)
     * Status passed to your callback will be one of:
     *   Connected - Domain appears accessible.
     *   Disconnected - Internet appears unavailable.
     *   Blocked - This domain appears unavailable, but others are.
     * @param {Function} callback Function to call once status is determined.
     */
    function getStatus(callback) {
        if (run && !callbacks.length) {
            return interpret(callback);
        }
        if (!callbacks.length) {
            run = true;
            // Signals used for status:
            // 1. XHR for /activist.js
            dispatch('/activist.js', 0);
            // 2. XHR for [safe domains]
            results[1] = [navigator.onLine];
            dispatch('http://www.google.com', 1);
            // 3. XHR for [friendly domains]
            dispatch('http://www.p2pbr.com', 2);
        }
        callbacks.push(callback);
    }

    exports.getStatus = getStatus;
});