'use strict';

let gulp = require('gulp');
let sh = require('shelljs');
let c = require('./conf');
let $ = require('gulp-load-plugins')();

gulp.task('build', ['babel']);

gulp.task('copyJS', ['clean'], () => {
  return gulp.src(c.pathsGlobs.jsFiles)
    .pipe($.flatten())
    .pipe(gulp.dest(c.paths.build));
});

gulp.task('inject', ['copyJS'], () => {
  return gulp.src('./build/index.js')
    .pipe($.inject(gulp.src([c.pathsGlobs.kFFiles, c.pathsGlobs.fFiles]), {
      starttag: '// files: {{ext}}',
      endtag: '// end',
      transform: (filename, file) => {
        let content = file.contents.toString('utf8');
        content = content.replace(/\\/g, '\\\\');
        return `parse(\`${content}\`);`;
      }
    }))
    .pipe(gulp.dest('./build'));
});

gulp.task('babel', ['inject'], () => {
  return gulp.src('./build/**/*.js')
    .pipe($.babel())
    .pipe(gulp.dest('./build'));
});
