import {
  Either,
  left,
  right,
} from "https://raw.githubusercontent.com/littlelanguages/deno-lib-data-either/0.1.2/mod.ts";
import { mkScanner, Scanner, Token, TToken } from "./typepiler-scanner.ts";

export interface Visitor<
  T_Declarations,
  T_Declaration,
  T_Alias,
  T_Composite,
  T_Type,
  T_TypeTerm,
  T_TypeFactor,
> {
  visitDeclarations(a: Array<T_Declaration>): T_Declarations;
  visitDeclaration(
    a1: Token,
    a2: ([Token, T_Alias] | [Token, T_Composite]),
    a3: Token,
  ): T_Declaration;
  visitAlias1(a1: T_Type, a2: Array<[Token, T_Type]>): T_Alias;
  visitAlias2(
    a1: Token,
    a2: Token,
    a3: Array<[Token, Token]>,
    a4: Token,
  ): T_Alias;
  visitComposite1(a: T_Type): T_Composite;
  visitComposite2(a: Array<[Token, Token, T_Type]>): T_Composite;
  visitType(a1: T_TypeTerm, a2: Array<[Token, T_TypeTerm]>): T_Type;
  visitTypeTerm1(a1: Token, a2: Array<T_TypeFactor>): T_TypeTerm;
  visitTypeTerm2(a1: Token, a2: T_Type, a3: Token): T_TypeTerm;
  visitTypeFactor1(a: Token): T_TypeFactor;
  visitTypeFactor2(a1: Token, a2: T_Type, a3: Token): T_TypeFactor;
}

export const parseDeclarations = <
  T_Declarations,
  T_Declaration,
  T_Alias,
  T_Composite,
  T_Type,
  T_TypeTerm,
  T_TypeFactor,
>(
  input: string,
  visitor: Visitor<
    T_Declarations,
    T_Declaration,
    T_Alias,
    T_Composite,
    T_Type,
    T_TypeTerm,
    T_TypeFactor
  >,
): Either<SyntaxError, T_Declarations> => {
  try {
    return right(mkParser(mkScanner(input), visitor).declarations());
  } catch (e) {
    return left(e);
  }
};

export const mkParser = <
  T_Declarations,
  T_Declaration,
  T_Alias,
  T_Composite,
  T_Type,
  T_TypeTerm,
  T_TypeFactor,
