'use strict';

let gulp = require('gulp');
let sh = require('shelljs');
let c = require('./conf');
let $ = require('gulp-load-plugins')();
let transform = require('vinyl-transform');
let map = require('map-stream');
let fs = require('fs');


gulp.task('build', ['babel']);

gulp.task('copyJS', ['clean'], () => {
  return gulp.src(c.pathsGlobs.jsFiles)
    .pipe($.flatten())
    .pipe(gulp.dest(c.paths.build));
});

gulp.task('inject', ['copyJS'], () => {
  let forthInjector = transform(() => {
    return map((data, cb) => {
      let content = data.toString('utf8');
      let re = /fInject:(.*),(.*)/g
      let result;

      while((result = re.exec(content)) != null) {
        let filename = result[1];
        let output = result[2];

        var toInsert = `parse(\`${fs.readFileSync(filename).toString().replace(/\\/g, '\\\\')}\`, ${output});`;
        content = content + toInsert;
      }
      cb(null, new Buffer(content));
    });
  });

  return gulp.src('./build/index.js')
    .pipe(forthInjector)
    .pipe(gulp.dest('./build'));
});

gulp.task('babel', ['inject'], () => {
  return gulp.src('./build/**/*.js')
    .pipe($.babel())
    .pipe(gulp.dest('./build'));
});
