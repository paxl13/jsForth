'use strict';

import * as es6 from './es6Helpers';
import * as forthCore from './forthCore';

let printLine;
let printChar;

var F_IMMED = 0x02;
var F_HIDDEN = 0x01;

var RUNNING = Symbol();
var IOLOCKED = Symbol();

var REALWORD = Symbol();
var COMMENT = Symbol();

var _stack = [];
_stack.getTOS = getTOS;
_stack.getNOS = getNOS;

var _retStack = [];

var MEMORYSIZE = 64000;

var _words = new Map();
var _mem = [];

var _ip = null;
var _current = null;

var _inputBuffer = [];
var _currentState;

var LATEST = 0;
var HERE = 0;

for (let i = 0; i < MEMORYSIZE; i++) {
  _mem.push(null);
}

var core = {
  'stack': _stack,
  'retStack': _retStack,
  'words': _words,
  'mem': _mem,
  'ip': _ip,
  'current': _current
}


export function NEXT() {
  _ip = _ip + 1;
  _current = _mem[_ip];
}

function _EXECUTEjs(nextCurrent) {
  _current = nextCurrent;
}

function DOCOL()  {
  _retStack.push(_ip);
  _ip = _current;
  NEXT();
}

function _COMMAjs(pAddr) {
  var here = _mem[hereAddr];
  _mem[here++] = pAddr;
  _mem[hereAddr] = here;
}

function getTOS() {
  return _stack[_stack.length - 1];
}

function getNOS() {
  return _stack[_stack.length - 2];
}

function getInputData() {
  if (_inputBuffer.length === 0) {
    _currentState = IOLOCKED;
    return null;
  }

  return _inputBuffer.shift();
}

function run() {
  _currentState = RUNNING;

  while (_currentState === RUNNING) {
    var op = _mem[_current];
    console.log(`executing ${op.name}, _current = ${_current}, _ip = ${_ip}, _stack = ${_stack}, _retStack = ${_retStack}`);
    op(core);
  }
}

function pushToHERE() {
  let notUndefined = es6.STATIC(pushToHERE, 'notUndefined', () => es6.filter(a => a !== undefined));

  for (let arg of notUndefined(arguments)) {
    _mem[HERE++] = arg;
  }
}

// LINK to prev word.
// FLAG,
// NAME,
// BODY -> can be function pointer 1 cell
//      -> or multiple cell for words.
function createDictionaryEntry(name, flags, body, codeword) {
  let resolveWords = es6.STATIC(createDictionaryEntry, 'resolveWords', () => es6.map(w => isNaN(w) ? _words.get(w) : parseInt(w)));
  let oldHere = HERE;
  _words.set(name, HERE + 3);

  pushToHERE(LATEST, flags, name, codeword);
  pushToHERE(...(typeof(body) === 'function' ? [body] : [...resolveWords(body.split(' '))]));

  LATEST = oldHere;
}

export function defcode(name, flags, fct) {
  createDictionaryEntry(name, flags, fct);
}

function defword(name, flags, words) {
  createDictionaryEntry(name, flags, words, DOCOL);
}

