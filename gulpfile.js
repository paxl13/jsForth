'use strict';

let gulp = require('gulp');
let wrench = require('wrench');

let $ = require('gulp-load-plugins')({
  pattern: ['run-sequence']
});

wrench.readdirSyncRecursive('./gulp').filter((file) => {
  return (/\.(js|coffee)$/i).test(file);
}).map((file) => {
  require('./gulp/' + file);
});

gulp.task('default', ['clean', 'linting', 'watch'], () => {
});
