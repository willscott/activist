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
      textAlign: "center",
      top: 0,
      left: 0,
      width: "100%",
      padding: "10px",
      fontFamily: "sans-serif"
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
