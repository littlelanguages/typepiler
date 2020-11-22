import * as AbstractScanner from "https://raw.githubusercontent.com/littlelanguages/scanpiler-deno-lib/0.1.1/abstract-scanner.ts";

export type Token = AbstractScanner.Token<TToken>;

export class Scanner extends AbstractScanner.Scanner<TToken> {
  constructor(input: string) {
    super(input, TToken.ERROR);
  }

  next() {
    if (this.currentToken[0] !== TToken.EOS) {
      while (0 <= this.nextCh && this.nextCh <= 32) {
        this.nextChar();
      }

      let state = 0;
      while (true) {
        switch (state) {
          case 0: {
            if (this.nextCh === 41) {
              this.markAndNextChar();
              state = 1;
              break;
            } else if (this.nextCh === 40) {
              this.markAndNextChar();
              state = 2;
              break;
            } else if (this.nextCh === 46) {
              this.markAndNextChar();
              state = 3;
              break;
            } else if (this.nextCh === 42) {
              this.markAndNextChar();
              state = 4;
              break;
            } else if (this.nextCh === 58) {
              this.markAndNextChar();
              state = 5;
              break;
            } else if (this.nextCh === 125) {
              this.markAndNextChar();
              state = 6;
              break;
            } else if (this.nextCh === 44) {
              this.markAndNextChar();
              state = 7;
              break;
            } else if (this.nextCh === 123) {
              this.markAndNextChar();
              state = 8;
              break;
            } else if (this.nextCh === 124) {
              this.markAndNextChar();
              state = 9;
              break;
            } else if (this.nextCh === 61) {
              this.markAndNextChar();
              state = 10;
              break;
            } else if (this.nextCh === 59) {
              this.markAndNextChar();
              state = 11;
              break;
            } else if (this.nextCh === 97) {
              this.markAndNextChar();
              state = 12;
              break;
            } else if (this.nextCh === 117) {
              this.markAndNextChar();
              state = 13;
              break;
            } else if (
              98 <= this.nextCh && this.nextCh <= 116 ||
              118 <= this.nextCh && this.nextCh <= 122
            ) {
              this.markAndNextChar();
              state = 14;
              break;
            } else if (65 <= this.nextCh && this.nextCh <= 90) {
              this.markAndNextChar();
              state = 15;
              break;
            } else if (this.nextCh === 34) {
              this.markAndNextChar();
              state = 16;
              break;
            } else if (this.nextCh === -1) {
              this.markAndNextChar();
              state = 17;
              break;
            } else if (this.nextCh === 47) {
              this.markAndNextChar();
              state = 18;
              break;
            } else {
              this.markAndNextChar();
              this.attemptBacktrackOtherwise(TToken.ERROR);
              return;
            }
          }
          case 1: {
            this.setToken(0);
            return;
          }
          case 2: {
            this.setToken(1);
            return;
          }
          case 3: {
            this.setToken(2);
            return;
          }
          case 4: {
            this.setToken(3);
            return;
          }
          case 5: {
            if (this.nextCh === 58) {
              this.nextChar();
              state = 19;
              break;
            } else {
              this.setToken(4);
              return;
            }
          }
          case 6: {
            this.setToken(5);
            return;
          }
          case 7: {
            this.setToken(6);
            return;
          }
          case 8: {
            this.setToken(7);
            return;
          }
          case 9: {
            this.setToken(8);
            return;
          }
          case 10: {
            this.setToken(10);
            return;
          }
          case 11: {
            this.setToken(11);
            return;
          }
          case 12: {
            if (
              48 <= this.nextCh && this.nextCh <= 57 ||
              65 <= this.nextCh && this.nextCh <= 90 ||
              97 <= this.nextCh && this.nextCh <= 114 ||
              116 <= this.nextCh && this.nextCh <= 122
            ) {
              this.nextChar();
              state = 14;
              break;
            } else if (this.nextCh === 115) {
              this.nextChar();
              state = 20;
              break;
            } else {
              this.setToken(14);
              return;
            }
          }
          case 13: {
            if (
              48 <= this.nextCh && this.nextCh <= 57 ||
              65 <= this.nextCh && this.nextCh <= 90 ||
              97 <= this.nextCh && this.nextCh <= 114 ||
              116 <= this.nextCh && this.nextCh <= 122
            ) {
              this.nextChar();
              state = 14;
              break;
            } else if (this.nextCh === 115) {
              this.nextChar();
              state = 21;
              break;
            } else {
              this.setToken(14);
              return;
            }
          }
          case 14: {
            if (
              48 <= this.nextCh && this.nextCh <= 57 ||
              65 <= this.nextCh && this.nextCh <= 90 ||
              97 <= this.nextCh && this.nextCh <= 122
            ) {
              this.nextChar();
              state = 14;
              break;
            } else {
              this.setToken(14);
              return;
            }
          }
          case 15: {
            if (
              48 <= this.nextCh && this.nextCh <= 57 ||
              65 <= this.nextCh && this.nextCh <= 90 ||
              97 <= this.nextCh && this.nextCh <= 122
            ) {
              this.nextChar();
              state = 15;
              break;
            } else {
              this.setToken(15);
              return;
            }
          }
          case 16: {
            if (
              0 <= this.nextCh && this.nextCh <= 33 ||
              35 <= this.nextCh && this.nextCh <= 255
            ) {
              this.nextChar();
              state = 16;
              break;
            } else if (this.nextCh === 34) {
              this.nextChar();
              state = 22;
              break;
            } else {
              this.attemptBacktrackOtherwise(TToken.ERROR);
              return;
            }
          }
          case 17: {
            this.setToken(17);
            return;
          }
          case 18: {
            if (this.nextCh === 42) {
              this.nextChar();
              state = 23;
              break;
            } else if (this.nextCh === 47) {
              this.nextChar();
              state = 24;
              break;
            } else {
              this.attemptBacktrackOtherwise(TToken.ERROR);
              return;
            }
          }
          case 19: {
            this.setToken(9);
            return;
          }
          case 20: {
            if (
              48 <= this.nextCh && this.nextCh <= 57 ||
              65 <= this.nextCh && this.nextCh <= 90 ||
              97 <= this.nextCh && this.nextCh <= 122
            ) {
              this.nextChar();
              state = 14;
              break;
            } else {
              this.setToken(12);
              return;
            }
          }
          case 21: {
            if (
              48 <= this.nextCh && this.nextCh <= 57 ||
              65 <= this.nextCh && this.nextCh <= 90 ||
              97 <= this.nextCh && this.nextCh <= 100 ||
              102 <= this.nextCh && this.nextCh <= 122
            ) {
              this.nextChar();
              state = 14;
              break;
            } else if (this.nextCh === 101) {
              this.nextChar();
              state = 25;
              break;
            } else {
              this.setToken(14);
              return;
            }
          }
          case 22: {
            this.setToken(16);
            return;
          }
          case 23: {
            let nstate = 0;
            let nesting = 1;
            while (true) {
              switch (nstate) {
                case 0: {
                  if (
                    0 <= this.nextCh && this.nextCh <= 41 ||
                    43 <= this.nextCh && this.nextCh <= 46 ||
                    48 <= this.nextCh && this.nextCh <= 255
                  ) {
                    this.nextChar();
                    nstate = 1;
                    break;
                  } else if (this.nextCh === 42) {
                    this.nextChar();
                    nstate = 2;
                    break;
                  } else if (this.nextCh === 47) {
                    this.nextChar();
                    nstate = 3;
                    break;
                  } else {
                    this.attemptBacktrackOtherwise(TToken.ERROR);
                    return;
                  }
                }
                case 1: {
                  nstate = 0;
                  break;
                }
                case 2: {
                  if (this.nextCh === 47) {
                    this.nextChar();
                    nstate = 4;
                    break;
                  } else {
                    nstate = 0;
                    break;
                  }
                }
                case 3: {
                  if (this.nextCh === 42) {
                    this.nextChar();
                    nstate = 5;
                    break;
                  } else {
                    nstate = 0;
                    break;
                  }
                }
                case 4: {
                  nesting -= 1;
                  if (nesting === 0) {
                    this.next();
                    return;
                  } else {
                    nstate = 0;
                    break;
                  }
                }
                case 5: {
                  nesting += 1;
                  nstate = 0;
                  break;
                }
              }
            }
          }
          case 24: {
            if (
              0 <= this.nextCh && this.nextCh <= 9 ||
              11 <= this.nextCh && this.nextCh <= 255
            ) {
              this.nextChar();
              state = 24;
              break;
            } else {
              this.next();
              return;
            }
          }
          case 25: {
            if (
              48 <= this.nextCh && this.nextCh <= 57 ||
              65 <= this.nextCh && this.nextCh <= 90 ||
              97 <= this.nextCh && this.nextCh <= 122
            ) {
              this.nextChar();
              state = 14;
              break;
            } else {
              this.setToken(13);
              return;
            }
          }
        }
      }
    }
  }
}

export function mkScanner(input: string): Scanner {
  return new Scanner(input);
}

export enum TToken {
  RParen,
  LParen,
  Period,
  Star,
  Colon,
  RCurly,
  Comma,
  LCurly,
  Bar,
  ColonColon,
  Equal,
  Semicolon,
  As,
  Use,
  LowerID,
  UpperID,
  LiteralString,
  EOS,
  ERROR,
}
