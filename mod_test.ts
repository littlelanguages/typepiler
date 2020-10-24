import { assertEquals } from "https://deno.land/std@0.71.0/testing/asserts.ts";

export * from "https://deno.land/std@0.71.0/testing/asserts.ts";

import { message } from "./mod.ts";

Deno.test("message test", () => {
  assertEquals(message("friend"), "Hello friend");
});
