import assert from "node:assert/strict";
import test from "node:test";
import { examples, labels, parseVerdict, validateInput } from "../src/cases.js";

test("demo cases cover each distinct verdict", () => {
  assert.deepEqual(new Set(Object.values(examples).map(value => value.expected)), new Set(Object.keys(labels)));
  for (const { quote, extra } of Object.values(examples)) assert.equal(validateInput(quote, extra), true);
});

test("input validation matches contract boundaries", () => {
  assert.equal(validateInput(" ".repeat(30), "valid work"), false);
  assert.equal(validateInput("a".repeat(2200), "b".repeat(1000)), true);
  assert.equal(validateInput("a".repeat(2201), "valid work"), false);
});

test("read only renders supported on-chain decisions", () => {
  const verdict = { verdict: "INCLUDED", quote_excerpt: "Replace the tap.", explanation: "Explicit scope." };
  assert.deepEqual(parseVerdict(JSON.stringify(verdict)), verdict);
  for (const response of [null, {}, { ...verdict, verdict: "PENDING" }, { ...verdict, explanation: "" }]) {
    assert.throws(() => parseVerdict(JSON.stringify(response)));
  }
});
