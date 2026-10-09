import { test } from "node:test";
import assert from "node:assert/strict";
import { qs } from "../src/redmine-client.js";

test("qs omits empty values", () => {
  assert.equal(qs({ a: 1, b: null, c: "", d: undefined, e: "x" }), "?a=1&e=x");
});

test("qs empty object", () => {
  assert.equal(qs({}), "");
});
