'use strict';

import 'babel-polyfill';
import ConsoleWrapper from './consoleWrapper';
import JsForth from './jsForth';

let consoleInput = new ConsoleWrapper();
let jsForth = new JsForth(consoleInput.printString, consoleInput.printChar);
consoleInput.keypressFct = jsForth.pushIntoInputBuffer;

function parse(s, output) {
  console.time('compiling');
  consoleInput.enableOutput = output;
  jsForth.pushIntoInputBuffer(s);
  consoleInput.enableOutput = true;
  console.timeEnd('compiling');
}

// fInject:./src/forth/kernel.f,false
// disable-Inject:./src/forth/mandelbroth.f,true
