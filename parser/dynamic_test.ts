import { assertEquals } from "../deps/asserts.ts";
import { Either, left, right } from "../deps/either.ts";
import { mkCoordinate, range } from "../deps/location.ts";
import * as Path from "../deps/path.ts";

import {
  builtinDeclarations,
  Declaration,
  Declarations,
  InternalDeclaration,
  Reference,
  Tuple,
  Type,
  Types,
} from "../cfg/definition.ts";
import * as Errors from "./errors.ts";
import {
  translateContent as dynamicTranslate,
  translateFiles,
} from "./dynamic.ts";

const SRC = "./parser/tests.llt";

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
        src: SRC,
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
      {
        tag: "SetDeclaration",
        src: SRC,
        name: "Boolean",
        elements: ["True", "False"],
      },
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
        src: SRC,
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
        src: SRC,
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
        src: SRC,
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
        src: SRC,
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
        src: SRC,
        name: "Seq",
        expected: 1,
        actual: 0,
      },
      {
        tag: "IncorrectTypeArityError",
        location: range(15, 2, 6, 17, 2, 8),
        src: SRC,
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
        src: SRC,
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
        src: SRC,
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
        src: SRC,
        name: "a",
      },
    ]),
  );
});

Deno.test("dynamic - union declaration", async () => {
  const d1 = {
    tag: "SimpleComposite",
    src: SRC,
    name: "SetDeclaration",
    type: builtInReference("String"),
  };
  const d2 = {
    tag: "RecordComposite",
    src: SRC,
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
        src: SRC,
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
        src: SRC,
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
        src: SRC,
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
        src: SRC,
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
        tag: "UnionDeclarationReferenceCompoundTypeError",
        location: range(14, 1, 15, 29, 1, 30),
        src: SRC,
      },
      {
        tag: "UnionDeclarationReferenceCompoundTypeError",
        location: range(33, 1, 34, 67, 1, 68),
        src: SRC,
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
        src: SRC,
        name: "Declaration",
      },
      {
        tag: "UnionDeclarationCyclicReferenceError",
        location: range(75, 3, 1, 90, 3, 16),
        src: SRC,
        name: "UnionDeclaration",
      },
    ]),
  );
});

Deno.test("dynamic - use - on file name", async () => {
  const output = await translateFiles(["./parser/scenarios/validRef.llt"]);

  assertEquals(
    names(output),
    right([["ValidRef"], validNames]),
  );
});

Deno.test("dynamic - use - type file uses a second type file", async () => {
  const output = await dynamicTranslate(
    "./parser/tests.llt",
    'use "./scenarios/valid.llt";\nName :: String;',
    new Set<string>(),
  );

  assertEquals(
    names(output),
    right([["Name"], validNames]),
  );
});

Deno.test("dynamic - use - using a URL", async () => {
  const output = await translateFiles(
    ["https://raw.githubusercontent.com/littlelanguages/typepiler/main/parser/scenarios/validRef.llt"],
  );
  assertEquals(
    names(output),
    right([["ValidRef"], validNames]),
  );
});

Deno.test("dynamic - use - multiple references", async () => {
  const output = await translateFiles(
    [
      "./parser/scenarios/validRefA.llt",
      "./parser/scenarios/validRef.llt",
      "https://raw.githubusercontent.com/littlelanguages/typepiler/main/parser/scenarios/validRef.llt",
    ],
  );
  assertEquals(
    names(output),
    right([["ValidRefA"], validNames, ["ValidRef"], ["ValidRef"], validNames]),
  );
});

Deno.test("dynamic - use - unqualified reference to a use declaration", async () => {
  const output = await dynamicTranslate(
    "./parser/tests.llt",
    'use "./scenarios/valid.llt";\nName :: ID;',
    new Set<string>(),
  );

  assertEquals(
    names(output),
    right([["Name"], validNames]),
  );
});

Deno.test("dynamic - use - qualified reference to a use declaration", async () => {
  const output = await dynamicTranslate(
    "./parser/tests.llt",
    'use "./scenarios/valid.llt" as D;\nName :: D.ID;',
    new Set<string>(),
  );

  assertEquals(
    names(output),
    right([["Name"], validNames]),
  );
});

Deno.test("dynamic - use - cycle", async () => {
  const output = await translate('use "./scenarios/cycleA.llt";');
  const errors = output.either((es) => es, (_) => []);

  assertEquals(errors.length, 1);
  assertEquals(errors[0].tag, "UseCycleError");

  assertEquals(
    Path.basename((errors[0] as Errors.UseCycleError).name),
    "cycleA.llt",
  );
  assertEquals(
    (errors[0] as Errors.UseCycleError).names.map((n) => Path.basename(n)),
    [
      "cycleC.llt",
      "cycleB.llt",
      "cycleA.llt",
    ],
  );
});

Deno.test("dynamic - reference to qualified module that does not exist", async () => {
  const output = await translate("Fred = X.ID;");

  assertEquals(
    output,
    left([
      {
        tag: "UnknownDeclarationError",
        location: range(7, 1, 8, 10, 1, 11),
        src: SRC,
        name: "X.ID",
      },
    ]),
  );
});

Deno.test("dynamic - reference to qualified module that does exist however the ID does not", async () => {
  const output = await translate(
    'use "./scenarios/valid.llt" as X;\nName :: X.IDS;',
  );

  assertEquals(
    output,
    left([
      {
        tag: "UnknownDeclarationError",
        location: range(42, 2, 9, 46, 2, 13),
        src: SRC,
        name: "X.IDS",
      },
    ]),
  );
});

Deno.test("dynamic - use as name clash", async () => {
  const output = await translate(
    'use "./scenarios/valid.llt" as X;\nuse "./scenarios/validRefA.llt" as X;',
  );

  assertEquals(
    output,
    left([
      {
        tag: "DuplicateDefinitionError",
        location: mkCoordinate(69, 2, 36),
        src: SRC,
        name: "X",
      },
    ]),
  );
});

Deno.test("dynamic - use name reference clash", async () => {
  const output = await translate(
    'use "./scenarios/validRef.llt";\nuse "./scenarios/validRef.llt";',
  );

  assertEquals(
    output,
    left([
      {
        tag: "DuplicateDefinitionError",
        location: range(36, 2, 5, 61, 2, 30),
        src: SRC,
        name: "ValidRef",
      },
    ]),
  );
});

const names = (
  output: Either<Errors.Errors, Array<Types>>,
): Either<Errors.Errors, Array<Array<string>>> =>
  output.map((types) =>
    types.map((type) => type.declarations.map((d) => d.name))
  );

const validNames = [
  "Declarations",
  "Declaration",
  "SetDeclaration",
  "UnionDeclaration",
  "SimpleComposite",
  "RecordComposite",
  "ID",
  "Type",
  "Tuple",
  "Reference",
  "Parenthesis",
];

const translate = async (
  content: string,
): Promise<Either<Errors.Errors, Declarations>> => {
  const result = await dynamicTranslate(
    SRC,
    content,
    new Set<string>(),
  );

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