>(
  scanner: Scanner,
  visitor: Visitor<
    T_Declarations,
    T_Declaration,
    T_Alias,
    T_Composite,
    T_Type,
    T_TypeTerm,
    T_TypeFactor
  >,
) => {
  const matchToken = (ttoken: TToken): Token => {
    if (isToken(ttoken)) {
      return nextToken();
    } else {
      throw {
        tag: "SyntaxError",
        found: scanner.current(),
        expected: [ttoken],
      };
    }
  };

  const isToken = (ttoken: TToken): boolean => currentToken() === ttoken;

  const isTokens = (ttokens: Array<TToken>): boolean =>
    ttokens.includes(currentToken());

  const currentToken = (): TToken => scanner.current()[0];

  const nextToken = (): Token => {
    const result = scanner.current();
    scanner.next();
    return result;
  };

  return {
    declarations: function (): T_Declarations {
      const a: Array<T_Declaration> = [];

      while (isToken(TToken.UpperID)) {
        const at: T_Declaration = this.declaration();
        a.push(at);
      }
      return visitor.visitDeclarations(a);
    },
    declaration: function (): T_Declaration {
      const a1: Token = matchToken(TToken.UpperID);
      let a2: [Token, T_Alias] | [Token, T_Composite];
      if (isToken(TToken.Equal)) {
        const a2t1: Token = matchToken(TToken.Equal);
        const a2t2: T_Alias = this.alias();
        const a2t: [Token, T_Alias] = [a2t1, a2t2];
        a2 = a2t;
      } else if (isToken(TToken.ColonColon)) {
        const a2t1: Token = matchToken(TToken.ColonColon);
        const a2t2: T_Composite = this.composite();
        const a2t: [Token, T_Composite] = [a2t1, a2t2];
        a2 = a2t;
      } else {
        throw {
          tag: "SyntaxError",
          found: scanner.current(),
          expected: [TToken.Equal, TToken.ColonColon],
        };
      }
      const a3: Token = matchToken(TToken.Semicolon);
      return visitor.visitDeclaration(a1, a2, a3);
    },
    alias: function (): T_Alias {
      if (isTokens([TToken.UpperID, TToken.LParen])) {
        const a1: T_Type = this.type();
        const a2: Array<[Token, T_Type]> = [];

        while (isToken(TToken.Bar)) {
          const a2t1: Token = matchToken(TToken.Bar);
          const a2t2: T_Type = this.type();
          const a2t: [Token, T_Type] = [a2t1, a2t2];
          a2.push(a2t);
        }
        return visitor.visitAlias1(a1, a2);
      } else if (isToken(TToken.LCurly)) {
        const a1: Token = matchToken(TToken.LCurly);
        const a2: Token = matchToken(TToken.UpperID);
        const a3: Array<[Token, Token]> = [];

        while (isToken(TToken.Comma)) {
          const a3t1: Token = matchToken(TToken.Comma);
          const a3t2: Token = matchToken(TToken.UpperID);
          const a3t: [Token, Token] = [a3t1, a3t2];
          a3.push(a3t);
        }
        const a4: Token = matchToken(TToken.RCurly);
        return visitor.visitAlias2(a1, a2, a3, a4);
      } else {
        throw {
          tag: "SyntaxError",
          found: scanner.current(),
          expected: [TToken.UpperID, TToken.LParen, TToken.LCurly],
        };
      }
    },
    composite: function (): T_Composite {
      if (isTokens([TToken.UpperID, TToken.LParen])) {
        return visitor.visitComposite1(this.type());
      } else if (isToken(TToken.LowerID)) {
        const a: Array<[Token, Token, T_Type]> = [];

        while (isToken(TToken.LowerID)) {
          const at1: Token = matchToken(TToken.LowerID);
          const at2: Token = matchToken(TToken.Colon);
          const at3: T_Type = this.type();
          const at: [Token, Token, T_Type] = [at1, at2, at3];
          a.push(at);
        }
        return visitor.visitComposite2(a);
      } else {
        throw {
          tag: "SyntaxError",
          found: scanner.current(),
          expected: [TToken.UpperID, TToken.LParen, TToken.LowerID],
        };
      }
    },
    type: function (): T_Type {
      const a1: T_TypeTerm = this.typeTerm();
      const a2: Array<[Token, T_TypeTerm]> = [];

      while (isToken(TToken.Star)) {
        const a2t1: Token = matchToken(TToken.Star);
        const a2t2: T_TypeTerm = this.typeTerm();
        const a2t: [Token, T_TypeTerm] = [a2t1, a2t2];
        a2.push(a2t);
      }
      return visitor.visitType(a1, a2);
    },
    typeTerm: function (): T_TypeTerm {
      if (isToken(TToken.UpperID)) {
        const a1: Token = matchToken(TToken.UpperID);
        const a2: Array<T_TypeFactor> = [];

        while (isTokens([TToken.UpperID, TToken.LParen])) {
          const a2t: T_TypeFactor = this.typeFactor();
          a2.push(a2t);
        }
        return visitor.visitTypeTerm1(a1, a2);
      } else if (isToken(TToken.LParen)) {
        const a1: Token = matchToken(TToken.LParen);
        const a2: T_Type = this.type();
        const a3: Token = matchToken(TToken.RParen);
        return visitor.visitTypeTerm2(a1, a2, a3);
      } else {
        throw {
          tag: "SyntaxError",
          found: scanner.current(),
          expected: [TToken.UpperID, TToken.LParen],
        };
      }
    },
    typeFactor: function (): T_TypeFactor {
      if (isToken(TToken.UpperID)) {
        return visitor.visitTypeFactor1(matchToken(TToken.UpperID));
      } else if (isToken(TToken.LParen)) {
        const a1: Token = matchToken(TToken.LParen);
        const a2: T_Type = this.type();
        const a3: Token = matchToken(TToken.RParen);
        return visitor.visitTypeFactor2(a1, a2, a3);
      } else {
        throw {
          tag: "SyntaxError",
          found: scanner.current(),
          expected: [TToken.UpperID, TToken.LParen],
        };
      }
    },
  };
};

export type SyntaxError = {
  tag: "SyntaxError";
  found: Token;
  expected: Array<TToken>;
};
