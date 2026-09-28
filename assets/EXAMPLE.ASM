; A small CP/M program for the Atom starter recipe.
; Assemble it with: ATOM EXAMPLE.ASM EXAMPLE.COM

        ORG 100H

START:  LD DE,MESSAGE
        LD C,9
        CALL 5
        RET

MESSAGE: DB "HELLO FROM THE CP/M RECIPE",13,10,"$"