function defvar(name, flags, defval) {
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

var wordBuffer = '';
var wordState = REALWORD;
function _WORD() {
  let keyCode;
  do {
    keyCode = getInputData();
    if (keyCode === null) {
      return null;
    }

    var s = String.fromCharCode(keyCode);
    printChar(keyCode);

    if (wordState === COMMENT) {
      if (keyCode === 10) {
        wordState = REALWORD;
      }
      continue;
    }

    if (s[0] === '\\') {
      wordState = COMMENT;
      continue;
    }

    wordBuffer = wordBuffer + s;
    wordBuffer = wordBuffer.trim();
  }
  while ((wordBuffer === '') || (keyCode !== 32 && keyCode !== 10 && keyCode !== 13));

  _stack.push(wordBuffer.trim());
  wordBuffer = '';
  return true;
}

defvar('DUMMY', 0, 0);

defcode('EXIT', 0, function EXIT() {
  _ip = _retStack.pop();
  NEXT();
});

// Variables
var hereAddr = defvar('HERE', 0, 0);
var latestAddr = defvar('LATEST', 0, 0);
var stateAddr = defvar('STATE', 0, 0);
var baseAddr = defvar('BASE', 0, 10);

// Stack operations
defcode('DUP', 0, function DUP(c) { 
  console.log(`core: ${c}`);
  c.stack.push(c.stack.getTOS());
//  _stack.push(getTOS()); 
  NEXT();
});
defcode('DROP', 0, function DROP() { _stack.pop(); NEXT();});
defcode('SWAP', 0, function SWAP() {
  var TOS = _stack.pop();
  var NOS = _stack.pop();
  _stack.push(TOS);
  _stack.push(NOS);
  NEXT();
});
defcode('OVER', 0, function OVER() { _stack.push(getNOS()); NEXT();});
defcode('ROT', 0, function ROT() {
  var a = _stack.pop();
  var b = _stack.pop();
  var c = _stack.pop();
  _stack.push(b);
  _stack.push(a);
  _stack.push(c);
  NEXT();
});

defcode('-ROT', 0, function ROT() {
  var a = _stack.pop();
  var b = _stack.pop();
  var c = _stack.pop();
  _stack.push(a);
  _stack.push(c);
  _stack.push(b);
  NEXT();
});

defcode('2DROP', 0, function TWODROP() { _stack.pop(); _stack.pop(); NEXT();});
defcode('2DUP', 0, function TWODUP() {
  var TOS = getTOS();
  var NOS = getNOS();
  _stack.push(NOS);
  _stack.push(TOS);
  NEXT();
});
defcode('2SWAP', 0, function TWOSTAP() {
  var a = _stack.pop(); var b = _stack.pop();
  var c = _stack.pop(); var d = _stack.pop();
  _stack.push(c); _stack.push(d);
  _stack.push(a); _stack.push(b);
  NEXT();
});
defcode('?DUP', 0, function ZDUP() {
  var TOS = getTOS();
  if (TOS !== 0) {
    _stack.push(TOS);
  }
  NEXT();
});

// Math operations
defcode('1+', 0, function INCR() { _stack[_stack.length - 1]++; NEXT();});
defcode('1-', 0, function DECR() { _stack[_stack.length - 1]--; NEXT();});
defcode('+', 0, function ADD() {
  var TOS = _stack.pop(); var NOS = _stack.pop();
  _stack.push(TOS + NOS);
  NEXT();
});
defcode('-', 0, function SUB() {
  var TOS = _stack.pop(); var NOS = _stack.pop();
  _stack.push(NOS - TOS);
  NEXT();
});
defcode('*', 0, function MUL() {
  var TOS = _stack.pop(); var NOS = _stack.pop();
  _stack.push(NOS * TOS);
  NEXT();
});
defcode('/MOD', 0, function MODDIV() {
  var TOS = _stack.pop(); var NOS = _stack.pop();
  _stack.push(NOS % TOS);
  _stack.push(Math.floor(NOS / TOS));
  NEXT();
});
defcode('/', 0, function DIV() {
  var TOS = _stack.pop(); var NOS = _stack.pop();
  _stack.push(NOS / TOS);
  NEXT();
});

defcode('FLOOR', 0, function DIV() {
  var TOS = _stack.pop();
  _stack.push(Math.floor(TOS));
  NEXT();
});

// Comparison Operators
defcode('=', 0, function EQ() {
  var TOS = _stack.pop(); var NOS = _stack.pop();
  _stack.push((TOS === NOS) ? 1 : 0);
  NEXT();
});
defcode('<>', 0, function NEQ() {
  var TOS = _stack.pop(); var NOS = _stack.pop();
  _stack.push((TOS !== NOS) ? 1 : 0);
  NEXT();
});
defcode('<', 0, function LT() {
  var TOS = _stack.pop(); var NOS = _stack.pop();
  _stack.push((NOS < TOS) ? 1 : 0);
  NEXT();
});
defcode('>', 0, function GT() {
  var TOS = _stack.pop(); var NOS = _stack.pop();
  _stack.push((NOS > TOS) ? 1 : 0);
  NEXT();
});
defcode('<=', 0, function LTE() {
  var TOS = _stack.pop(); var NOS = _stack.pop();
  _stack.push((NOS <= TOS) ? 1 : 0);
  NEXT();
});
defcode('>=', 0, function GTE() {
  var TOS = _stack.pop(); var NOS = _stack.pop();
  _stack.push((NOS >= TOS) ? 1 : 0);
  NEXT();
});
defcode('0=', 0, function ZEQ() {
  var TOS = _stack.pop();
  _stack.push((TOS === 0) ? 1 : 0);
  NEXT();
});
defcode('0<>', 0, function ZNEQ() {
  var TOS = _stack.pop();
  _stack.push((TOS !== 0) ? 1 : 0);
  NEXT();
});
defcode('0<', 0, function ZLT() {
  var TOS = _stack.pop();
  _stack.push((TOS < 0) ? 1 : 0);
  NEXT();
});
defcode('0>', 0, function ZGT() {
  var TOS = _stack.pop();
  _stack.push((TOS > 0) ? 1 : 0);
  NEXT();
});
defcode('0<=', 0, function ZLTE() {
  var TOS = _stack.pop();
  _stack.push((TOS <= 0) ? 1 : 0);
  NEXT();
});
defcode('0>=', 0, function ZGTE() {
  var TOS = _stack.pop();
  _stack.push((TOS >= 0) ? 1 : 0);
  NEXT();
});

// Binary Operators
defcode('AND', 0, function AND() {
  var TOS = _stack.pop(); var NOS = _stack.pop();
  _stack.push(TOS & NOS);
  NEXT();
});
defcode('OR', 0, function OR() {
  var TOS = _stack.pop(); var NOS = _stack.pop();
  _stack.push(TOS | NOS);
  NEXT();
});
defcode('XOR', 0, function XOR() {
  var TOS = _stack.pop(); var NOS = _stack.pop();
  _stack.push(TOS ^ NOS);
  NEXT();
});
defcode('INVERT', 0, function INVERT() {
  var TOS = _stack.pop();
  _stack.push(!TOS);
  NEXT();
});

// Branch Operators
defcode('BRANCH', 0, function BRANCH() {
  var val = _mem[++_ip];
  _ip += parseInt(val) - 1; // to compensate for NEXT
  NEXT();
});
defcode('0BRANCH', 0, function ZBRANCH() {
  var val = _mem[++_ip];
  var TOS = _stack.pop();
  if (TOS === 0) {
    _ip += parseInt(val) - 1; // to compensate for NEXT
  }
  NEXT();
});

// Memory Operations
defcode('!', 0, function STORE() {
  var TOS = _stack.pop();
  var NOS = _stack.pop();
  _mem[TOS] = NOS;
  NEXT();
});
defcode('+!', 0, function ADDSTORE() {
  var TOS = _stack.pop();
  var NOS = _stack.pop();
  _mem[TOS] = _mem[TOS] + NOS;
  NEXT();
});
defcode('@', 0, function FETCH() {
  var TOS = _stack.pop();
  _stack.push(_mem[TOS]);
  NEXT();
});
defcode('DEPTH', 0, function S0() {
  _stack.push(_stack.length - 1);
  NEXT();
});
defcode('DSP@', 0, function DATASTACKFETCH() {
  var TOS = _stack.pop();
  _stack.push(_stack[TOS]);
  NEXT();
});

// Return stack operators
defcode('>R', 0, function TRSK() { _retStack.push(_stack.pop()); NEXT();});
defcode('R>', 0, function FRSK() { _stack.push(_retStack.pop()); NEXT();});
defcode('RDROP', 0, function RSKDROP() { _retStack.pop(); NEXT();});

// INPUT / OUTPUT Operators
defcode('EMIT', 0, function EMIT() {
  var c = _stack.pop();
  printChar(c);
  NEXT();
});
defcode('TELL', 0, function TELL() {
  var str = _stack.pop();
  for (var i = 0; i < str.length; i++) {
    printChar(str.charCodeAt(i));
  }
  NEXT();
});
defcode('KEY', 0, function KEY() {
  var keyCode = getInputData();
  if (keyCode === null) {
    return;       // No data yet, waiting.
  }
  _stack.push(keyCode);
  NEXT();
});

defcode('WORD', 0, function WORD() {
  if (_WORD() === null) {
    return;
  }
  NEXT();
});
defcode('NUMBER', 0, function NUMBER() {
  var base = _mem[baseAddr];
  var TOS = _stack.pop();
  var n = parseInt(TOS, base);
  _stack.push(n);
  NEXT();
});

// COMPILATION
function _FIND() {
  var c = _mem[latestAddr];
  var n = _stack.pop();
  do {
    var nToCompare = _mem[c + 2];
    if (!(_mem[c + 1] & F_HIDDEN) && nToCompare === n) {
      break;
    } else {
      c = _mem[c];
    }
  } while (c !== 0);
  _stack.push(c);
}

defcode('FIND', 0, function FIND() {
  _FIND();
  NEXT();
});

defcode('CREATE', 0, function CREATE() {
  var latest = _mem[latestAddr];
  var here = _mem[hereAddr];

  var name = _stack.pop();

  _mem[latestAddr] = here; // update LATEST with the word we currently create
  _mem[here++] = latest;            // LINK
  _mem[here++] = 0;                 // flag
  _mem[here++] = name;             // flag

  _mem[hereAddr] = here; // update here with the new value ready for comma.
  NEXT();
});

defcode(',', 0, function COMMA() {
  var TOS = _stack.pop();

  var here = _mem[hereAddr];
  _mem[hereAddr]++;

  _mem[here] = TOS;
  NEXT();
});

defcode('\'', 0, function TICK() {
  var val = _mem[++_ip];
  _stack.push(val);
  NEXT();
});

defcode('LIT', 0, function LIT() {
  _ip++;
  var val = _mem[_ip];
  _stack.push(val);//parseInt(val));
  NEXT();
});
defcode('LITSTRING', 0, function LITSTRING() {
  _ip++;
  var val = _mem[_ip];
  _stack.push(val);       // Should be a string.
  NEXT();
});

// Words flags Alteration
defcode('IMMEDIATE', F_IMMED, function IMMEDIATE() {
  var latest = _mem[latestAddr];
  _mem[latest + 1] ^= F_IMMED;
  NEXT();
});
defcode('HIDDEN', 0, function HIDDEN() {
  var TOS = _stack.pop();
  _mem[TOS + 1] ^= F_HIDDEN;
  NEXT();
});

// String Operators
defcode('>STR', 0, function TOSTR() {
  var TOS = _stack.pop();
  _stack.push(String.fromCharCode(TOS));
  NEXT();
});

defcode('?STR', 0, function ISSTR() {
  var TOS = _stack.pop();
  _stack.push((typeof TOS === 'string') ? 1 : 0);
  NEXT();
});

let codeFct = undefined;

defcode('INTERPRET', 0, function INTERPRET() {
  if (_WORD() === null) {
    return;
  }

  var word = getTOS();

  _FIND();

  var isCompiling = _mem[stateAddr] === '1';
  var isParsingCode = _mem[stateAddr] === '2';
  var wAddr = _stack.pop();

  if (wAddr !== 0) {
    var isImmediate = _mem[wAddr + 1] & F_IMMED;
    var pAddr = wAddr + 3;

    if (isCompiling && !isImmediate) {
      _COMMAjs(pAddr);
    } else {
      _EXECUTEjs(pAddr);
      return;
    }
  } else {
    var base = _mem[baseAddr];
    var isFloat = word[word.length - 1] === 'f';

    var number;
    if (isFloat) {
      var nNumber = word.slice(0, word.length - 1);
      number = parseFloat(nNumber);
    } else {
      number = parseInt(word, base);
    }

    if (isNaN(number)) {
      printLine(`Parse Error: ${word} not found!\n`);
      NEXT();
      return;
    }

    if (!isCompiling) {
      _stack.push(number);
    } else {
      _COMMAjs(_words.get('LIT'));
      _COMMAjs(number);
    }
  }
  NEXT();
});

defcode('CHAR', 0, function CHAR() {
  if (_WORD() === null) {
    return;
  }

  var word = _stack.pop();
  var c = word.charCodeAt(0);
  _stack.push(c);
  NEXT();
});
defcode('EXECUTE',  0, function EXECUTE() {
  var TOS = _stack.pop();
  _EXECUTEjs(TOS);
});

defcode('DOCOL!', 0, function DOCOLSTORE() {
  var here = _mem[hereAddr];
  _mem[hereAddr]++;
  _mem[here] = DOCOL;
  NEXT();
});

defcode('BYE', 0, function BYE() {
    console.log('BYE encountered, exiting cleanly');
    process.exit();
  });

defcode('DEBUGGER', 0, function DEBUGGER() {
  debugger; // jshint ignore:line
  NEXT();
});

defcode('jsS', 0, function DEBUGGER() {
  console.log(_stack);
  NEXT();
});

defcode('EPOCH', 0, function EPOCH() {
  _stack.push(new Date().getTime());
  NEXT();
});

defword('[', F_IMMED, 'LIT 0 STATE ! EXIT');
defword(']', 0, 'LIT 1 STATE ! EXIT');
defword(':', 0, 'WORD CREATE DOCOL! LATEST @ HIDDEN ] EXIT');
defword(';', F_IMMED, 'LIT EXIT , LATEST @ HIDDEN [ EXIT');

defword('CODE', F_IMMED, 'LIT 2 STATE ! EXIT');
defword('END-CODE', 0, 'LIT 0 STATE ! EXIT');

// CORE CONSTANT
defword('CORE_VERSION', 0, 'LIT 3 EXIT');
defword('F_IMMED', 0, 'LIT 2 EXIT');
defword('F_HIDDEN', 0, 'LIT 1 EXIT');

defword('MEMORY_SIZE', 0, `LIT ${MEMORYSIZE} EXIT`);
defword('QUIT', 0, 'INTERPRET BRANCH -2');

// COLD BOOT
_mem[hereAddr] = HERE;
_mem[latestAddr] = LATEST;

HERE = undefined;
LATEST = undefined;

function coldBoot() {
  _current = _words.get('QUIT');
  run();
}

coldBoot();

// Exported API
export function setPrintString(fct) {
  printLine = fct;
}

export function setPrintChar(fct) {
  printChar = fct;
}

export function pushIntoInputBuffer(s) {
  console.log(s);
}

const getCharCode = es6.map(e => e.charCodeAt(0));
export function pushIntoInputBuffer(input) {
  _inputBuffer.push(...getCharCode(input));
  run();
}

import * as blimbo from './stackOperations'
