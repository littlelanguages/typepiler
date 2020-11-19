import {
  builtinDeclarations,
  Declaration,
  InternalDeclaration,
  Reference,
  Tuple,
  Type,
  UnionDeclaration,
} from "../cfg/definition.ts";
import { left, right } from "../data/either.ts";
import { assertEquals } from "../testing/asserts.ts";
import { translate } from "./dynamic.ts";
import { mkCoordinate, range } from "./location.ts";

Deno.test("dynamic - empty declaration", () => {
  assertEquals(translate(""), right([]));
});

Deno.test("dynamic - duplicate declaration name error", () => {
  assertEquals(
    translate("Boolean = {True, False};\nBoolean = {A, B};"),
    left([
      {
        tag: "DuplicateDefinitionError",
        location: range(25, 2, 1, 31, 2, 7),
        name: "Boolean",
      },
    ]),
  );
});

Deno.test("dynamic - set declaration", () => {
  assertEquals(
    translate("Boolean = {True, False};"),
    right([
      { tag: "SetDeclaration", name: "Boolean", elements: ["True", "False"] },
    ]),
  );
});

Deno.test("dynamic - duplicate set element from same declaration", () => {
  assertEquals(
    translate("Boolean = {True, True};"),
    left([
      {
        tag: "DuplicateSetElementError",
        location: range(17, 1, 18, 20, 1, 21),
        name: "True",
      },
    ]),
  );
});

Deno.test("dynamic - duplicate set element from alternative declaration", () => {
  assertEquals(
    translate(
      "Boolean = {True, False};\nTroolean = {True, TriFalse, TriDunno};",
    ),
    left([
      {
        tag: "DuplicateSetElementError",
        location: range(37, 2, 13, 40, 2, 16),
        name: "True",
      },
    ]),
  );
});

Deno.test("dynamic - alias declaration", () => {
  assertEquals(
    translate("Fred = Seq (String * Set String);"),
    right([
      {
        tag: "AliasDeclaration",
        name: "Fred",
        type: builtInReference(
          "Seq",
          [mkTuple(
            [
              builtInReference("String"),
              builtInReference("Set", [builtInReference("String")]),
            ],
          )],
        ),
      },
    ]),
  );
});

Deno.test("dynamic - reference to unknown declaration", () => {
  assertEquals(
    translate("Fred = Seq (String * Sets String);"),
    left([
      {
        tag: "UnknownDeclarationError",
        location: range(21, 1, 22, 24, 1, 25),
        name: "Sets",
      },
    ]),
  );
});

Deno.test("dynamic - validate number of type parameters", () => {
  assertEquals(
    translate(
      "T1 = Seq;\nT2 = Seq String String;\nT3 = Map String String;\nT4 = Set String;",
    ),
    left([
      {
        tag: "IncorrectTypeArityError",
        location: range(5, 1, 6, 7, 1, 8),
        name: "Seq",
        expected: 1,
        actual: 0,
      },
      {
        tag: "IncorrectTypeArityError",
        location: range(15, 2, 6, 17, 2, 8),
        name: "Seq",
        expected: 1,
        actual: 2,
      },
    ]),
  );
});

Deno.test("dynamic - simple composite", () => {
  assertEquals(
    translate("Fred :: String * U8;"),
    right([
      {
        tag: "SimpleComposite",
        name: "Fred",
        type: mkTuple([builtInReference("String"), builtInReference("U8")]),
      },
    ]),
  );
});

Deno.test("dynamic - record composite", () => {
  assertEquals(
    translate("Fred :: a : String * U8 b: F32;"),
    right([
      {
        tag: "RecordComposite",
        name: "Fred",
        fields: [
          ["a", mkTuple([builtInReference("String"), builtInReference("U8")])],
          ["b", builtInReference("F32")],
        ],
      },
    ]),
  );
});

Deno.test("dynamic - record composite field names need to be unique", () => {
  assertEquals(
    translate("Fred :: a : String * U8 a: F32;"),
    left([
      {
        tag: "DuplicateFieldNameError",
        location: mkCoordinate(24, 1, 25),
        name: "a",
      },
    ]),
  );
});

Deno.test("dynamic - union declaration", () => {
  const d1 = {
    tag: "SimpleComposite",
    name: "SetDeclaration",
    type: builtInReference("String"),
  };
  const d2 = {
    tag: "RecordComposite",
    name: "UnionDeclaration",
    fields: [
      ["v1", builtInReference("U32")],
      ["v2", builtInReference("S32")],
    ],
  };

  assertEquals(
    translate(
      "Declaration = SetDeclaration | UnionDeclaration;\n" +
        "SetDeclaration :: String;\nUnionDeclaration :: v1 : U32 v2 : S32;\n",
    ),
    right([
      {
        tag: "UnionDeclaration",
        name: "Declaration",
        elements: [d1, d2],
      },
      d1,
      d2,
    ]),
  );
});

Deno.test("dynamic - union declaration referencing unknown declaration", () => {
  assertEquals(
    translate(
      "Declaration = SetDeclaration | UnionDeclarations;\n" +
        "SetDeclaration :: String;\nUnionDeclaration :: v1 : U32 v2 : S32;\n",
    ),
    left([
      {
        tag: "UnknownDeclarationError",
        location: range(31, 1, 32, 47, 1, 48),
        name: "UnionDeclarations",
      },
    ]),
  );
});

Deno.test("dynamic - union declaration references internal declaration", () => {
  assertEquals(
    translate(
      "Declaration = SetDeclaration | U32;\n" +
        "SetDeclaration :: String;",
    ),
    left([
      {
        tag: "UnionDeclarationReferenceInteranlDeclarationError",
        location: range(31, 1, 32, 33, 1, 34),
        name: "Declaration",
        reference: "U32",
      },
    ]),
  );
});

const mkTuple = (value: Array<Type>): Tuple => ({
  tag: "Tuple",
  value: value,
});

const mkReference = (
  declaration: Declaration,
  parameters: Array<Type> = [],
): Reference => ({
  tag: "Reference",
  declaration,
  parameters,
});

const builtIn = (name: string): InternalDeclaration =>
  builtinDeclarations.find((d) => d.name === name)!;

const builtInReference = (
  name: string,
  parameters: Array<Type> = [],
): Reference => mkReference(builtIn(name), parameters);
