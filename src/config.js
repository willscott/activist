/*jslint node:true*/
/*global document */
'use strict';

// The relative path to the activist script.
exports.url = '/activist.js';

// The relative path to an HTML page activing the application cache
exports.frame = '/activist-frame.html';

// The relative path to the HTML page to show when offline (which should load activist.js)
exports.offline = '/activist-offline.html';

// The content to display when censorship is detected.
exports.message = 'Your connection to this site was disrupted by your network. Consider an alternative method of access.';

// A remote API to query to see if the server is really offline, or jsut locally inaccessable.
exports.service = 'https://www.sitestat.us/status.js?l=';

// CSS styles for the warning.
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

// Files (again relative URLs) to explicitly keep cached.
exports.explictCache = [];

// Sites may customize these settings by setting activistcfg rather than
// recompiling activist.
if (typeof window !== 'undefined' && window.activistcfg) {
  for (var i in window.activistcfg) {
    if (window.activistcfg.hasOwnProperty(i)) {
      exports[i] = window.activistcfg[i];
    }
  }
}
