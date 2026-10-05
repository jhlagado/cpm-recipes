; Assemble with: ATOM ATOMDEMO.ASM
; Run with: ATOMDEMO

        ORG 100H                              ; CP/M loads .COM programs here.

START:  LD DE,TITLE                           ; Point to the BDOS title string.
        LD C,9                                ; Select string-output function 9.
        CALL 5                                ; Call the CP/M BDOS.

        LD B,1                                ; Start the count at one.
COUNT:  LD A,B                                ; Copy the binary count.
        ADD A,'0'                             ; Convert 1-5 to ASCII digits.
        LD E,A                                ; Function 2 takes its byte in E.
        LD C,2                                ; Select BDOS function 2 (char).
        PUSH BC                               ; Save B across the BDOS call.
        CALL 5                                ; Display the digit.
        POP BC                                ; Restore the loop count.

        LD E,' '                              ; Separate digits with spaces.
        LD C,2                                ; Select BDOS function 2 again.
        PUSH BC                               ; Preserve B across the BDOS call.
        CALL 5                                ; Display the space.
        POP BC                                ; Resume with the same count.

        INC B                                 ; Move to the next digit.
        LD A,B                                ; Copy B for comparison.
        CP 6                                  ; Six ends the count.
        JR NZ,COUNT                           ; Repeat until B reaches six.

        LD DE,PROMPT                          ; Point to the exit prompt.
        LD C,9                                ; Select BDOS function 9.
        CALL 5                                ; Print the prompt.

        LD C,1                                ; Select BDOS function 1.
        CALL 5                                ; Wait for and echo a key.
        RET                                   ; Return to CP/M.

TITLE:  DB 13,10,"ATOM CP/M DEMO",13,10       ; Begin the title on a new line.
        DB "Counting with a Z80 loop: $"      ; '$' ends the BDOS text.
PROMPT: DB 13,10,"Press any key to "          ; Begin the prompt on a new line.
        DB "return to CP/M.$"                 ; End the BDOS text with '$'.
