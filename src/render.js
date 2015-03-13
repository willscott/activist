/*jslint node:true*/
/*global document */
'use strict';

exports.render = function () {
  var hero = document.createElement('div'),
    style = {
      display: "block",
      position: "fixed",
      background: "#d14836",
      color: "white",
      fontWeight: "700",
      textAlign: "center"
    },
    prop;
  hero.innerText = "Your connection to this site was disrupted by your network. Consider an alternative method of access.";

  for (prop in style) {
    if (style.hasOwnProperty(prop)) {
      hero.style[prop] = style[prop];
    }
  }
  document.body.appendChild(hero);
};
