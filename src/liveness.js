/*jslint node:true*/
/*global navigator, console, XMLHttpRequest, setTimeout*/
var waittime = 1000,
  run = false,
  callbacks = [],
  pending = [],
  results = {0: [], 1: [], 2: []};

function interpret(callback) {
  'use strict';
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

  console.log('Activist.js Concensus', concensus);
  if (concensus[0]) {
    return callback('Connected');
  } else if ((concensus[1] || concensus[2]) &&
             results[0].length > 0) {
    return callback('Blocked');
  } else if (results[1].length > 1) {
    return callback('Disconnected');
  } else {
    return callback('Pending');
  }
}

function finishDispatch() {
  'use strict';
  interpret(function (state) {
    var i;
    if (state !== 'Pending') {
      for (i = 0; i < callbacks.length; i += 1) {
        callbacks[i](state);
      }
      callbacks = [];
    }
  });
}

function cleanup(xhr) {
  'use strict';
  var index = pending.indexOf(xhr);
  if (index > -1) {
    pending.splice(index, 1);
  }
}

function done(category, xhr, cb) {
  'use strict';
  if (cb(xhr.responseText)) {
    results[category].push(1);
  } else {
    results[category].push(0);
  }
  cleanup(xhr);
  finishDispatch();
}

function progress(category, xhr, event) {
  'use strict';
  if (event.lengthComputable && event.loaded > 0) {
    results[category].push(1);
    xhr.abort();
    cleanup(xhr);
    finishDispatch();
  }
}

function error(category, xhr, err) {
  'use strict';
  cleanup(xhr);
  console.warn(err);
  if (err.message && err.message.contains("INVALID")) {
    results[category].push(1);
  } else {
    results[category].push(0);
  }
  finishDispatch();
}

function timeout(category, xhr) {
  'use strict';
  if (pending.indexOf(xhr) > -1) {
    cleanup(xhr);
    results[category].push(0);
    finishDispatch();
  }
}

function dispatch(url, cat, callback) {
  'use strict';
  // If we can do an XHR to the url.
  var req;
  if (callback) {
    req = new XMLHttpRequest();
    pending.push(req);
    req.addEventListener("progress", progress.bind({}, cat, req), false);
    req.addEventListener("load", done.bind({}, cat, req, callback), false);
    req.addEventListener("error", error.bind({}, cat, req), false);
    req.timeout = waittime;
    req.ontimeout = timeout.bind({}, cat, req);

    req.open("HEAD", url);
    req.send();
  } else {
    req = document.createElement('img');
    req.addEventListener("load", done.bind({}, cat, req), false);
    req.addEventListener("error", error.bind({}, cat, req), false);
    pending.push(req);
    req.style.width = req.style.height = 0;
    if (document && document.body) {
      document.head.appendChild(req);
    } else {
      window.addEventListener('load', function (img) {
        document.head.appendChild(img);
      }.bind({}, req));
    }
  }
}


/*
 * Class determining the current connectivity status of the domain.
 * Usage: require('liveness').getStatus([], callback)
 * Status passed to your callback will be one of:
 *   Connected - Domain appears accessible.
 *   Disconnected - Internet appears unavailable.
 *   Blocked - This domain appears unavailable, but others are.
 * @param {Array} state Known request states influencing this call for status.
 * @param {Function} callback Function to call once status is determined.
 */
function getStatus(state, callback) {
  'use strict';
  if (run && !callbacks.length) {
    return interpret(callback);
  }
  if (!callbacks.length) {
    run = true;
    // Signals used for status:
    // 1. XHR for /activist.js
    results[0] = state;
    dispatch('/activist.js?rand=' + Math.random(), 0, function (script) {
      return script.indexOf("This-is-Network-Interference!") > 0;
    });
    // 2. XHR for [safe domains]
    results[1] = [navigator.onLine];
    dispatch('https://www.google.com/favicon.ico', 1, false);
    dispatch('https://www.baidu.com/favicon.ico', 1, false);
    dispatch('https://www.yandex.ru/favicon.ico', 1, false);
    dispatch('https://www.bbc.co.uk/favicon.ico', 1, false);
    dispatch('https://www.sfr.fr/favicon.ico', 1, false);
    // 3. XHR for [friendly domains]
    dispatch('https://www.p2pbr.com/clientinfo.js?l' + window.location.href,
             2, function (script) {
        return script.indexOf("down") > -1;
      });
  }
  callbacks.push(callback);
}

exports.getStatus = getStatus;
