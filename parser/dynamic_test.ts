import { right } from "../data/either.ts";
import { assertEquals } from "../testing/asserts.ts";
import { translate } from "./dynamic.ts";

Deno.test("dynamic - empty declaration", () => {
  assertEquals(translate(""), right([]));
});

Deno.test("dynamic - set declaration", () => {
  assertEquals(
    translate("Boolean = {True, False};"),
    right([
      { tag: "SetDeclaration", name: "Boolean", elements: ["True", "False"] },
    ]),
  );
});
