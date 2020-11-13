import { assertEquals } from "../testing/asserts.ts";
import { Declarations, Reference, UnionDeclaration } from "./ast.ts";
import { parse } from "./parser.ts";

Deno.test("parser - alias union", () => {
  const result: Declarations = parse("A = B | C | D;").either(
    (_) => [],
    (r) => r,
  );

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
