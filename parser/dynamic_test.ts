import {
  builtinDeclarations,
  Declaration,
  Declarations,
  InternalDeclaration,
  Reference,
  Tuple,
  Type,
} from "../cfg/definition.ts";
import { Either, left, right } from "../data/either.ts";
import * as Errors from "./errors.ts";
import { translate as dynamicTranslate } from "./dynamic.ts";
import { mkCoordinate, range } from "./location.ts";
import { assertEquals } from "../testing/asserts.ts";

Deno.test("dynamic - empty declaration", async () => {
  const output = await translate("");

  assertEquals(output, right([]));
});

Deno.test("dynamic - duplicate declaration name error", async () => {
  const output = await translate("Boolean = {True, False};\nBoolean = {A, B};");

  assertEquals(
    output,
    left([
      {
        tag: "DuplicateDefinitionError",
        location: range(25, 2, 1, 31, 2, 7),
        name: "Boolean",
      },
    ]),
  );
});

Deno.test("dynamic - set declaration", async () => {
  const output = await translate("Boolean = {True, False};");

  assertEquals(
    output,
    right([
      { tag: "SetDeclaration", name: "Boolean", elements: ["True", "False"] },
    ]),
  );
});

Deno.test("dynamic - duplicate set element from same declaration", async () => {
  const output = await translate("Boolean = {True, True};");

  assertEquals(
    output,
    left([
      {
        tag: "DuplicateSetElementError",
        location: range(17, 1, 18, 20, 1, 21),
        name: "True",
      },
    ]),
  );
});

Deno.test("dynamic - duplicate set element from alternative declaration", async () => {
  const output = await translate(
    "Boolean = {True, False};\nTroolean = {True, TriFalse, TriDunno};",
  );

  assertEquals(
    output,
    left([
      {
        tag: "DuplicateSetElementError",
        location: range(37, 2, 13, 40, 2, 16),
        name: "True",
      },
    ]),
  );
});

Deno.test("dynamic - alias declaration", async () => {
  const output = await translate("Fred = Seq (String * Set String);");

  assertEquals(
    output,
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

Deno.test("dynamic - reference to unknown declaration", async () => {
  const output = await translate("Fred = Seq (String * Sets String);");

  assertEquals(
    output,
    left([
      {
        tag: "UnknownDeclarationError",
        location: range(21, 1, 22, 24, 1, 25),
        name: "Sets",
      },
    ]),
  );
});

Deno.test("dynamic - validate number of type parameters", async () => {
  const output = await translate(
    "T1 = Seq;\nT2 = Seq String String;\nT3 = Map String String;\nT4 = Set String;",
  );

  assertEquals(
    output,
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

Deno.test("dynamic - simple composite", async () => {
  const output = await translate("Fred :: String * U8;");

  assertEquals(
    output,
    right([
      {
        tag: "SimpleComposite",
        name: "Fred",
        type: mkTuple([builtInReference("String"), builtInReference("U8")]),
      },
    ]),
  );
});

Deno.test("dynamic - record composite", async () => {
  const output = await translate("Fred :: a : String * U8 b: F32;");

  assertEquals(
    output,
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

Deno.test("dynamic - record composite field names need to be unique", async () => {
  const output = await translate("Fred :: a : String * U8 a: F32;");

  assertEquals(
    output,
    left([
      {
        tag: "DuplicateFieldNameError",
        location: mkCoordinate(24, 1, 25),
        name: "a",
      },
    ]),
  );
});

Deno.test("dynamic - union declaration", async () => {
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

  const output = await translate(
    "Declaration = SetDeclaration | UnionDeclaration;\n" +
      "SetDeclaration :: String;\nUnionDeclaration :: v1 : U32 v2 : S32;\n",
  );

  assertEquals(
    output,
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

Deno.test("dynamic - union declaration referencing unknown declaration", async () => {
  const output = await translate(
    "Declaration = SetDeclaration | UnionDeclarations;\n" +
      "SetDeclaration :: String;\nUnionDeclaration :: v1 : U32 v2 : S32;\n",
  );

  assertEquals(
    output,
    left([
      {
        tag: "UnknownDeclarationError",
        location: range(31, 1, 32, 47, 1, 48),
        name: "UnionDeclarations",
      },
    ]),
  );
});

Deno.test("dynamic - union declaration references internal declaration", async () => {
  const output = await translate(
    "Declaration = SetDeclaration | U32;\n" +
      "SetDeclaration :: String;",
  );

  assertEquals(
    output,
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

Deno.test("dynamic - union declaration references alias declaration", async () => {
  const output = await translate(
    "Declaration = SetDeclaration | Fred;\n" +
      "SetDeclaration :: String;\nFred = {A, B, C, D};",
  );

  assertEquals(
    output,
    left([
      {
        tag: "UnionDeclarationReferenceSetDeclarationError",
        location: range(31, 1, 32, 34, 1, 35),
        name: "Declaration",
        reference: "Fred",
      },
    ]),
  );
});

Deno.test("dynamic - union declaration references compound type", async () => {
  const output = await translate(
    "Declaration = (SetDeclaration) | UnionDeclaration * UnionDeclaration;\n" +
      "SetDeclaration :: String;\nUnionDeclaration :: v1 : U32 v2 : S32;\n",
  );

  assertEquals(
    output,
    left([
      {
        tag: "UnionDeclarationReferenceCompundTypeError",
        location: range(14, 1, 15, 29, 1, 30),
      },
      {
        tag: "UnionDeclarationReferenceCompundTypeError",
        location: range(33, 1, 34, 67, 1, 68),
      },
    ]),
  );
});

Deno.test("dynamic - union declaration has a cycle", async () => {
  const output = await translate(
    "Declaration = SetDeclaration | UnionDeclaration;\n" +
      "SetDeclaration :: String;\n" +
      "UnionDeclaration = Declaration | SetDeclaration;\n",
  );

  assertEquals(
    output,
    left([
      {
        tag: "UnionDeclarationCyclicReferenceError",
        location: range(0, 1, 1, 10, 1, 11),
        name: "Declaration",
      },
      {
        tag: "UnionDeclarationCyclicReferenceError",
        location: range(75, 3, 1, 90, 3, 16),
        name: "UnionDeclaration",
      },
    ]),
  );
});

const translate = async (
  content: string,
): Promise<Either<Errors.Errors, Declarations>> => {
  const result = await dynamicTranslate("./parser/tests.llt", content);

  return result.map((output) => output[0].declarations);
};

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
