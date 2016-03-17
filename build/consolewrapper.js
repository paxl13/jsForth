'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  var self = this;

  self.printString = printString;
  self.printChar = printChar;

  self.keypressFct = undefined;

  function printString(s) {
    process.stdout.write(s);
  }

  function printChar(c) {
    var s = String.fromCharCode(c);
    if (c === 13) {
      process.stdout.write('\n');
    }
    process.stdout.write(s);
  }

  function handleKeypress(ch, key) {
    if (key && key.ctrl && key.name === 'c') {
      process.stdin.pause();
    }

    if (self.keypressFct) {
      self.keypressFct(ch);
    }
  }

  function init() {
    keypress(process.stdin);

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('keypress', handleKeypress);
  }

  init();
};

var keypress = require('keypress');