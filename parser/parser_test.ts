import { assertEquals, AssertionError } from "../testing/asserts.ts";
import {
  Declarations,
  Name,
  Reference,
  SetDeclaration,
  SimpleComposite,
  UnionDeclaration,
} from "./ast.ts";
import { parse } from "./parser.ts";

Deno.test("parser - alias union", () => {
  const result = parseResult("A = B | C | D;");

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
  const result = parseResult("A = {B, C, D};");

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
  const result = parseResult(
    "Program :: Seq Declaration;",
  );

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

const parseResult = (input: string): Declarations =>
  parse(input).either((_) => [], (r) => r);
