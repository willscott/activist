/*jslint node:true*/
/*global document */
'use strict';

exports.render = function () {
  var hero = document.createElement('div'),
    style = {
      display: "block",
      position: "fixed",
      background: "#f14141",
      color: "#333",
      fontWeight: "700",
      textAlign: "center",
      top: "10vh",
      height: "80vh",
      left: 0,
      width: "100%",
      padding: "10px",
      fontFamily: "sans-serif"
    },
    prop;
  hero.innerHTML = "#{msg}";

  for (prop in style) {
    if (style.hasOwnProperty(prop)) {
      hero.style[prop] = style[prop];
    }
  }
  document.body.appendChild(hero);
};
