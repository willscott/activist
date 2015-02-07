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

    it('Loads 302', function (done) {
      mode.setMode(mode.MODES.BLOCK_302);
      client.url('http://localhost:' + port + '/index.html')
        .refresh()
        .source(function (err, msg) {
          expect(msg.value).to.contain('content is unvailable');
        })
        .call(done);
    });

    it('Loads Block Page', function (done) {
      mode.setMode(mode.MODES.BLOCK_ALL);
      client.url('http://localhost:' + port + '/index.html')
        .refresh()
        .source(function (err, msg) {
          expect(msg.value).to.contain('content is unvailable');
        })
        .call(done);
    });

    it('Loads from Cache when server is off.', function (done) {
      // Make sure good cache page is there.
      mode.setMode(mode.MODES.NORMAL);
      client.url('http://localhost:' + port + '/index.html')
        .call(function () {
          // Wait for cache to finish.
          mode.setMode(mode.MODES.OFF, function () {
            client.url('http://localhost:' + port + '/index.html')
              .refresh()
              .source(function (err, msg) {
                expect(msg.value).to.contain('AppCache Invoked.');
              })
              .call(done);
          });
        });
    });

    it('Loads the Cache on other pages when server Off', function (done) {
      // Make sure good cache page is there.
      mode.setMode(mode.MODES.NORMAL);
      client.url('http://localhost:' + port + '/index.html')
        .call(function () {
          // Wait for cache to finish.
          mode.setMode(mode.MODES.OFF, function () {
            client.url('http://localhost:' + port + '/page.html')
              .refresh()
              .source(function (err, msg) {
                expect(msg.value).to.contain('AppCache Invoked.');
              })
              .call(done);
          });
        });
    });

    it('Loads the Cache on other pages when server On', function (done) {
      // Make sure good cache page is there.
      mode.setMode(mode.MODES.NORMAL);
      client.url('http://localhost:' + port + '/index.html')
        .call(function () {
          // Wait for cache to finish.
          client.url('http://localhost:' + port + '/page.html')
            .source(function (err, msg) {
              expect(msg.value).to.contain('AppCache Invoked.');
            })
            .call(done);
        });
    });
  };
};
