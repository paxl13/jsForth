\ vim: set syntax=forth:

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
