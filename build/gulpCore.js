'use strict';

var JsForth = require('./jsForth.js');
var fs = require('fs');

var sourceFiles = ['/Users/xlarue/Work/paxl/jsForth/src/forth/kernel.f'];
var inputStream = '';

sourceFiles.forEach(function (fileName) {
  console.log('Reading', fileName);

  var data = void 0;

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

var jsForth = new JsForth(function (s) {
  return process.stdout.write(s);
}, function (c) {
  var s = String.fromCharCode(c);
  if (c === 13) {
    process.stdout.write('\n');
  }
  process.stdout.write(s);
});

jsForth.pushIntoInputBuffer(inputStream);

module.exports = exports = {
  jsForth: jsForth,
  killForth: function killForth() {
    console.log('kill me now');
  },
  sendInputIn: function sendInputIn(s) {
    jsForth.pushIntoInputBuffer(s);
  }
};