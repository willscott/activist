/*jslint node:true*/
var exec = require('child_process').exec;

exports.enablePackageDrop = function (port, log) {
  'use strict';
  log("enabling package drop on port " + port);
  exec('iptables -A INPUT -p tcp --destination-port ' + port + ' -j DROP', function (error, stdout, stderr) {
    log("[EXECV STDOUT] " + stdout);
    log("[EXECV STDERR] " + stderr);

    if (error !== null) {
      log("[EXECV ERR] " + error);
    } else {
      log("package drop enabled");
    }
  });
};

exports.disablePackageDrop = function (port, log) {
  'use strict';
  log("disabling package drop on port " + port);
  exec('iptables -D INPUT -p tcp --destination-port ' + port + ' -j DROP', function (error, stdout, stderr) {
    log("[EXECV STDOUT] " + stdout);
    log("[EXECV STDERR] " + stderr);

    if (error !== null) {
      log("[EXECV ERR] " + error);
    } else {
      log("package drop disabled");
    }
  });
};
