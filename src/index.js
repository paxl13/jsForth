'use strict';

import 'babel-polyfill';
import ConsoleWrapper from './consoleWrapper';
import JsForth from './jsForth';

console.log(ConsoleWrapper);

let consoleInput = new ConsoleWrapper();
let jsForth = new JsForth(consoleInput.printString, consoleInput.printChar);
consoleInput.keypressFct = jsForth.pushIntoInputBuffer;

function parse(s) {
  jsForth.pushIntoInputBuffer(s);
}

// fInject:./src/forth/kernel.kf
// fInject:./src/forth/mandelbroth.f
