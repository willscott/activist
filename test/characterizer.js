/*jslint node:true */
/*globals describe, it, beforeEach, afterEach, before, after */

module.exports = function (port, mode, opts) {
  'use strict';
  var expect = require('chai').expect,
    driver = require('webdriverio'),
    client;

  return function () {
    before(function (done) {
      this.timeout(20000);
      client = driver.remote({
        desiredCapabilities: opts
      });
      client.init(done);
    });

    after(function (done) {
      client.end(done);
    });

    it('Loads Normally', function (done) {
      mode.setMode(mode.MODES.NORMAL);
      client.url('http://localhost:' + port + '/index.html')
        .title(function (err, res) {
          expect(res.value).to.equal('Activist.js Demo');
        })
        .call(done);
    });

    it('Loads 404', function (done) {
      mode.setMode(mode.MODES.BLOCK_404);
      client.url('http://localhost:' + port + '/index.html')
        .refresh()
        .source(function (err, msg) {
          expect(msg.value).to.contain('404 Not Found');
        })
        .call(done);
    });
  };
};
