'use strict';

let gulp = require('gulp');
let wrench = require('wrench');

let $ = require('gulp-load-plugins')({
  pattern: ['run-sequence']
});

gulp.task('clean', (cb) => {
  cb();
});
