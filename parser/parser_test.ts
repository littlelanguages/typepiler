import { assertEquals } from "../testing/asserts.ts";
import {
  Declarations,
  Name,
  RecordComposite,
  Reference,
  SetDeclaration,
  SimpleComposite,
  Type,
  UnionDeclaration,
} from "./ast.ts";
import { parse } from "./parser.ts";

Deno.test("parser - alias union", () => {
  const result = parseResult("A = B | C | D;").declarations;

  assertEquals(result.length, 1);
  assertEquals(result[0].name.id, "A");
  assertEquals(result[0].tag, "UnionDeclaration");

  const unionDeclaration = result[0] as UnionDeclaration;
  assertEquals(unionDeclaration.elements.length, 3);
  ["B", "C", "D"].forEach((n, i) => {
    assertEquals(unionDeclaration.elements[i].tag, "Reference");
    assertEquals((unionDeclaration.elements[i] as Reference).name.id, n);
  });
});

Deno.test("parser - set declaration", () => {
  const result = parseResult("A = {B, C, D};").declarations;

  assertEquals(result.length, 1);
  assertEquals(result[0].name.id, "A");
  assertEquals(result[0].tag, "SetDeclaration");

  const setDeclaration = result[0] as SetDeclaration;
  assertEquals(setDeclaration.elements.length, 3);
  ["B", "C", "D"].forEach((n, i) => {
    assertEquals(setDeclaration.elements[i].tag, "Name");
    assertEquals((setDeclaration.elements[i] as Name).id, n);
  });
});

Deno.test("parser - simple composite", () => {
  const result = parseResult("Program :: Seq Declaration;").declarations;

  assertEquals(result.length, 1);
  assertEquals(result[0].name.id, "Program");
  assertEquals(result[0].tag, "SimpleComposite");

  const simpleComosite = result[0] as SimpleComposite;
  assertEquals(simpleComosite.type.tag, "Reference");
  const reference = simpleComosite.type as Reference;
  assertEquals(reference.name.id, "Seq");
  assertEquals(reference.parameters.length, 1);
  assertEquals(reference.parameters[0].tag, "Reference");
  assertEquals((reference.parameters[0] as Reference).name.id, "Declaration");
});

Deno.test("parser - record composite", () => {
  const result = parseResult(
    "FunctionDeclaration ::\n" +
      "  identifier: Identifier\n" +
      "  arguments: Seq (Identifier * Type)\n" +
      "  statements: Seq Statement\n" +
      "  suffix: Type * Expression;",
  ).declarations;

  assertEquals(result.length, 1);
  assertEquals(result[0].name.id, "FunctionDeclaration");
  assertEquals(result[0].tag, "RecordComposite");

  const recordComosite = result[0] as RecordComposite;
  assertEquals(recordComosite.fields.length, 4);
  [
    ["identifier", "[Identifier]"],
    ["arguments", "[Seq:(([Identifier],[Type]))]"],
    ["statements", "[Seq:[Statement]]"],
    ["suffix", "([Type],[Expression])"],
  ].forEach((n, idx) => assertField(recordComosite.fields[idx], n[0], n[1]));
});

const parseResult = (input: string): Declarations =>
  parse(input).either((_) => ({ imports: [], declarations: [] }), (r) => r);

const assertField = (f: [Name, Type], n: string, t: string) => {
  assertEquals(f[0].id, n);
  assertEquals(typeToString(f[1]), t);
};

const typeToString = (t: Type): string => {
  if (t.tag === "Parenthesis") {
    return `(${typeToString(t.type)})`;
  } else if (t.tag === "Reference") {
    if (t.parameters.length === 0) {
      return `[${t.name.id}]`;
    } else {
      return `[${t.name.id}:${t.parameters.map(typeToString).join(":")}]`;
    }
  } else {
    return `(${t.value.map(typeToString).join(",")})`;
  }
};
