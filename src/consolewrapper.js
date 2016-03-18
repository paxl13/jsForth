'use strict';
var keypress = require('keypress');

export default function () {
  let self = this;

  self.printString = printString;
  self.printChar = printChar;
  self.enableOutput = true;

  self.keypressFct = undefined;

  function printString(s) {
    if (self.enableOutput) {
      process.stdout.write(s);
    }
  }

  function printChar(c) {
    var s = String.fromCharCode(c);
    if (c === 13) {
      process.stdout.write('\n');
    }

    if (self.enableOutput) {
      process.stdout.write(s);
    }
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
}
