/*!
* gulp
* $ npm install gulp-jshint gulp-concat gulp-notify gulp-rename gulp-livereload del --save-dev
*/
 
// Load plugins
var gulp = require('gulp'),
jshint = require('gulp-jshint'),
concat = require('gulp-concat-util'),
notify = require('gulp-notify'),
rename = require('gulp-rename'),
uglify = require('gulp-uglify'),
livereload = require('gulp-livereload'),
del = require('del');

gulp.task('scripts', function() {
return gulp.src('src/scripts/**/*.js')
  .pipe(jshint('.jshintrc'))
  .pipe(jshint.reporter('default'))
  .pipe(concat('uiFormValidation.js', {process: function(src) { return (src.trim() + '\n').replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1'); }}))
  .pipe(concat.header('(function(window, document, undefined) {\n\'use strict\';\n'))
  .pipe(concat.footer('\n})(window, document);\n'))
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