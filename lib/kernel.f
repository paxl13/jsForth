\ vim: set syntax=forth:
\ This file contain the kernel of jsForth, it is everthing that was missing into
\ the inner core

: NL 13 ;
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
        \ DUP EMIT We don't need to print them anymore
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
: PICK ( x_u ... x_1 x_0 u -- x_u ... x_1 x_0 x_u )
    \ TODO
;

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

: >NAME                   ( a -- a )
    2 +
;

: ID.
    >NAME @ TELL
;

: WORDS
    LATEST @
    BEGIN
        DUP ID. SPACE
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

: KERNELF_VERSION 5 ;

: GREETING
    ." Welcome to jsForth" CR
    ." jsForth Core Ver #" CORE_VERSION . CR
    ." Forth Kernel Ver #" KERNELF_VERSION . CR
    MEMORY_SIZE HERE @ - . ." free memory cells remaining" CR
;

GREETING
