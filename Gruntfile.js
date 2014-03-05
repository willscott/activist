module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      activist: ['src/*.js'],
      options: {
        jshintrc: true
      }
    },
    concat: {
      activist: {
        src: ['src/*.js'],
        dest: 'activist.js'
      }
    },
    uglify: {
      activist: {
        files: {
          'activist.min.js': ['activist.js']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('activist', [
    'jshint',
    'concat',
    'uglify'
  ]);

  grunt.registerTask('default', ['activist']);
};
