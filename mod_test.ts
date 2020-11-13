import { assertEquals } from "./testing/asserts.ts";
import { message } from "./mod.ts";

Deno.test("message test", () => {
  assertEquals(message("friend"), "Hello friend");
});
