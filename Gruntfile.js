module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      distress: ['src/*.js']
    },
    concat: {
      distress: {
        src: ['src/*.js'],
        dest: 'distress.js'
      }
    },
    uglify: {
      distress: {
        files: {
          'distress.min.js': ['distress.js']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('distress', [
    'jshint',
    'concat',
    'uglify'
  ]);

  grunt.registerTask('default', ['distress']);
};
