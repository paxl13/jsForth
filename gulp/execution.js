'use strict';

let gulp = require('gulp');
let sh = require('shelljs');
let c = require('./conf');
let $ = require('gulp-load-plugins')();
let forthCore = undefined;

gulp.task('execute', (cb) => {
  console.log(`Starting the beast!`);
//  console.log(sh.exec(`cd ${c.executablePath} && node ${c.executable}`));
  forthCore = require('../src/js/gulpCore.js');
  cb();
});

gulp.task('proxyTTY', ['execute'], (cb) => {
  console.log(forthCore);
  forthCore.sendInputIn('1 2 + .s\n');
//  forthCore.killForth();

  setTimeout(() => cb(), 5000);
});

gulp.task('watch', () => {
  return gulp.watch([c.pathsGlobs.jsFiles, c.pathsGlobs.fFiles], ['linting', 'build']);
});
