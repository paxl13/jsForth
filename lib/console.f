\ vim: set syntax=forth:
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

