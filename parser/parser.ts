import { Declaration, Declarations, Import, Name, Type } from "./ast.ts";
import * as Parser from "./typepiler-parser.ts";
import { Token } from "./typepiler-scanner.ts";
import { combine } from "./location.ts";
import { Either } from "../data/either.ts";
import { Errors } from "./errors.ts";

export const parse = (input: string): Either<Errors, Declarations> =>
  Parser.parseDeclarations(input, visitor).mapLeft((e) => [e]);

const visitor: Parser.Visitor<
  Declarations,
  Import,
  Declaration,
  (id: Name) => Declaration,
  (id: Name) => Declaration,
  Type,
  Type,
  Type
> = {
  visitDeclarations: (
    a1: Array<Import>,
    a2: Array<Declaration>,
  ): Declarations => ({ imports: a1, declarations: a2 }),
  visitImport: (
    a1: Token,
    a2: Token,
    a3: [Token, Token] | undefined,
    a4: Token,
  ): Import => ({
    tag: "Import",
    source: { tag: "LiteralString", location: a2[1], value: a2[2] },
    qualified: a3 === undefined ? undefined : mkName(a3[1]),
  }),
  visitDeclaration: (
    a1: Token,
    a2: ([Token, ((name: Name) => Declaration)] | [
      Token,
      ((name: Name) => Declaration),
    ]),
    a3: Token,
  ): Declaration => a2[1](mkName(a1)),
  visitAlias1: (
    a1: Type,
    a2: Array<[Token, Type]>,
  ): ((name: Name) => Declaration) =>
    (name) => ({
      tag: "UnionDeclaration",
      name: name,
      elements: [a1, ...a2.map((e) => e[1])],
    }),
  visitAlias2: (
    a1: Token,
    a2: Token,
    a3: Array<[Token, Token]>,
    a4: Token,
  ): ((name: Name) => Declaration) =>
    (name) => ({
      tag: "SetDeclaration",
      name: name,
      elements: [mkName(a2), ...a3.map((e) => mkName(e[1]))],
    }),
  visitComposite1: (a: Type): ((name: Name) => Declaration) =>
    (name) => ({
      tag: "SimpleComposite",
      name: name,
      type: a,
    }),
  visitComposite2: (
    a: Array<[Token, Token, Type]>,
  ): ((name: Name) => Declaration) =>
    (name) => ({
      tag: "RecordComposite",
      name: name,
      fields: a.map((f) => [mkName(f[0]), f[2]]),
    }),
  visitType: (a1: Type, a2: Array<[Token, Type]>): Type =>
    a2.length === 0
      ? a1
      : { tag: "Tuple", value: [a1, ...a2.map((a) => a[1])] },
  visitTypeTerm1: (
    a1: Token,
    a2: [Token, Token] | undefined,
    a3: Array<Type>,
  ): Type => ({
    tag: "Reference",
    qualifier: a2 === undefined ? undefined : mkName(a1),
    name: a2 === undefined ? mkName(a1) : mkName(a2[1]),
    parameters: a3,
  }),
  visitTypeTerm2: (a1: Token, a2: Type, a3: Token): Type => ({
    tag: "Parenthesis",
    location: combine(a1[1], a3[1]),
    type: a2,
  }),
  visitTypeFactor1: (a1: Token, a2: [Token, Token] | undefined): Type => ({
    tag: "Reference",
    qualifier: a2 === undefined ? undefined : mkName(a1),
    name: a2 === undefined ? mkName(a1) : mkName(a2[1]),
    parameters: [],
  }),
  visitTypeFactor2: (a1: Token, a2: Type, a3: Token): Type => ({
    tag: "Parenthesis",
    location: combine(a1[1], a3[1]),
    type: a2,
  }),
};

const mkName = (a: Token): Name => ({ tag: "Name", location: a[1], id: a[2] });
