\ vim: set syntax=forth:

\ This file contain the kernel of jsForth, it is everthing that was missing into
\ the inner core

: NL 13 ;
: BL 32 ;
: CR NL EMIT ;
: SPACE BL EMIT ;

: TRUE 1 ;
: FALSE 0 ;
: NOT 0=;

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
