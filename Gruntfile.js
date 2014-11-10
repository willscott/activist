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
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-browserify');

  grunt.registerTask('activist', [
    'jshint',
    'browserify'
  ]);

  grunt.registerTask('default', ['activist']);
};
