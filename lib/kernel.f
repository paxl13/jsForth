\ vim: set syntax=forth:
: NL 13 ;
: BL 32 ;
: CR NL EMIT ;
: SPACE BL EMIT ;

: LITERAL IMMEDIATE
    ' LIT ,
    ,
    ;
