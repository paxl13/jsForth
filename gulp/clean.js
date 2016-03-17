'use strict';

let gulp = require('gulp');
let sh = require('shelljs');
let $ = require('gulp-load-plugins')();
let c = require('./conf');

gulp.task('clean', (cb) => {
  sh.rm('-r', c.paths.build);
  cb();
});
