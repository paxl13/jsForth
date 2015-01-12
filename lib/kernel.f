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

\ condition IF true ELSE false THEN
\ condition IF true THEN

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

\ BEGIN loop-part condition UNTIL
\ BEGIN loop-part AGAIN

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

\ BEGIN condition WHILE loop-part REPEAT
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

: . 0 .R SPACE ;

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

: ? @ . ;

: KERNELF_VERSION 1 ;
