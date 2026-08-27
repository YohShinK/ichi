"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { resolveObservation } = require("./remaining-observation-resolver.js");

const tier = (rawLabel, openOrdinals, observationComplete) => ({
  rawLabel,
  openOrdinals,
  observationComplete,
});
const resolveOne = (openOrdinals, observationComplete) =>
  resolveObservation({ tiers: [tier("A", openOrdinals, observationComplete)] })
    .tiers[0];

test("CASE 1: three observed ordinals resolve to three", () => {
  assert.equal(resolveOne([14, 15, 16], true).remainingTickets, 3);
});
test("CASE 2: two observed ordinals resolve to two", () => {
  assert.equal(resolveOne([1, 2], true).remainingTickets, 2);
});
test("CASE 3: complete empty observation resolves to zero", () => {
  assert.equal(resolveOne([], true).remainingTickets, 0);
});
test("CASE 4: incomplete nonempty observation stays unknown", () => {
  assert.equal(resolveOne([14, 15], null).remainingTickets, null);
});
test("CASE 5: incomplete empty observation stays unknown", () => {
  assert.equal(resolveOne([], null).remainingTickets, null);
});
test("CASE 6: duplicate ordinals are deduped and warned", () => {
  const result = resolveOne([14, 14, 15, 16], true);
  assert.equal(result.remainingTickets, 3);
  assert.ok(result.warnings.includes("DUPLICATE_OPEN_ORDINAL"));
});
test("CASE 7: non-contiguous ordinals are not gap-filled", () => {
  const result = resolveOne([14, 16], true);
  assert.equal(result.remainingTickets, 2);
  assert.ok(result.warnings.includes("NON_CONTIGUOUS_OPEN_ORDINALS"));
});
test("CASE 8: invalid ordinals fail deterministically", () => {
  for (const invalid of [0, -1])
    assert.throws(
      () => resolveOne([invalid], true),
      (error) => error.code === "OPEN_ORDINAL_INVALID",
    );
});
test("CASE 9: resolved A1/A2 aggregate into parent A", () => {
  const result = resolveObservation({
    tiers: [tier("Ａ１賞", [1], true), tier("A2", [1, 2], true)],
  });
  assert.equal(result.tiers[0].label, "A");
  assert.equal(result.tiers[0].remainingTickets, 3);
});
test("CASE 10: unknown child keeps parent unknown", () => {
  const result = resolveObservation({
    tiers: [tier("A1", [1], true), tier("A2", [1, 2], null)],
  });
  assert.equal(result.tiers[0].remainingTickets, null);
});
test("CASE 11: distinct special areas map in visual order", () => {
  const result = resolveObservation({
    tiers: [
      tier("SP賞", [], true),
      tier("SP賞", [2], true),
      tier("SP賞", [2], true),
      tier("SP賞", [], true),
    ],
  });
  assert.deepEqual(
    result.tiers.map((entry) => entry.label),
    ["SP1", "SP2", "SP3", "SP4"],
  );
});
test("CASE 12: null rawLabel stays unresolved", () => {
  const result = resolveObservation({ tiers: [tier(null, [], true)] });
  assert.equal(result.tiers.length, 0);
  assert.equal(result.unresolved.length, 1);
  assert.ok(result.unresolved[0].warnings.includes("RAW_LABEL_UNRESOLVED"));
});
