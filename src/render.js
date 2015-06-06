/*jslint node:true*/
/*global document */
'use strict';

exports.render = function () {
  var hero = document.createElement('div'),
    style = require('./config').style,
    prop;
  hero.innerHTML = require('./config').message;

  for (prop in style) {
    if (style.hasOwnProperty(prop)) {
      hero.style[prop] = style[prop];
    }
  }
  document.body.appendChild(hero);
};
