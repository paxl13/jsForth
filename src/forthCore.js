'use strict';

import * as es6 from './es6Helpers';

// CONSTANTS

let coreEnums = Object.freeze({
  'RUNNING': Symbol(),
  'IOLOCKED': Symbol(),
  'REALWORD': Symbol(),
  'COMMENT': Symbol()
});

export const MEMORYSIZE = 64000;

export function enums() {
  return coreEnums;
};

function Core() {
  let self = this;

  // exposed API.
  self.createDictionaryEntry = createDictionaryEntry;

  let _stack = [];
  let _retStack = [];

  let _words = new Map();
  let _mem = [];

  let _ip = null;
  let _current = null;

  let LATEST = 0;
  let HERE = 0;

  function pushToHERE() {
    let notUndefined = es6.STATIC(pushToHERE, 'notUndefined', () => es6.filter(a => a !== undefined));

    for (let arg of notUndefined(arguments)) {
      _mem[HERE++] = arg;
    }
  }

  function createDictionaryEntry(name, flags, body, codeword) {
    let resolveWords = es6.STATIC(createDictionaryEntry, 'resolveWords', () => es6.map(w => isNaN(w) ? _words.get(w) : parseInt(w)));
    let oldHere = HERE;
    _words.set(name, HERE + 3);

    pushToHERE(LATEST, flags, name, codeword);
    pushToHERE(...(typeof(body) === 'function' ? [body] : [...resolveWords(body.split(' '))]));

    LATEST = oldHere;
  }

  function init() {
    for (let i = 0; i < MEMORYSIZE; i++) {
      _mem.push(null);
    }
  }

  init();
}

let core = new Core();

export function getCoreData() {
  return core;
}

export function resetCore() {
  core.reset();
}

export function defcode(name, flags, fct) {
  core.createDictionaryEntry(name, flags, fct);
}

export function defword(name, flags, words) {
  core.createDictionaryEntry(name, flags, words, DOCOL);
}

export function defvar(name, flags, defval) {
  var varAddr = HERE + 4;
  var fct = (function() {
    _mem[varAddr] = defval;

    return function VARIABLE() {
      _stack.push(varAddr);
      NEXT();
    };
  }());

  createDictionaryEntry(name, flags, fct);
  HERE++; // generate space for the variable !
  return varAddr;
}

