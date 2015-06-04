\ vim: set syntax=forth:

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
  z^2 z+
;

: cNB    ( zC zZ -- zC zZ+1 )
  zOVER  ( zC zZ zC )
  z-ROT  ( zC zC zZ )
  z^2+c  ( zC zZ+1 )
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
    cNB    ( zC zZ+1 )

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

: RENDERPIXEL
  DUP             ( b n n )
  1 <            ( b n f )
  IF 
    SPACE           ( b n )
    DROP          ( b )
  ELSE 
                  ( b n n )
    DUP           ( b n n )
    3 <           ( b n f )
    IF
                  ( b n )
      EQUAL       ( b n )
      DROP        ( b )
    ELSE
      100 =         ( b f )
      IF
        STAR
      ELSE
        DOT
      THEN
    THEN
  THEN
;

: DRAW
  50 0 
  DO
    I 0.08f * 2 -   ( b )
    200 0 
    DO                ( b )
      DUP             ( b b a )
      I 0.02f * 2 -   ( b b a )
      100             ( b zZ n )
      ITER            ( b n )
      RENDERPIXEL     ( b ) 
    LOOP
    DROP              ( )
    CR                ( )
  LOOP
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
      100 ITER        ( y1 yI b n )
      RENDERPIXEL     ( y1 yI b ) 
      R> R>           ( y1 yI b x1 xI )
    LOOP
    ROT              ( y1 yI x1 xI b )
    DROP              ( y1 yI x1 xI )
    CR                ( )
  LOOP
;

2 -2 2 -2 pDRAW
1 -1 1 -1 pDRAW
