'use strict';

export default function (lOut, cOut) {
  var self = this;
  var printLine = lOut;
  var printChar = cOut;

  var F_IMMED = 0x02;
  var F_HIDDEN = 0x01;

  var RUNNING = Symbol();
  var IOLOCKED = Symbol();

  var _stack = [];
  var _retStack = [];

  var MEMORYSIZE = 64000;

  var _words = {};
  var _mem = [];

  var _ip = null;
  var _current = null;

  var _inputBuffer = [];
  var _currentState = RUNNING;

  for (var i = 0; i < MEMORYSIZE; i++) {
    _mem.push(null);
  }

  var LATEST = 0;
  var HERE = 0;

  function NEXT() {
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

  // TODO: confirm if used
  //  function EXIT() {
  //    _ip = _retStack.pop();
  //    NEXT();
  //  }

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

  // TODO: confimed if unused
  //  var doCode = function (bodyPtr) {
  //    _mem[bodyPtr]();
  //  };

  // LINK,
  // FLAG,
  // NAME,
  // BODY -> can be function pointer 1 cell
  //      -> or multiple cell for words.
  function createDictionaryEntry(link, name, flags, body, codeword) {
    _mem[HERE++] = link;
    _mem[HERE++] = flags;
    _mem[HERE++] = name;
    if (codeword !== undefined) {
      _mem[HERE++] = codeword;
    }

    if (typeof(body) === 'function') {
      _mem[HERE++] = body;
    } else {
      // DO RESOLVE WITH NAMES
      var words = body.split(' ');
      words.forEach((val) => {
        if (isNaN(val)) {
          _mem[HERE++] = _words[val];
        } else {
          _mem[HERE++] = parseInt(val);
        }
      });
    }
  }

  function defcode(name, codeName, flags, fct) {
    var newLatest = HERE;
    _words[codeName] = HERE + 3;
    createDictionaryEntry(LATEST, name, flags, fct);
    LATEST = newLatest;
  }

  function defword(name, codeName, flags, words) {
    var newLatest = HERE;
    _words[codeName] = HERE + 3;
    createDictionaryEntry(LATEST, name, flags, words, DOCOL);
    LATEST = newLatest;
  }

  function defvar(name, codeName, flags, defval) {
    var newLatest = HERE;
    _words[codeName] = HERE + 3;
    var varAddr = HERE + 4;

    var fct = (function() {
      _mem[varAddr] = defval;

      return function VARIABLE() {
        _stack.push(varAddr);
        NEXT();
      };

      // TODO: Confirm if this has any use... was here before
      // fct.name = codeName;
    }());

    createDictionaryEntry(LATEST,
        name,
        flags,
        fct);

    HERE++; // generate space for the variable !
    LATEST = newLatest;

    return varAddr;
  }

  // TODO: confirm usage / inuage
  // function defconst (name, flags, value) {
  //    var newLatest = new DictionaryEntry(LATEST,
  //        name,
  //        doCode,
  //        flags,
  //        function() {
  //        _stack.push(value);
  //        });
  //  }

  defvar('DUMMY', 'DUMMY', 0, 0);

  defcode('EXIT', 'EXIT', 0, function EXIT() {
    _ip = _retStack.pop();
    NEXT();
  });

  // Variables
  var varHere = defvar('HERE', 'HERE', 0, 0);
  var varLatest = defvar('LATEST', 'LATEST', 0, 0);
  var varState = defvar('STATE', 'STATE', 0, 0);
  var varBase = defvar('BASE', 'BASE', 0, 10);

  // Stack operations
  defcode('DUP', 'DUP', 0, function DUP() { _stack.push(getTOS()); NEXT();});
  defcode('DROP', 'DROP', 0, function DROP() { _stack.pop(); NEXT();});
  defcode('SWAP', 'SWAP', 0, function SWAP() {
    var TOS = _stack.pop();
    var NOS = _stack.pop();
    _stack.push(TOS);
    _stack.push(NOS);
    NEXT();
  });
  defcode('OVER', 'OVER', 0, function OVER() { _stack.push(getNOS()); NEXT();});
  defcode('ROT', 'ROT', 0, function ROT() {
    var a = _stack.pop();
    var b = _stack.pop();
    var c = _stack.pop();
    _stack.push(b);
    _stack.push(a);
    _stack.push(c);
    NEXT();
  });

  defcode('-ROT', 'NROT', 0, function ROT() {
    var a = _stack.pop();
    var b = _stack.pop();
    var c = _stack.pop();
    _stack.push(a);
    _stack.push(c);
    _stack.push(b);
    NEXT();
  });

  defcode('2DROP', 'TWODROP', 0, function TWODROP() { _stack.pop(); _stack.pop(); NEXT();});
  defcode('2DUP', 'TWODUP', 0, function TWODUP() {
    var TOS = getTOS();
    var NOS = getNOS();
    _stack.push(NOS);
    _stack.push(TOS);
    NEXT();
  });
  defcode('2SWAP', 'TWOSWAP', 0, function TWOSTAP() {
    var a = _stack.pop(); var b = _stack.pop();
    var c = _stack.pop(); var d = _stack.pop();
    _stack.push(c); _stack.push(d);
    _stack.push(a); _stack.push(b);
    NEXT();
  });
  defcode('?DUP', 'ZDUP', 0, function ZDUP() {
    var TOS = getTOS();
    if (TOS !== 0) {
      _stack.push(TOS);
    }
    NEXT();
  });

  // Math operations
  defcode('1+', 'INCR', 0, function INCR() { _stack[_stack.length - 1]++; NEXT();});
  defcode('1-', 'DECR', 0, function DECR() { _stack[_stack.length - 1]--; NEXT();});
  defcode('+', 'ADD', 0, function ADD() {
    var TOS = _stack.pop(); var NOS = _stack.pop();
    _stack.push(TOS + NOS);
    NEXT();
  });
  defcode('-', 'SUB', 0, function SUB() {
    var TOS = _stack.pop(); var NOS = _stack.pop();
    _stack.push(NOS - TOS);
    NEXT();
  });
  defcode('*', 'MUL', 0, function MUL() {
    var TOS = _stack.pop(); var NOS = _stack.pop();
    _stack.push(NOS * TOS);
    NEXT();
  });
  defcode('/MOD', 'MODDIV', 0, function MODDIV() {
    var TOS = _stack.pop(); var NOS = _stack.pop();
    _stack.push(NOS % TOS);
    _stack.push(Math.floor(NOS / TOS));
    NEXT();
  });
  defcode('/', 'DIV', 0, function DIV() {
    var TOS = _stack.pop(); var NOS = _stack.pop();
    _stack.push(NOS / TOS);
    NEXT();
  });

  defcode('FLOOR', 'FLOOR', 0, function DIV() {
    var TOS = _stack.pop();
    _stack.push(Math.floor(TOS));
    NEXT();
  });

  // Comparison Operators
  defcode('=', 'EQ', 0, function EQ() {
    var TOS = _stack.pop(); var NOS = _stack.pop();
    _stack.push((TOS === NOS) ? 1 : 0);
    NEXT();
  });
  defcode('<>', 'NEQ', 0, function NEQ() {
    var TOS = _stack.pop(); var NOS = _stack.pop();
    _stack.push((TOS !== NOS) ? 1 : 0);
    NEXT();
  });
  defcode('<', 'LT', 0, function LT() {
    var TOS = _stack.pop(); var NOS = _stack.pop();
    _stack.push((NOS < TOS) ? 1 : 0);
    NEXT();
  });
  defcode('>', 'GT', 0, function GT() {
    var TOS = _stack.pop(); var NOS = _stack.pop();
    _stack.push((NOS > TOS) ? 1 : 0);
    NEXT();
  });
  defcode('<=', 'LTE', 0, function LTE() {
    var TOS = _stack.pop(); var NOS = _stack.pop();
    _stack.push((NOS <= TOS) ? 1 : 0);
    NEXT();
  });
  defcode('>=', 'GTE', 0, function GTE() {
    var TOS = _stack.pop(); var NOS = _stack.pop();
    _stack.push((NOS >= TOS) ? 1 : 0);
    NEXT();
  });
  defcode('0=', 'ZEQ', 0, function ZEQ() {
    var TOS = _stack.pop();
    _stack.push((TOS === 0) ? 1 : 0);
    NEXT();
  });
  defcode('0<>', 'ZNEQ', 0, function ZNEQ() {
    var TOS = _stack.pop();
    _stack.push((TOS !== 0) ? 1 : 0);
    NEXT();
  });
  defcode('0<', 'ZLT', 0, function ZLT() {
    var TOS = _stack.pop();
    _stack.push((TOS < 0) ? 1 : 0);
    NEXT();
  });
  defcode('0>', 'ZGT', 0, function ZGT() {
    var TOS = _stack.pop();
    _stack.push((TOS > 0) ? 1 : 0);
    NEXT();
  });
  defcode('0<=', 'ZLTE', 0, function ZLTE() {
    var TOS = _stack.pop();
    _stack.push((TOS <= 0) ? 1 : 0);
    NEXT();
  });
  defcode('0>=', 'ZGTE', 0, function ZGTE() {
    var TOS = _stack.pop();
    _stack.push((TOS >= 0) ? 1 : 0);
    NEXT();
  });

  // Binary Operators
  defcode('AND', 'AND', 0, function AND() {
    var TOS = _stack.pop(); var NOS = _stack.pop();
    _stack.push(TOS & NOS);
    NEXT();
  });
  defcode('OR', 'OR', 0, function OR() {
    var TOS = _stack.pop(); var NOS = _stack.pop();
    _stack.push(TOS | NOS);
    NEXT();
  });
  defcode('XOR', 'XOR', 0, function XOR() {
    var TOS = _stack.pop(); var NOS = _stack.pop();
    _stack.push(TOS ^ NOS);
    NEXT();
  });
  defcode('INVERT', 'INVERT', 0, function INVERT() {
    var TOS = _stack.pop();
    _stack.push(!TOS);
    NEXT();
  });

  // Branch Operators
  defcode('BRANCH', 'BRANCH', 0, function BRANCH() {
    var val = _mem[++_ip];
    _ip += parseInt(val) - 1; // to compensate for NEXT
    NEXT();
  });
  defcode('0BRANCH', 'ZBRANCH', 0, function() {
    var val = _mem[++_ip];
    var TOS = _stack.pop();
    if (TOS === 0) {
      _ip += parseInt(val) - 1; // to compensate for NEXT
    }
    NEXT();
  });

  // Memory Operations
  defcode('!', 'STORE', 0, function STORE() {
    var TOS = _stack.pop();
    var NOS = _stack.pop();
    _mem[TOS] = NOS;
    NEXT();
  });
  defcode('+!', 'ADDSTORE', 0, function ADDSTORE() {
    var TOS = _stack.pop();
    var NOS = _stack.pop();
    _mem[TOS] = _mem[TOS] + NOS;
    NEXT();
  });
  defcode('@', 'FETCH', 0, function FETCH() {
    var TOS = _stack.pop();
    _stack.push(_mem[TOS]);
    NEXT();
  });
  defcode('DEPTH', 'DEPTH', 0, function S0() {
    _stack.push(_stack.length - 1);
    NEXT();
  });
  defcode('DSP@', 'STACK0', 0, function DATASTACKFETCH() {
    var TOS = _stack.pop();
    _stack.push(_stack[TOS]);
    NEXT();
  });

  // Return stack operators
  defcode('>R', 'TRSK', 0, function TRSK() { _retStack.push(_stack.pop()); NEXT();});
  defcode('R>', 'FRSK', 0, function FRSK() { _stack.push(_retStack.pop()); NEXT();});
  defcode('RDROP', 'RDROP', 0, function() { _retStack.pop(); NEXT();});

  // INPUT / OUTPUT Operators
  defcode('EMIT', 'EMIT', 0, function EMIT() {
    var c = _stack.pop();
    printChar(c);
    NEXT();
  });
  defcode('TELL', 'TELL', 0, function TELL() {
    var str = _stack.pop();
    for (var i = 0; i < str.length; i++) {
      printChar(str.charCodeAt(i));
    }
    NEXT();
  });
  defcode('KEY', 'KEY', 0, function KEY() {
    var keyCode = getInputData();
    if (keyCode === null) {
      return;       // No data yet, waiting.
    }
    _stack.push(keyCode);
    NEXT();
  });

  var str = '';
  var REALWORD = Symbol();
  var COMMENT = Symbol();
  var wordState = REALWORD;
  function _WORD() {
    let keyCode;
    do {
      keyCode = getInputData();
      //            console.log('keycode:', keyCode);
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

      str = str + s;
      str = str.trim();
      //            console.log(str);
    }
    while ((str === '') || (keyCode !== 32 && keyCode !== 10 && keyCode !== 13));

    _stack.push(str.trim());
    str = '';
    return true;
  }
  defcode('WORD', 'WORD', 0, function WORD() {
    if (_WORD() === null) {
      return;
    }
    NEXT();
  });
  defcode('NUMBER', 'NUMBER', 0, function NUMBER() {
    var base = _mem[varBase];
    var TOS = _stack.pop();
    var n = parseInt(TOS, base);
    _stack.push(n);
    NEXT();
  });//}}}

  // COMPILATION
  function _FIND() {
    var c = _mem[varLatest];
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

  defcode('FIND', 'FIND', 0, function FIND() {
    _FIND();
    NEXT();
  });

  defcode('CREATE', 'CREATE', 0, function CREATE() {
    var latest = _mem[varLatest];
    var here = _mem[varHere];

    var name = _stack.pop();

    _mem[varLatest] = here; // update LATEST with the word we currently create
    _mem[here++] = latest;            // LINK
    _mem[here++] = 0;                 // flag
    _mem[here++] = name;             // flag

    _mem[varHere] = here; // update here with the new value ready for comma.
    NEXT();
  });

  defcode(',', 'COMMA', 0, function COMMA() {
    var TOS = _stack.pop();

    var here = _mem[varHere];
    _mem[varHere]++;

    _mem[here] = TOS;
    NEXT();
  });

  defcode('\'', 'TICK', 0, function TICK() {
    var val = _mem[++_ip];
    _stack.push(val);
    NEXT();
  });

  defcode('LIT', 'LIT', 0, function LIT() {
    _ip++;
    var val = _mem[_ip];
    _stack.push(val);//parseInt(val));
    NEXT();
  });
  defcode('LITSTRING', 'LITSTRING', 0, function() {
    _ip++;
    var val = _mem[_ip];
    _stack.push(val);       // Should be a string.
    NEXT();
  });//}}}

  // Words flags Alteration
  defcode('IMMEDIATE', 'IMMEDIATE', F_IMMED, function() {
    var latest = _mem[varLatest];
    _mem[latest + 1] ^= F_IMMED;
    NEXT();
  });
  defcode('HIDDEN', 'HIDDEN', 0, function HIDDEN() {
    var TOS = _stack.pop();
    _mem[TOS + 1] ^= F_HIDDEN;
    NEXT();
  });

  // String Operators
  defcode('>STR', 'TOSTR', 0, function TOSTR() {
    var TOS = _stack.pop();
    _stack.push(String.fromCharCode(TOS));
    NEXT();
  });

  defcode('?STR', 'ISSTR', 0, function ISSTR() {
    var TOS = _stack.pop();
    _stack.push((typeof TOS === 'string') ? 1 : 0);
    NEXT();
  });

  function _COMMAjs(pAddr) {
    var here = _mem[varHere];
    _mem[here++] = pAddr;
    _mem[varHere] = here;
  }

  defcode('INTERPRET', 'INTERPRET', 0, function INTERPRET() {
    if (_WORD() === null) {
      return;
    }

    var word = getTOS();

    _FIND();

    var isCompiling = _mem[varState];
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
      var base = _mem[varBase];
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
        _COMMAjs(_words.LIT);
        _COMMAjs(number);
      }
    }
    NEXT();
  });

  defcode('CHAR', 'CHAR', 0, function CHAR() {
    if (_WORD() === null) {
      return;
    }

    var word = _stack.pop();
    var c = word.charCodeAt(0);
    _stack.push(c);
    NEXT();
  });
  defcode('EXECUTE', 'EXECUTE',  0, function() {
    var TOS = _stack.pop();
    _EXECUTEjs(TOS);
  });

  defcode('DOCOL!', 'DOCOLSTORE', 0, function DOCOLSTORE() {
    var here = _mem[varHere];
    _mem[varHere]++;
    _mem[here] = DOCOL;
    NEXT();
  });

  defcode('BYE', 'BYE', 0, function BYE() {
      console.log('BYE encountered, exiting cleanly');
      process.exit();
    });

  defcode('DEBUGGER', 'DEBUGGER', 0, function DEBUGGER() {
    debugger; // jshint ignore:line
    NEXT();
  });

  // TODO: Re-add when useful
  //  defcode('jsEXECUTE', 'jsEXECUTE', F_IMMED, function COMPILE() {
  //    var code = _stack.pop();
  //    debugger;
  //    eval(code)
  //    NEXT();
  //  });

  defcode('jsS', 'jsS', 0, function DEBUGGER() {
    console.log(_stack);
    NEXT();
  });

  defcode('EPOCH', 'EPOCH', 0, function EPOCH() {
    _stack.push(new Date().getTime());
    NEXT();
  });

  defword('>CFA', 'TCFA', 0, 'LIT 3 ADD EXIT');
  defword('>DFA', 'TDFA', 0,  'LIT 4 ADD EXIT');
  defword('[', 'LSBRACKET', F_IMMED, 'LIT 0 STATE STORE EXIT');
  defword(']', 'RSBRACKET', 0, 'LIT 1 STATE STORE EXIT');
  defword(':', 'COLON', 0, 'WORD CREATE DOCOLSTORE LATEST FETCH HIDDEN RSBRACKET EXIT');
  defword(';', 'SEMICOLON', F_IMMED, 'LIT EXIT COMMA LATEST FETCH HIDDEN LSBRACKET EXIT');
  defword('HIDE', 'HIDE', 0, 'WORD FIND HIDDEN EXIT');

  // CORE CONSTANT
  defword('CORE_VERSION', 'CORE_VERSION', 0, 'LIT 3 EXIT');
  defword('F_IMMED', 'F_IMMED', 0, 'LIT 2 EXIT');
  defword('F_HIDDEN', 'F_HIDDEN', 0, 'LIT 1 EXIT');

  defword('MEMORY_SIZE', 'MEMORY_SIZE', 0, 'LIT ' + MEMORYSIZE + ' EXIT');
  defword('QUIT', 'QUIT', 0, 'INTERPRET BRANCH -2');

  // COLD BOOT
  //
  _mem[varHere] = HERE;
  _mem[varLatest] = LATEST;

  HERE = undefined;
  LATEST = undefined;

  self.pushIntoInputBuffer = function(input) {
    var len = input.length;
    for (var i = 0; i < len; i++) {
      //            console.log('new input');
      _inputBuffer.push(input.charCodeAt(i));
    }

    _currentState = RUNNING;
    self.run();
  };

  self.run = function() {
    while (_currentState === RUNNING) {
      var op = _mem[_current];
      op();
    }
  };

  _current = _words.QUIT;
  self.run();
}
