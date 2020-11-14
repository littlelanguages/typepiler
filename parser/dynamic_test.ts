import { right } from "../data/either.ts";
import { assertEquals } from "../testing/asserts.ts";
import { translate } from "./dynamic.ts";

Deno.test("dynamic - empty definitions", () => {
  assertEquals(translate(""), right([]));
});
