/*!
* gulp
* $ npm install gulp-jshint gulp-concat gulp-notify gulp-rename gulp-livereload del --save-dev
*/
 
// Load plugins

var gulp = require('gulp'),
  fs = require('fs'),
  streamqueue = require('streamqueue'),
  filelog = require('gulp-filelog'),
  templateCache = require('gulp-angular-templatecache'),
  jshint = require('gulp-jshint'),
  concat = require('gulp-concat-util'),
  notify = require('gulp-notify'),
  rename = require('gulp-rename'),
  uglify = require('gulp-uglify'),
  livereload = require('gulp-livereload'),
  del = require('del');

var config = {
    pkg : JSON.parse(fs.readFileSync('./package.json')),
    banner:
    '/*!\n' +
    ' * <%= pkg.name %>\n' +
    ' * <%= pkg.homepage %>\n' +
    ' * Version: <%= pkg.version %> - <%= timestamp %>\n' +
    ' * License: <%= pkg.license %>\n' +
    ' */\n\n\n'
    };

gulp.task('scripts', function() {
  var buildTemplates = function () {
    return gulp.src('src/templates/**/*.html')
      .pipe(templateCache({module: 'uiFormValidation'}));
  };
    
  var buildLib = function(){
    return gulp.src('src/scripts/**/*.js')
      .pipe(jshint('.jshintrc'))
      .pipe(jshint.reporter('default'));
  };
    
  return streamqueue({objectMode: true}, buildLib(), buildTemplates())
    .pipe(filelog())
    .pipe(concat('uiFormValidation.js', {process: function(src) { return (src.trim() + '\n').replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1'); }}))
    .pipe(concat.header('(function(window, document, undefined) {\n\'use strict\';\n'))
    .pipe(concat.header(config.banner, {
      timestamp: (new Date()).toISOString(), pkg: config.pkg
    }))
    .pipe(concat.footer('\n})(window, document);\n'))
    .pipe(concat.footer('\n// end of file\n'))
    .pipe(gulp.dest('dist/scripts'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify())
    .pipe(gulp.dest('dist/scripts'))
    .pipe(notify({ message: 'Scripts task complete' }));
});
 
gulp.task('clean', function(cb) {
  del(['dist/'], cb);
});
 
gulp.task('default', ['clean'], function() {
  gulp.start('scripts');
});
 
gulp.task('watch', function() {
 
  gulp.watch('src/scripts/**/*.js', ['scripts']);
  livereload.listen();
  gulp.watch(['dist/**']).on('change', livereload.changed);
 
});