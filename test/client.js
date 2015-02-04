/*jslint node:true */
/*globals describe, it, beforeEach, afterEach, before, after */

describe("Activist Characterization", function () {
  'use strict';
  var expect = require('chai').expect,
    server = require('./server')({
      port: 8080,
      root: "site/"
    }),
    browser = require('selenium-standalone'),
    activeSelenium;

  // Make sure selenium is up.
  before(function (done) {
    var self = this;
    browser.start(function (err, child) {
      if (err) {
        // give some time to install.
        self.timeout(1000000);
        console.warn('Installing Selenium on first run.');
        browser.install(function (err) {
          if (err) {
            console.error(err);
            done(false);
          } else {
            self.timeout(5000);
            browser.start(function (err, child) {
              if (err) {
                console.error(err);
                done(false);
              } else {
                activeSelenium = child;
                done();
              }
            });
          }
        });
      } else {
        activeSelenium = child;
        done();
      }
    });
  });

  after(function () {
    if (activeSelenium) {
      activeSelenium.kill();
    }
  });
  
  it("Characterizes Chrome", function () {
    expect(true).to.equal(true);
  });
});