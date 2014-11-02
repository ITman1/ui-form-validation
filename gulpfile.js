/*!
* gulp
* $ npm install gulp-jshint gulp-concat gulp-notify gulp-rename gulp-livereload del --save-dev
*/
 
// Load plugins

var gulp = require('gulp'),
  git = require('gulp-git'),
  bump = require('gulp-bump'),
  args   = require('yargs').argv,
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
  del = require('del'),
  runSequence = require('run-sequence'),
  replace = require('gulp-replace');

var versionArg = args.version;
versionArg = versionArg ? (versionArg.substring(0, 1) === "v" ? versionArg : "v" + versionArg) : undefined;

var getConfig = function () {
  return {
    pkg : JSON.parse(fs.readFileSync('./package.json')),
    banner:
    '/*!\n' +
    ' * <%= pkg.name %>\n' +
    ' * <%= pkg.homepage %>\n' +
    ' * Version: <%= pkg.version %> - <%= timestamp %>\n' +
    ' * License: <%= pkg.license %>\n' +
    ' */\n\n\n'
  };
}

var config = getConfig();

gulp.task('scripts', function() {
  var buildTemplates = function () {
    return gulp.src(['src/templates/**/*.html', 'src/templates/**/*.messages'])
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
 
gulp.task('release', ['release-tag'], function(callback){
  config = getConfig();
  runSequence('default', callback);
});

gulp.task('release-tag', ['release-commit'], function(){
  if (!versionArg) {
    throw "Missing argument with the version.";
  }
  
  return git.tag(versionArg, 'Released new version ' + versionArg + '.', function (err) {
    if (err) throw err;
  });
});

gulp.task('release-commit', ['release-package'], function(){
  if (!versionArg) {
    throw "Missing argument with the version.";
  }
  
  return gulp.src(['./bower.json', './package.json'])
    .pipe(git.commit('Updated package files before release of the version ' + versionArg + '.'));
});

gulp.task('release-package', function(){
  if (!versionArg) {
    throw "Missing argument with the version.";
  }
  
  return gulp.src(['./bower.json', './package.json'])
    .pipe(bump({version: versionArg}))
    .pipe(replace(/\x0A/g, '\x0D\x0A'))
    .pipe(gulp.dest('./'));
});





gulp.task('default', ['clean'], function() {
  gulp.start('scripts');
});
 
gulp.task('watch', function() {
 
  gulp.watch('src/scripts/**/*.js', ['scripts']);
  livereload.listen();
  gulp.watch(['dist/**']).on('change', livereload.changed);
 
});