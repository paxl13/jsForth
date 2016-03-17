'use strict';

let gulp = require('gulp');
let c = require('./conf');
let $ = require('gulp-load-plugins')();

gulp.task('linting', () => {
  return gulp.src([c.pathsGlobs.jsFiles, `!${c.jsForth}`])
    .pipe($.jshint())
    .pipe($.jscs())
    .pipe($.jscsStylish.combineWithHintResults()) // combine with jshint results
    .pipe($.jshint.reporter('jshint-stylish'));
});
