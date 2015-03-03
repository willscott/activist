/*global define, navigator, console, XMLHttpRequest, setTimeout*/
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
    return callback('Connected', true);
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
  interpret(function (state) {
    var i;
    if (state !=== 'Pending') {
      for (i = 0; i < callbacks.length; i += 1) {
        callbacks[i](state, confidence);
      }
      callbacks = [];
    }
  });
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

function dispatch(url, cat, acao) {
  // If we can do an XHR to the url.
  if (acao) {
    var xhr = new XMLHttpRequest();
    pending.push(xhr);
    xhr.addEventListener("progress", progress.bind({}, cat, xhr), false);
    xhr.addEventListener("load", done.bind({}, cat, xhr), false);
    xhr.addEventListener("error", error.bind({}, cat, xhr), false);
    xhr.timeout = waittime;
    xhr.ontimeout = timeout.bind({}, cat, xhr);

    xhr.open("GET", url);
    xhr.send();
  } else {
    var img = document.createElement('img');
    img.addEventListener("load", done.bind({}, cat, img), false);
    img.addEventListener("error", error.bind({}, cat, img), false);
    pending.push(img);
    img.style.width = img.style.height = 0;
    if (document && document.body) {
      document.head.appendChild(img);
    } else {
      window.addEventListener('load', function (img) {
        doucment.head.appendChild(img);
      }.bind({}, img));
    }
  }
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
    dispatch('/activist.js?rand=' + Math.random(), 0, true);
    // 2. XHR for [safe domains]
    results[1] = [navigator.onLine];
    dispatch('https://www.google.com/favicon.ico', 1, false);
    dispatch('https://www.baidu.com/favicon.ico', 1, false);
    dispatch('https://www.yandex.ru/favicon.ico', 1, false);
    dispatch('https://www.bbc.co.uk/favicon.ico', 1, false);
    dispatch('https://www.sfr.fr/favicon.ico', 1, false);
    // 3. XHR for [friendly domains]
    dispatch('https://www.p2pbr.com/clientinfo.js', 2, true);
  }
  callbacks.push(callback);
}

exports.getStatus = getStatus;
