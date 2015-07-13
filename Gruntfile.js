module.exports = function(grunt) {
  grunt.initConfig({
    browserify: {
      default: {
        files: {
          'dist/pouch-replicate-webrtc.js': 'index.js'
        },
        options: {
          browserifyOptions: {
            debug: false,
            standalone: 'pouchReplicate'
          }
        }
      }
    },
    uglify: {
      default: {
        files: {
          'dist/pouch-replicate-webrtc.min.js': "dist/pouch-replicate-webrtc.js"
        }
      }
    },
    watch: {
      default: {
        files: ['index.js'],
        tasks: ['dist']
      }
    }
  });

  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('dist', ['browserify', 'uglify'])
};
