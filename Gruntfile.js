/*jslint node:true*/
module.exports = function (grunt) {
  'use strict';
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      activist: ['src/*.js'],
      options: {
        jshintrc: true
      }
    },
    browserify: {
      activist: {
        src: ['src/activist.js'],
        dest: 'activist.js'
      },
      options: {
        plugin: ["minifyify"]
      }
    },
    mochaTest: {
      characterize: {
        options: {
          reporter: 'spec',
          quite: false
        },
        src: ['test/client.js']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.registerTask('activist', [
    'jshint',
    'browserify'
  ]);

  grunt.registerTask('default', ['activist']);
};
