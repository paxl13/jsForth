'use strict';

var JsForth = require('./jsForth.js');
var fs = require('fs');

let sourceFiles = ['/Users/xlarue/Work/paxl/jsForth/src/forth/kernel.f'];
var inputStream = '';

sourceFiles.forEach(function (fileName) {
  console.log('Reading', fileName);

  let data;

  try {
    data = fs.readFileSync(fileName);
  } catch (e) {
    console.error(fileName, 'not found');
    console.error('Exiting!');
    process.exit();
  }

  for (var i = 0; i < data.length; i++) {
    var charCode = String.fromCharCode(data[i]);
    inputStream += charCode;
  }
});

var jsForth = new JsForth(s => process.stdout.write(s), c => {
  var s = String.fromCharCode(c);
  if (c === 13) {
    process.stdout.write('\n');
  }
  process.stdout.write(s);
});

jsForth.pushIntoInputBuffer(inputStream);

module.exports = exports = {
  jsForth: jsForth,
  killForth() {
    console.log('kill me now');
  },
  sendInputIn(s) {
    jsForth.pushIntoInputBuffer(s);
  }
};