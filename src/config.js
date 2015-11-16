/*jslint node:true*/
/*global document */
'use strict';

exports.url = '/activist.js';
exports.frame = '/activist-frame.html';
exports.offline = '/activist-offline.html';
exports.message = 'Your connection to this site was disrupted by your network. Consider an alternative method of access.';
exports.service = 'https://www.sitestat.us/status.js?l=';
exports.style = {
  display: "block",
  position: "fixed",
  background: "#d14836",
  color: "white",
  fontWeight: "700",
  textAlign: "center",
  top: 0,
  left: 0,
  width: "100%",
  padding: "10px",
  fontFamily: "sans-serif"
};

// Allow runtime configuration of the script.
if (typeof window !== 'undefined' && window.activistcfg) {
  for (var i in window.activistcfg) {
    if (window.activistcfg.hasOwnProperty(i)) {
      exports[i] = window.activistcfg[i];
    }
  }
}
