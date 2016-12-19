'use strict';

import 'babel-polyfill';
import ConsoleWrapper from './consoleWrapper';
import * as jsForth from './jsForth';

let consoleInput = new ConsoleWrapper();

jsForth.setPrintString(consoleInput.printString);
jsForth.setPrintChar(consoleInput.printChar);
consoleInput.keypressFct = jsForth.pushIntoInputBuffer;

//let jsForth = new JsForth(consoleInput.printString, consoleInput.printChar);

function parse(s, output) { // jshint ignore:line
  console.time('compiling');
  consoleInput.enableOutput = output;
  jsForth.pushIntoInputBuffer(s);
  consoleInput.enableOutput = true;
  console.timeEnd('compiling');
}

// f-Inject:./src/forth/kernel.f,true
// f-Inject:./src/forth/console.f,true
// f-Inject:./src/forth/mandelbroth.f,true
