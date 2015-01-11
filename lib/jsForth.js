// vim: set fdm=marker:
module.exports = function jsForth(lOut, cOut, kIn) {
    var self = this;
    var printLine = lOut;
    var printChar = cOut;
    var keyIn = kIn;

    var F_IMMED = 0x02;
    var F_HIDDEN = 0x01;

    var _stack = [];
    var _retStack = [];

    var _words = {};
    var _mem = [];
    for (var i = 0; i < 2048; i++) {
        _mem.push(null);
    };


    var LATEST = 0;
    var HERE = 0;

    function getTOS() {
        return _stack[_stack.length - 1];
    };

    function getNOS() {
        return _stack[_stack.length - 2];
    };

    var doCode = function (bodyPtr) {
        _mem[bodyPtr]();
    };

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
            words.forEach(function (val, i, arr) {
                if (isNaN(val)) {
                    _mem[HERE++] = _words[val];
                } else {
                    _mem[HERE++] = parseInt(val);
                }
            });
        };
    }


    var innerMethods = {};

    function defcode(name, codeName, flags, fct) {
        var newLatest = HERE;
        _words[codeName] = HERE+3;
        innerMethods[codeName] = fct;
        createDictionaryEntry(LATEST,
                name,
                flags,
                fct);
        LATEST = newLatest
    };

    function defword(name, codeName, flags, words) {
        var newLatest = HERE;
        _words[codeName] = HERE+3;
        createDictionaryEntry(LATEST,
                name,
                flags,
                words,
                DOCOL);
        LATEST = newLatest;
    };

    function defvar (name, codeName, flags, defval) {
        var newLatest = HERE;
        _words[codeName] = HERE+3;
        var varAddr = HERE+4;

        var fct = function () {
            _mem[varAddr] = defval;

            return function VARIABLE() {
                _stack.push(varAddr);
                NEXT();
            }
            fct.name = codeName;
        }();

        createDictionaryEntry(LATEST,
                name,
                flags,
                fct);

        HERE++; // generate space for the variable !
        LATEST = newLatest;

        return varAddr;
    }

    function defconst (name, flags, value) {
        var newLatest = new DictionaryEntry(LATEST,
                name,
                doCode,
                flags,
                function () {
                    _stack.push(value);
                });
    }

    defcode("EXIT", "EXIT", 0, function EXIT() {
        _ip = _retStack.pop();
        NEXT();
    });

    // Variables//{{{
    var var_HERE = defvar("HERE", "HERE", 0, 0);
    var var_LATEST = defvar("LATEST", "LATEST", 0, 0);
    var var_STATE = defvar("STATE", "STATE", 0, 0);
    var var_BASE = defvar("BASE", "BASE", 0, 10);//}}}

    // Stack operations//{{{
    defcode("DUP", "DUP", 0, function DUP() { _stack.push(getTOS()); NEXT();});
    defcode("DROP", "DROP", 0, function DROP() { _stack.pop(); NEXT();});
    defcode("SWAP", "SWAP", 0, function SWAP() {
        var TOS = _stack.pop();
        var NOS = _stack.pop();
        _stack.push(TOS);
        _stack.push(NOS);
        NEXT();
    });
    defcode("OVER", "OVER", 0, function OVER() { _stack.push(getNOS()); NEXT();});
    defcode("ROT", "ROT", 0, function ROT() {
        var a = _stack.pop();
        var b = _stack.pop();
        var c = _stack.pop();
        _stack.push(b);
        _stack.push(a);
        _stack.push(c);
        NEXT();
    });
    defcode("2DROP", "TWODROP", 0, function TWODROP() { _stack.pop(); _stack.pop(); NEXT();});
    defcode("2DUP", "TWODUP", 0, function TWODUP() {
        var TOS = getTOS();
        var NOS = getNOS();
        _stack.push(NOS);
        _stack.push(TOS);
        NEXT();
    });
    defcode("2SWAP", "TWOSWAP", 0, function TWOSTAP() {
        var a = _stack.pop(); var b = _stack.pop();
        var c = _stack.pop(); var d = _stack.pop();
        _stack.push(c); _stack.push(d);
        _stack.push(a); _stack.push(b);
        NEXT();
    });
    defcode("?DUP", "ZDUP", 0, function ZDUP() {
        var TOS = getTOS();
        if (TOS !== 0) {
            _stack.push(TOS)
        };
        NEXT();
    });//}}}

    // Math operations//{{{
    defcode("1+", "INCR", 0, function INCR() { _stack[_stack.length - 1]++; NEXT();});
    defcode("1-", "DECR", 0, function DECR() { _stack[_stack.length - 1]--; NEXT();});
    defcode("+", "ADD", 0, function ADD() {
        var TOS = _stack.pop(); var NOS = _stack.pop();
        _stack.push(TOS+NOS);
        NEXT();
    });
    defcode("-", "SUB", 0, function SUB() {
        var TOS = _stack.pop(); var NOS = _stack.pop();
        _stack.push(NOS-TOS);
        NEXT();
    });
    defcode("*", "MUL", 0, function MUL() {
        var TOS = _stack.pop(); var NOS = _stack.pop();
        _stack.push(NOS*TOS);
        NEXT();
    });
    defcode("/MOD", "MODDIV", 0, function MODDIV() {
        var TOS = _stack.pop(); var NOS = _stack.pop();
        _stack.push(NOS%TOS);
        _stack.push(Math.floor(NOS/TOS));
        NEXT();
    });
    defcode("/", "DIV", 0, function DIV() {
        var TOS = _stack.pop(); var NOS = _stack.pop();
        _stack.push(Math.floor(NOS/TOS));
        NEXT();
    });//}}}

    // Comparison Operators//{{{
    defcode("=", "EQ", 0, function EQ() {
        var TOS = _stack.pop(); var NOS = _stack.pop();
        _stack.push((TOS === NOS) ? 1 : 0);
        NEXT();
    });
    defcode("<>", "NEQ", 0, function NEQ() {
        var TOS = _stack.pop(); var NOS = _stack.pop();
        _stack.push((TOS !== NOS) ? 1 : 0);
        NEXT();
    });
    defcode("<", "LT", 0, function LT() {
        var TOS = _stack.pop(); var NOS = _stack.pop();
        _stack.push((NOS < TOS) ? 1 : 0);
        NEXT();
    });
    defcode(">", "GT", 0, function GT() {
        var TOS = _stack.pop(); var NOS = _stack.pop();
        _stack.push((NOS > TOS ) ? 1 : 0);
        NEXT();
    });
    defcode("<=", "LTE", 0, function LTE() {
        var TOS = _stack.pop(); var NOS = _stack.pop();
        _stack.push((NOS <= TOS) ? 1 : 0);
        NEXT();
    });
    defcode(">=", "GTE", 0, function GTE() {
        var TOS = _stack.pop(); var NOS = _stack.pop();
        _stack.push((NOS >= TOS) ? 1 : 0);
        NEXT();
    });
    defcode("0=", "ZEQ", 0, function ZEQ() {
        var TOS = _stack.pop();
        _stack.push((TOS === 0) ? 1 : 0);
        NEXT();
    });
    defcode("0<>", "ZNEQ", 0, function ZNEQ() {
        var TOS = _stack.pop();
        _stack.push((TOS !== 0) ? 1 : 0);
        NEXT();
    });
    defcode("0<", "ZLT", 0, function ZLT() {
        var TOS = _stack.pop();
        _stack.push((TOS < 0) ? 1 : 0);
        NEXT();
    });
    defcode("0>", "ZGT", 0, function ZGT() {
        var TOS = _stack.pop();
        _stack.push((TOS > 0) ? 1 : 0);
        NEXT();
    });
    defcode("0<=", "ZLTE", 0, function ZLTE() {
        var TOS = _stack.pop();
        _stack.push((TOS <= 0) ? 1 : 0);
        NEXT();
    });
    defcode("0>=", "ZGTE", 0, function ZGTE() {
        var TOS = _stack.pop();
        _stack.push((TOS >= 0) ? 1 : 0);
        NEXT();
    });//}}}

    // Binary Operators//{{{
    defcode("AND", "AND", 0, function AND() {
        var TOS = _stack.pop(); var NOS = _stack.pop();
        _stack.push(TOS & NOS);
        NEXT();
    });
    defcode("OR", "OR", 0, function OR() {
        var TOS = _stack.pop(); var NOS = _stack.pop();
        _stack.push(TOS | NOS);
        NEXT();
    });
    defcode("XOR", "XOR", 0, function XOR() {
        var TOS = _stack.pop(); var NOS = _stack.pop();
        _stack.push(TOS ^ NOS);
        NEXT();
    });
    defcode("INVERT", "INVERT", 0, function INVERT() {
        var TOS = _stack.pop();
        _stack.push(!TOS);
        NEXT();
    });//}}}

    // Branch Operators//{{{
    defcode("BRANCH", "BRANCH", 0, function BRANCH() {
        var val = _mem[++_ip];
        _ip += parseInt(val) - 1; // to compensate for NEXT
        NEXT();
    });
    defcode("0BRANCH", "ZBRANCH", 0, function () {
        var val = _mem[++_ip];
        var TOS = _stack.pop();
        if (TOS === 0) {
            _ip += parseInt(val) - 1; // to compensate for NEXT
        }
        NEXT();
    });//}}}

    // Memory Operations//{{{
    defcode("!", "STORE", 0, function STORE() {
        var TOS = _stack.pop();
        var NOS = _stack.pop();
        _mem[TOS] = NOS;
        NEXT();
    })
    defcode("@", "FETCH", 0, function FETCH() {
        var TOS = _stack.pop();
        _stack.push(_mem[TOS]);
        NEXT();
    })
    defcode("DEPTH", "DEPTH", 0, function S0 () {
        _stack.push(_stack.length-1);
        NEXT();
    });

    defcode("DSP@", "STACK0", 0, function DATASTACKFETCH () {
        var TOS = _stack.pop();
        _stack.push(_stack[TOS]);
        NEXT();
    });
    //        defcode("+!", 0, function () { /* TODO */ } )
    //        defcode("-!", 0, function () { /* TODO */ } )
    //        defcode("C!", 0, function () { /* TODO */ } )
    //        defcode("C@", 0, function () { /* TODO */ } )
    //        defcode("C!C@", 0, function () { /* TODO */ } )
    //        defcode("CMOVE", 0, function () { /* TODO */ } )//}}}

    // Return stack operators//{{{
    defcode(">R", "TRSK", 0, function TRSK() { _retStack.push(_stack.pop()); NEXT();});
    defcode("R>", "FRSK", 0, function FRSK() { _stack.push(_retStack.pop()); NEXT();});
    defcode("RDROP", "RDROP", 0, function () { _retStack.pop(); NEXT();});
    //        defcode("RSP@", 0, function () { /* TODO */ });
    //        defcode("RSP!", 0, function () { /* TODO */ });//}}}

    // INPUT / OUTPUT Operators//{{{
    defcode("EMIT", "EMIT", 0, function EMIT() {
        var c = _stack.pop();
        printChar(c);
        NEXT();
    });
    defcode("TELL", "TELL", 0, function TELL() {
        var str = _stack.pop()
        printLine(str);
        NEXT();
    });
    defcode("KEY", "KEY", 0, function KEY() {
        var keyCode = keyIn();
        _stack.push(keyCode);
        NEXT();
    });

    function _WORD() {
        var str = "";
        do {
            var keyCode = keyIn();
            var s = String.fromCharCode(keyCode);

            printChar(keyCode);

            if (s[0] === '\\') {
                do {
                    var k = keyIn();
                    printChar(k);
                } while (k !== 13)

                continue;
            }

            str = str + s;
            str = str.trim();
        }
        while ((str === "") || (keyCode !== 32 && keyCode !== 13));

        _stack.push(str.trim());
    };
    defcode("WORD", "WORD", 0, function WORD() {
        _WORD();
        NEXT();
    });
    defcode("NUMBER", "NUMBER", 0, function NUMBER() {
        var base = _mem[var_BASE];
        var TOS = _stack.pop();
        var n = parseInt(TOS, base);
        _stack.push(n);
        NEXT();
    });//}}}

    // COMPILATION//{{{
    function _FIND() {
        var c = _mem[var_LATEST];
        var n = _stack.pop();
        do {
            var nToCompare = _mem[c+2];
            if (!(_mem[c+1] & F_HIDDEN) && nToCompare === n) {
                break;
            } else {
                c = _mem[c];
            };
        } while (c !== 0);
        _stack.push(c);
    }

    defcode("FIND", "FIND", 0, function FIND() {
        _FIND();
        NEXT();
    });

    defcode("CREATE", "CREATE", 0, function CREATE() {
        var latest = _mem[var_LATEST];
        var here = _mem[var_HERE];

        var name = _stack.pop();

        _mem[var_LATEST] = here; // update LATEST with the word we currently create
        _mem[here++] = latest;            // LINK
        _mem[here++] = 0;                 // flag
        _mem[here++] = name;             // flag

        _mem[var_HERE] = here; // update here with the new value ready for comma.
        NEXT();
    });

    defcode(",", "COMMA", 0, function COMMA() {
        var TOS = _stack.pop();

        var here = _mem[var_HERE];
        _mem[var_HERE]++;

        _mem[here] = TOS;
        NEXT();
    });

    defcode("'", "TICK", 0, function TICK() {
        var val = _mem[++_ip];
        _stack.push(val);
        NEXT();
    });

    defcode("LIT", "LIT", 0, function LIT() {
        _ip++;
        var val = _mem[_ip];
        _stack.push(parseInt(val));
        NEXT();
    });
    defcode("LITSTRING", "LITSTRING", 0, function () {
        /*TODO*/
    });//}}}

    // Words flags Alteration//{{{
    defcode("IMMEDIATE", "IMMEDIATE", F_IMMED, function () {
        var latest = _mem[var_LATEST];
        _mem[latest+1] ^= F_IMMED;
        NEXT();
    });
    defcode("HIDDEN", "HIDDEN", 0, function HIDDEN() {
        var TOS = _stack.pop();
        _mem[TOS+1] ^= F_HIDDEN;
        NEXT();
    });//}}}

    function _COMMAjs(pAddr) {
        var here = _mem[var_HERE];
        _mem[here++] = pAddr;
        _mem[var_HERE] = here;
    }

    defcode("INTERPRET", "INTERPRET", 0, function INTERPRET() {
        _WORD();
        var word = getTOS();

        _FIND();

        var isCompiling = _mem[var_STATE];
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
            var base = _mem[var_BASE];
            var number = parseInt(word, base);

            if (isNaN(number)) {
                printLine("Parse Error: " + word + " not found!\n");
                NEXT();
                return;
            }

            if (!isCompiling) {
                _stack.push(number);
            } else {
                _COMMAjs(_words['LIT']);
                _COMMAjs(number);
            }
        }
        NEXT();
    });

    defcode("CHAR", "CHAR", 0, function CHAR() {
        _WORD();
        var word = _stack.pop();
        var c = word.charCodeAt(0);
        _stack.push(c);
        NEXT();
    });
    defcode("EXECUTE", "EXECUTE",  0, function () {
        var TOS = _stack.pop();
        _EXECUTEjs(TOS);
    });

    defcode("DOCOL!", "DOCOLSTORE", 0, function DOCOLSTORE() {
        var here = _mem[var_HERE];
        _mem[var_HERE]++;
        _mem[here] = DOCOL;
        NEXT();
    });

    defword("-ROT", "NROT", 0, "ROT ROT EXIT");
    defword(">CFA", "TCFA", 0, "LIT 3 ADD EXIT");
    defword(">DFA", "TDFA", 0,  "LIT 4 ADD EXIT");
    defword("[", "LSBRACKET", F_IMMED, "LIT 0 STATE STORE EXIT");
    defword("]", "RSBRACKET", 0, "LIT 1 STATE STORE EXIT");
    defword(":", "COLON", 0, "WORD CREATE DOCOLSTORE LATEST FETCH HIDDEN RSBRACKET EXIT");
    defword(";", "SEMICOLON", F_IMMED, "LIT EXIT COMMA LATEST FETCH HIDDEN LSBRACKET EXIT");
    defword("HIDE", "HIDE", 0, "WORD FIND HIDDEN EXIT");

    defword("QUIT", "QUIT", 0, "INTERPRET BRANCH -2");

    function NEXT() {
        _ip = _ip+1;
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

    function EXIT() {
        _ip = _retStack.pop();
        NEXT();
    }

    // COLD BOOT
    //
    _mem[var_HERE] = HERE;
    _mem[var_LATEST] = LATEST;

    HERE = undefined;
    LATEST = undefined;


    var _ip = null;
    var _current = null;

    self.run = function (rArgs) {
        debugger;
        while (_current !== null) {
            var op = _mem[_current];
            op();
        }
    }

    _current = _words['QUIT'];
    self.run();

    debugger;
}
