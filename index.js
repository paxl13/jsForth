'use strict';

var keypress = require('keypress');
var JsForth = require('./jsForth.js');
var fs = require('fs');

var sourceFiles = process.argv.splice(2, 99);
sourceFiles.unshift('./forth/kernel.f');

console.log(sourceFiles);

var inputStream = '';

sourceFiles.forEach(function(fileName) {
  console.log('Reading', fileName);

  let data;

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

var jsForth = new JsForth(
  function lOut(arg) {
    process.stdout.write(arg);
  }, function cOut(c) {
    var s = String.fromCharCode(c);
    if (c === 13) {
      process.stdout.write('\n');
    }
    process.stdout.write(s);
  }
);

keypress(process.stdin);

process.stdin.on('keypress', function(ch, key) {

  if (key && key.ctrl && key.name === 'c') {
    process.stdin.pause();
  }

  //  if (key && key.name == 'return') {
  //    process.stdout.write('\n');
  //    ch += '\n';
  //  }

  //  console.log('pushing', ch);
  jsForth.pushIntoInputBuffer(ch);
});

process.stdin.setRawMode(true);
process.stdin.resume();

// process.stdin.on('readable', function() {
//   var chunk = process.stdin.read();
//   if (chunk !== null) {
//       var c = '';
//       for (var i = 0; i < chunk.length; i++) {
//           var w = String.fromCharCode(chunk[i]);
//           c += w;
//       };
//       jsForth.pushIntoInputBuffer(c);
//   }
// });

jsForth.pushIntoInputBuffer(inputStream);

// fFiles
parse(`\ vim: set syntax=forth:
\ GENERIC Console tools and cursor movement

: CONSOLE_EMITESCAPE
  27 EMIT
;

: MOVE_LEFT ( d -- )
  27 EMIT
  91 EMIT
  0  .R
  [ CHAR D ] LITERAL EMIT
;

: MOVE_RIGHT ( d -- )
  27 EMIT
  91 EMIT
  0 .R
  [ CHAR C ] LITERAL EMIT
;

: MOVE_UP ( d -- )
  27 EMIT
  91 EMIT
  0 .R
  [ CHAR A ] LITERAL EMIT
;

: MOVE_DOWN
  27 EMIT
  91 EMIT
  0 .R
  [ CHAR B ] LITERAL EMIT
;

: MOVE_TO_X 
  27 EMIT
  91 EMIT
  0 .R
  [ CHAR d ] LITERAL EMIT
;

: MOVE_TO_Y
  27 EMIT
  91 EMIT
  0 .R
  [ CHAR e ] LITERAL EMIT
;

: CLEAR_SCREEN
  27 EMIT
  91 EMIT
  2 0 .R
  [ CHAR J ] LITERAL EMIT
   
  0 MOVE_TO_Y
  0 MOVE_TO_X
;

`);
parse(`\ vim: set syntax=forth:

: tstDUP
  1 DUP
  CMPSTK2 1 1
;

: tstDROP
  1 DROP
;

: tstSWAP
  1 2 SWAP
  CMPSTK2 1 2
;

: tstOVER
  1 2 OVER
  CMPSTK3 1 2 1
;
: tstROT
  1 2 3 ROT
  CMPSTK3 2 1 3
;
: tst2DROP
  1 2 2DROP
;
: tst2DUP
  1 2 2DUP
  CMPSTK4 2 1 2 1
;
: tst2SWAP
  1 2 3 4 2SWAP
  CMPSTK4 3 4 1 2
;
: tst?DUP
  12 ?DUP
  CMPSTK2 12 12
  0 ?DUP
  CMPSTK 0
;

: tst1+
  1 1+
  CMPSTK 2
;
: tst1-
  1 1-
  CMPSTK 0
;
: tst+
  1 4 + 
  CMPSTK 5
;
: tst-
  4 1 -
  CMPSTK 3
;
: tst*
  3 4 *
  CMPSTK 12
;
: tst/MOD
  12 4 /MOD
  CMPSTK 3 0
;
: tst/
  12 4 /
  CMPSTK 3
;



." ------------------"
." Testing Core Stack Words"

RUNTEST tstDUP
RUNTEST tstDROP
RUNTEST tstSWAP
RUNTEST tstOVER
RUNTEST tst2DROP
RUNTEST tst2DUP
RUNTEST tst2SWAP
RUNTEST tst?DUP

." ------------------"
." Testing Core Math Words"

RUNTEST tst1+
RUNTEST tst1-
RUNTEST tst+
RUNTEST tst-
RUNTEST tst*
RUNTEST tst/MOD
RUNTEST tst/

." Done!"

: '$' [ CHAR $ ] LITERAL ;

: CODE IMMEDIATE
\  BEGIN
\    KEY DUP EMIT
\    '$' = 
\  UNTIL
;

\ ." CODE FUN"
\ 
\ : BABECODE
\   S" function() { console.log('hello world'); }()"
\   TELL
\ ;
\ 
\ BABECODE
`);
parse(`\ vim: set syntax=forth:
\ This file contain the kernel of jsForth, it is everthing that was missing into
\ the inner core

: NL 10 ;
: BL 32 ;
: CR NL EMIT ;
: SPACE BL EMIT ;

: TRUE 1 ;
: FALSE 0 ;
: NOT 0= ;

: NEGATE 0 SWAP - ;

: LITERAL IMMEDIATE
    ' LIT ,
    ,
    ;

: ':' [ CHAR : ] LITERAL ;
: '(' [ CHAR ( ] LITERAL ;
: ')' [ CHAR ) ] LITERAL ;
: '"' [ CHAR " ] LITERAL ; \ "
: 'A' [ CHAR A ] LITERAL ;
: '0' [ CHAR 0 ] LITERAL ;
: '-' [ CHAR - ] LITERAL ;
: '.' [ CHAR . ] LITERAL ;

: [COMPILE] IMMEDIATE
    WORD
    FIND
    >CFA
    ,
;

: RECURSE IMMEDIATE
    LATEST @
    >CFA
    ,
;

\ Here are the current conditional implemented!
\ condition IF [code if true] ELSE [code if false] THEN
\ condition IF [code if true] THEN
\ not-condition UNLESS [code if false] ELSE [code if true] THEN
\ not-condition UNLESS [code if false] THEN
\ BEGIN [code] condition UNTIL
\ BEGIN [code] AGAIN
\ BEGIN condition WHILE [code] REPEAT

: IF IMMEDIATE
    ' 0BRANCH ,
    HERE @
    0 ,
;

: THEN IMMEDIATE
    DUP
    HERE @ SWAP -
    SWAP !
;

: ELSE IMMEDIATE
    ' BRANCH ,
    HERE @
    0 ,
    SWAP
    DUP
    HERE @ SWAP -
    SWAP !
;


: BEGIN IMMEDIATE
    HERE @
;

: UNTIL IMMEDIATE
    ' 0BRANCH ,
    HERE @ -
    ,
;

: AGAIN IMMEDIATE
    ' BRANCH ,
    HERE @ -
    ,
;

: WHILE IMMEDIATE
    ' 0BRANCH ,
    HERE @
    0 ,
;

: REPEAT IMMEDIATE
    ' BRANCH ,
    SWAP
    HERE @ - ,
    DUP
    HERE @ SWAP -
    SWAP !
;

: UNLESS IMMEDIATE
    ' NOT ,
    [COMPILE] IF
;

: DO IMMEDIATE
    [COMPILE] BEGIN
    ' >R DUP , ,
;

: LOOP IMMEDIATE
    ' R> DUP , ,
    ' 1+ ,
    ' 2DUP ,
    ' = ,
    [COMPILE] UNTIL
    ' DROP DUP , ,
;

: ( IMMEDIATE
    1
    BEGIN
        KEY
        DUP EMIT
        DUP '(' =
        IF
              DROP
              1+
        ELSE
            ')' =
            IF
                1 -
            THEN
        THEN
    DUP 0= UNTIL
    DROP
;

: CASE IMMEDIATE
        0               ( push 0 to mark the bottom of the stack )
;

: OF IMMEDIATE
        ' OVER ,        ( compile OVER )
        ' = ,           ( compile = )
        [COMPILE] IF    ( compile IF )
        ' DROP ,        ( compile DROP )
;

: ENDOF IMMEDIATE
        [COMPILE] ELSE  ( ENDOF is the same as ELSE )
;

: ENDCASE IMMEDIATE
        ' DROP ,        ( compile DROP )
        ( keep compiling THEN until we get to our zero marker )
        BEGIN
                ?DUP
        WHILE
                [COMPILE] THEN
        REPEAT
;

: NIP ( x y -- y ) SWAP DROP ;
: TUCK ( x y -- y x y ) SWAP OVER ;

: SPACES ( n -- )
    BEGIN
        DUP 0>
    WHILE
        SPACE
        1-
    REPEAT
    DROP
;

: DECIMAL ( -- ) 10 BASE ! ;
: HEX ( -- ) 16 BASE ! ;

: U. ( u -- )
    BASE @ /MOD
    ?DUP IF
        RECURSE
    THEN

    DUP 10 <
    IF
        '0'
    ELSE
        10 -
        'A'
    THEN
    +
    EMIT
;

: UWIDTH ( u -- width )
    BASE @ /
    ?DUP IF
        RECURSE 1+
    ELSE
        1
    THEN
;

: U.R ( u width -- )
    SWAP
    DUP
    UWIDTH
    ROT
    SWAP -
    SPACES
    U.
;

: .R ( u width -- )
    SWAP
    DUP 0 <
    IF
        NEGATE
        1
        SWAP
        ROT
        1-
    ELSE
        0
        SWAP
        ROT
    THEN
    SWAP
    DUP
    UWIDTH
    ROT
    SWAP -
    SPACES
    SWAP
    IF
        '-' EMIT
    THEN
    U.
;

: . ( u -- )
    DUP
    ?STR
    IF
        '"' EMIT
        TELL
        '"' EMIT
        SPACE
    ELSE
        0 .R SPACE
    THEN
;

: LTNUMBERGT ( u -- ) \ Print <u>
    [ CHAR < ] LITERAL EMIT
    U.
    [ CHAR > ] LITERAL EMIT
    SPACE
;

 : .S ( -- )
     DEPTH DUP ( d d )
     1+ LTNUMBERGT ( d d+1 -- d )
     0 ( d cnt )
     BEGIN
         2DUP   ( d cnt d cnt )
         >=     ( d cnt d>=cnt )
     WHILE
         DUP    ( d cnt -- d cnt cnt )
         DSP@ . ( display number )
         1+     ( d cnt - d cnt+1)
     REPEAT
     2DROP      ( d cnt -- )
     CR
 ;

: U. U. SPACE ;

: .s .S ;

: S" IMMEDIATE          ( compile: -- ) ( execute: -- string )
    0 >R
    BEGIN
        R> 1+ >R
        KEY
        DUP >STR SWAP
        '"' =
    UNTIL
    DROP

    R>
    2 -

    BEGIN
        >R
        SWAP +
        R> 1- DUP 0=
    UNTIL
    DROP

    STATE @ IF          ( s -- )
        ' LITSTRING ,
        ,               ( -- )
    THEN
;

: ." IMMEDIATE
    [COMPILE] S"

    STATE @ IF
        ' TELL ,
    ELSE
        TELL CR
    THEN
;

: ? @ . ;

: CONSTANT IMMEDIATE
    WORD CREATE DOCOL!
    ' LIT ,
    ,
    ' EXIT ,
;

: VALUE IMMEDIATE
    [COMPILE] CONSTANT
;

\ : CELLS ( n -- n )
\ ;

: ALLOT ( n -- addr )
    HERE @ SWAP
    HERE +!
;


: VARIABLE IMMEDIATE
    WORD CREATE DOCOL!
    ' LIT ,
    HERE @ 2 + ,
    ' EXIT ,
    0 ,
;

: TO IMMEDIATE
    WORD FIND >DFA 1+

    STATE @ IF
        ' LIT ,
        ,
        ' ! ,
    ELSE
        !
    THEN
;

: +TO IMMEDIATE
    WORD FIND >DFA 1+

    STATE @ IF          ( a -- )
        ' LIT ,
        ,               ( a -- )
        ' DUP ,         ( n a -- n a a )
        ' -ROT ,        ( n a a -- a n a )
        ' @ ,           ( a n a -- a n v )
        ' + ,           ( a n v -- a n )
        ' SWAP ,        ( a n -- n a )
        ' ! ,
    ELSE                ( n a -- )
        DUP             ( n a -- n a a )
        -ROT            ( n a a -- a n a )
        @               ( a n a -- a n v )
        +               ( a n v -- a n )
        SWAP            ( a n -- n a )
        !
    THEN
;

: ARRAY IMMEDIATE ( size -- )
  ALLOT 
  WORD CREATE
  DOCOL!      ( addr )
  ' LIT ,
  ,
  ' + ,
  ' EXIT ,
;

: 2ARRAY IMMEDIATE ( y x -- )
  2DUP
  * ALLOT         ( y x a )
  NIP             ( y a )
  SWAP            ( a y )
  WORD CREATE
  DOCOL!      ( addr )
  ' LIT ,
  ,
  ' * ,
  ' + ,
  ' LIT ,
  ,
  ' + ,
  ' EXIT ,
;

: >NAME                   ( a -- a )
    2 +
;

: >FLAG ( a -- a )
    1 +
;

: ?IMMEDIATE
  >FLAG @
  F_IMMED AND
;

: ?HIDDEN
  >FLAG @
  F_HIDDEN AND
;

: ID.
    >NAME @ TELL
;

: FLAGS.
  DUP 
  ?IMMEDIATE IF
    ." IMMEDIATE"
  THEN

  ?HIDDEN IF
    SPACE
    ." HIDDEN"
  THEN
;

: WORDSIZE.
  DUP
  @ -
  .
;


: WORDS
    LATEST @
    BEGIN
        DUP ID. SPACE
        DUP WORDSIZE.
        DUP FLAGS. CR
        @ DUP 0=
    UNTIL
    CR
;

: CFA>
    3 -
;

0 VALUE TEMP

: I
    R> R> R>  ( -- r l i )
    DUP     ( r l i -- r l i i )
    TO TEMP ( r l i i -- r l i )
    >R >R >R
    TEMP
;

: PICK   
  ?DUP 
  IF 
    SWAP >R 
    1- 
    RECURSE R> 
    SWAP EXIT 
  THEN DUP 
;


: :NONAME
  0 CREATE
  HERE @
  DOCOL!
  ]
;


: ['] IMMEDIATE
  ' LIT ,
;

: DUMP  ( addr len -- )
  
;

: WORDBOUNDS ( start -- end start )
  LATEST ( l_addr start )
  @

  2DUP = 
  UNLESS
    BEGIN
      2DUP    ( end start )
      @ <>     ( f end start )
    WHILE
              ( end start )
      @       ( n_end start )
    REPEAT
  ELSE
    DROP
    HERE @
  THEN
;


: SEE
  WORD FIND  ( start )
  WORDBOUNDS ( end start )
  SWAP       ( s e )

  ':' EMIT SPACE
  DUP ID. SPACE
  DUP ?IMMEDIATE IF ." IMMEDIATE" THEN
  CR SPACE SPACE
 
  >DFA
  BEGIN
    DUP @
    CASE
      ' LIT OF
        ." LIT "
        1+
        DUP @ .
      ENDOF

      ' LITSTRING OF
        ." LITSTRING "
        1+
        [ CHAR S ] LITERAL EMIT '"' EMIT SPACE
        DUP @ TELL '"' EMIT SPACE
      ENDOF

      ' BRANCH OF
        ." BRANCH ( "
        1+
        DUP @ .
        ." ) "
      ENDOF

      ' 0BRANCH OF
        ." 0BRANCH ( "
        1+
        DUP @ .
        ." ) "
      ENDOF

      ' ' OF
        [ CHAR ' ] LITERAL EMIT SPACE
        1+
        DUP CFA> ID. SPACE
      ENDOF

      ' EXIT OF
        2DUP 1+ <>
        IF ." EXIT " THEN
      ENDOF

      DUP CFA> ID. SPACE
    ENDCASE
      ( s e )
    1+ 2DUP =
  UNTIL

  2DROP
  CR [ CHAR ; ] LITERAL EMIT CR
;

: INLINE IMMEDIATE
  WORD FIND
  WORDBOUNDS  ( e s )
  1-       \ skip last exit
  SWAP

  >DFA        ( s e )
  BEGIN
    DUP @
    jsS
    ,
  
    1+ 2DUP =
  UNTIL
  2DROP
;

: KERNELF_VERSION 5 ;

: GREETING
    ." Welcome to jsForth" CR
    ." jsForth Core Ver #" CORE_VERSION . CR
    ." Forth Kernel Ver #" KERNELF_VERSION . CR
    MEMORY_SIZE HERE @ - . ." free memory cells remaining" CR
;

GREETING
`);
parse(`\ vim: set syntax=forth:

\ Plotting function
: STAR
  42 EMIT
;

: DOT
  [ CHAR . ] LITERAL EMIT
;

: EQUAL
  [ CHAR = ] LITERAL EMIT
;

: SQ    ( z -- z^2 )
  DUP *
;

\ complex number library
\ everything is dealt in function of A+Bi

: NEGATE ( a -- -a )
  0 SWAP -
;

: zDUP ( z1 -- z1 z1 )
  2DUP
;

: zSWAP ( z2 z1 -- z1 z2 )
        ( b a d c -- d c b a )
  >R    ( b a d )
  -ROT  ( d b a )
  R>    ( d b a c )
  -ROT  ( d c b a )
;

: zROT  ( z1 z2 z3 -- z2 z3 z1 )
        ( b a d c f e --  d c f e b a )
  >R    ( b a d c f )
  >R    ( b a d c ) ( z1 z2 )
  zSWAP ( z2 z1 )
  R> R> ( z2 z1 z3 )
  zSWAP ( z2 z3 z1 )
;

: z-ROT ( z1 z2 z3 -- z3 z1 z2 )
  zROT
  zROT
;

: zOVER ( z1 z2 -- z1 z2 z1 )
  >R >R ( z1 )
  zDUP  ( z1 z1 )
  R> R> ( z1 z1 z2 )
  zSWAP ( z1 z2 z1 )
;

: z. ( b a -- )
   0 .R
   [ CHAR + ] LITERAL EMIT
   0 .R 
   [ CHAR i ] LITERAL EMIT
   SPACE
;

: zPEEK ( z -- z )
  zDUP
  z.
;

: z+ ( z2 z1 -- z1+z2 )
     ( b2 a2 b1 a1 -- b2+b1 a2+a1 )
  ROT +
  -ROT +
  SWAP
;


: zNEGATE ( z1 -- -z1 )
  NEGATE
  SWAP
  NEGATE
  SWAP
;

: z- ( z2 z1 -- z2-z1 )
     ( b2 a2 b1 a1 -- b2-b1 a2-a1 )
  zNEGATE
  z+
;
   
: |z| ( b a -- a^2+b^2 )
   SQ SWAP SQ +
;

: z^2  ( z -- z^2 )
       ( b a -- 2ab a^2-b^2 )
  zDUP ( b a -- b a b a )
  zDUP ( b a -- b a b a b a )
  ROT  ( b a b a b a -- b a b b a a )
  *    ( b a b b a a -- b a b b a^2 )
  -ROT ( b a b b a^2 -- b a a^2 b b )
  *    ( b a a^2 b b -- b a a^2 b^2 )
  -    ( b a a^2 b^2 -- b a a^2-b^2 )
  -ROT ( b a a^2-b^2 -- a^2-b^2 b a )
  *    ( a^2-b^2 b a -- a^2-b^2 ba )
  2 *   ( a^2-b^2 ba -- a^2-b^2 2*ba )
  SWAP ( a^2-b^2 2ba -- 2ab a^2-b^2 )
;

: z^2+c ( zC zZ -- zZ^2+zC )
  INLINE z^2 
  INLINE z+
;

: cNB    ( zC zZ -- zC zZ+1 )
  INLINE zOVER  ( zC zZ zC )
  INLINE z-ROT  ( zC zC zZ )
  INLINE z^2+c  ( zC zZ+1 )
;

: ITER   ( zC n -- zF )
  >R     ( zC )
  0 0    ( zC zZ ) \ initial number
  R>     ( zC zZ n )
  0      ( zC zZ n c=0 )
  BEGIN
           ( zC zZ n c )
    >R >R  ( zC zZ )
           ( zC zZ )
    INLINE cNB    ( zC zZ+1 )

    zDUP   ( zC zZ zZ )
    |z|    ( zC zZ |zZ| )
    4 >    ( zC zZ f )
    IF
      R> R>  ( zC zZ n c )
      TRUE   ( zC zZ n c f )
    ELSE
      R> R>  ( zC zZ n c )
      1+     ( zC zZ n c+1 )
      2DUP = ( zC zZ n c+1 f )
    THEN
  UNTIL
           ( zC zZ n c )
  >R       ( zC zZ n )
  DROP     ( zC zZ )
  2DROP    ( zC )
  2DROP    ( )
  R>       ( n )
;  

4 VALUE Zoom 
-2 VALUE X1
-2 VALUE Y1
100 VALUE nIter

: RENDERPIXEL ( n -- )
  nIter 
  2DUP =
  IF
    2DROP
    32
  ELSE
    /
    [ 126 48 - ] LITERAL
    *
    48 + 
  THEN
\  DUP
\
\  126 > IF
\  DROP
\  32
\  THEN

  EMIT
;

: pCALC ( y2 y1 x2 x1 --  y1 yInc x1 xInc )
  DUP   ( y2 y1 x2 x1 x1 )
  -ROT  ( y2 y1 x1 x2 x1 )
  -     ( y2 y1 x1 x2-x1 )
  200 / ( y2 y1 x1 xInc )
  >R    ( y2 y1 x1 )
  >R    ( y2 y1 )
  DUP   ( )
  -ROT  ( )
  -     ( )
  50 /  ( y1 yInc )
  R>
  R>    ( y1 yInc x1 xInc )
;

: 4DROP
  2DROP
  2DROP
;

: pDRAW ( y2 y1 x2 x1 )
  pCALC ( y1 yInc x1 xInc )
  50 0 
  DO
                      ( y1 yInc x1 xInc )
    I                 ( y1 yI x1 xI i )
    -ROT              ( y1 yI i x1 xI )
    >R               
    >R                ( y1 yInc i )
    >R                ( y1 yI )
    2DUP              ( y1 yInc y1 yInc )
    R>                ( y1 yI y1 yI i )
    *                 ( y1 yInc y1 dy )
    +                 ( y1 yInc b=dy+y1 )
    R>
    R>                ( y1 yInc b x1 xInc )
    200 0 
    DO                ( y1 yInc b x1 xInc )
      I               ( y1 yI b x1 xI i )
      -ROT            ( y1 yI b i x1 xI )
      2DUP            ( y1 yI b i x1 xI x1 xI )
      >R >R           ( y1 yI b i x1 xI )
      ROT             ( y1 yI b x1 xI i )
      * +             ( y1 yI b a )
      OVER -ROT       ( y1 yI b b a )
      nIter ITER        ( y1 yI b n )
      RENDERPIXEL     ( y1 yI b ) 
      R> R>           ( y1 yI b x1 xI )
    LOOP
    ROT              ( y1 yI x1 xI b )
    DROP              ( y1 yI x1 xI )
    CR                ( )
  LOOP
  4DROP
;

: tDRAW
  EPOCH >R
  pDRAW
  R> EPOCH
  SWAP -
  ." Time Elapsed " 
  0 .R
  ." ms"
  CR
;


: 4DUP
  3 PICK
  3 PICK
  3 PICK
  3 PICK
;



: kLOOP
  BEGIN
    CLEAR_SCREEN
    Zoom Y1 + Y1
    Zoom X1 + X1
    nIter
    jsS
    DROP
    tDRAW

    KEY DUP 
    CASE
      [ CHAR h ] LITERAL OF
        Zoom NEGATE +TO X1
      ENDOF

      [ CHAR k ] LITERAL OF
        Zoom NEGATE +TO Y1
      ENDOF

      [ CHAR j ] LITERAL OF
        Zoom +TO Y1
      ENDOF

      [ CHAR l ] LITERAL OF
        Zoom +TO X1
      ENDOF

      [ CHAR u ] LITERAL OF
        Zoom 2 / TO Zoom
      ENDOF
      
      [ CHAR i ] LITERAL OF
        Zoom 2 * TO Zoom
      ENDOF

      [ CHAR o ] LITERAL OF
        nIter 2 / FLOOR TO nIter
      ENDOF
      
      [ CHAR p ] LITERAL OF
        nIter 2 * FLOOR TO nIter
      ENDOF

      [ CHAR r ] LITERAL OF
        4 TO Zoom
        -2 TO Y1
        -2 TO X1
        100 TO nIter
      ENDOF

    ENDCASE
    [ CHAR q ] LITERAL =
  UNTIL
  ." EXIT "
;

\ 2 -2 2 -2 
\ tDRAW
kLOOP
`);
parse(`\ vim: set syntax=forth:
: ERRORCMP ( n n -- )
  ." Error expected "
  .
  ." got "
  . CR
;
  
: CMPSTK IMMEDIATE
  WORD
  ' LIT ,
  ,
  ' 2DUP ,
  ' = ,
  [COMPILE] UNLESS
  ' ERRORCMP ,
  ' BYE ,
  [COMPILE] THEN
  ' 2DROP ,
;

: CMPSTK2 IMMEDIATE
  [COMPILE] CMPSTK
  [COMPILE] CMPSTK
;

: CMPSTK3 IMMEDIATE
  [COMPILE] CMPSTK
  [COMPILE] CMPSTK2
;

: CMPSTK4 IMMEDIATE
  [COMPILE] CMPSTK
  [COMPILE] CMPSTK3
;

: CMPSTK5 IMMEDIATE
  [COMPILE] CMPSTK
  [COMPILE] CMPSTK4
;

: CMPSTK6 IMMEDIATE
  [COMPILE] CMPSTK
  [COMPILE] CMPSTK5
;

: PRINT_TEST_NAME
  ." Executing " 
  TELL
  ." ... "
;

: PRINT_OK
  ." ok" CR
;

: RUNTEST 
  WORD DUP PRINT_TEST_NAME
  FIND >CFA EXECUTE
  DEPTH UNLESS 
    ." nok" CR
    ." STACK is Dirty" CR
    BYE
  THEN
  PRINT_OK
;
`);
// end 
