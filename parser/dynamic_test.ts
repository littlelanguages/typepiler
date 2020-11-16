import {
  builtinDeclarations,
  Declaration,
  InternalDeclaration,
  Reference,
  Type,
} from "../cfg/definition.ts";
import { left, right } from "../data/either.ts";
import { assertEquals } from "../testing/asserts.ts";
import { translate } from "./dynamic.ts";
import { range } from "./location.ts";

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

Deno.test("dynamic - alias", () => {
  assertEquals(
    translate("Fred = Seq (String * Set String);"),
    right([
      {
        tag: "AliasDeclaration",
        name: "Fred",
        type: builtInReference("Seq", [{
          tag: "Tuple",
          value: [
            builtInReference("String"),
            builtInReference("Set", [builtInReference("String")]),
          ],
        }]),
      },
    ]),
  );
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
