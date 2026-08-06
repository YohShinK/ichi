import { fraction } from "@ichi/core";
import { describe, expect, it } from "vitest";

import { createSession, reduceSession } from "./session.js";
import type { DrawSession, SessionPrizePool } from "./types.js";

const pool = (): SessionPrizePool => ({
  id: "pool-1",
  seriesAlias: "测试系列",
  remainingTickets: 4,
  prizes: [
    { id: "a", label: "A", remaining: 1 },
    { id: "b", label: "B", remaining: 2 },
    { id: "c", label: "C", remaining: 1 },
  ],
  unitPriceMinor: 5800n,
  lastPrizeRuleConfirmed: true,
  updatedAt: "2026-08-06T00:00:00.000Z",
});

const session = (): DrawSession => {
  const created = createSession({
    id: "session-1",
    startedAt: "2026-08-06T00:00:00.000Z",
    pool: pool(),
    targets: [{ prizeId: "a", required: 1 }],
    budget: {
      sessionBudgetMinor: 20_000n,
      maxPlannedDraws: 3,
      minimumSuccessProbability: fraction(1n, 2n),
      stopConditions: ["budget"],
    },
  });
  if (!created.ok) throw new Error(created.error.message);
  return created.value;
};

const select = (value: DrawSession, prizeId: string): DrawSession => {
  const result = reduceSession(value, { type: "SELECT_PRIZE", prizeId });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const confirm = (
  value: DrawSession,
  roundId: string,
  occurredAt: string,
): DrawSession => {
  const result = reduceSession(value, {
    type: "CONFIRM_DRAFT",
    roundId,
    occurredAt,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

describe("V1-C session state machine", () => {
  it("selects, replaces and clears exactly one prize draft", () => {
    const initial = session();
    const selectedA = select(initial, "a");
    expect(selectedA.activity).toEqual({ state: "draft", prizeId: "a" });

    const selectedB = select(selectedA, "b");
    expect(selectedB.activity).toEqual({ state: "draft", prizeId: "b" });
    expect("quantity" in selectedB.activity).toBe(false);

    const cleared = reduceSession(selectedB, { type: "CLEAR_DRAFT" });
    expect(cleared).toMatchObject({
      ok: true,
      value: { activity: { state: "idle" } },
    });
    expect(initial.currentPool).toEqual(pool());
  });

  it("rejects unknown or unavailable prizes without changing the session", () => {
    const initial = session();
    const unknown = reduceSession(initial, {
      type: "SELECT_PRIZE",
      prizeId: "missing",
    });
    expect(unknown).toMatchObject({
      ok: false,
      error: { code: "PRIZE_NOT_FOUND" },
    });

    const emptyPool = {
      ...initial,
      currentPool: {
        ...initial.currentPool,
        prizes: initial.currentPool.prizes.map((prize) =>
          prize.id === "a" ? { ...prize, remaining: 0 } : prize,
        ),
      },
    };
    const unavailable = reduceSession(emptyPool, {
      type: "SELECT_PRIZE",
      prizeId: "a",
    });
    expect(unavailable).toMatchObject({
      ok: false,
      error: { code: "PRIZE_UNAVAILABLE" },
    });
    expect(initial.activity).toEqual({ state: "idle" });
  });

  it("atomically confirms three one-ticket rounds and refreshes calculations", () => {
    let current = session();
    const draws = ["b", "c", "a"] as const;
    draws.forEach((prizeId, index) => {
      current = select(current, prizeId);
      current = confirm(
        current,
        `round-${index + 1}`,
        `2026-08-06T00:0${index + 1}:00.000Z`,
      );
      if (index < draws.length - 1) {
        const next = reduceSession(current, { type: "START_NEXT_ROUND" });
        if (!next.ok) throw new Error(next.error.message);
        current = next.value;
      }
    });

    expect(current.currentPool.remainingTickets).toBe(1);
    expect(current.spentMinor).toBe(17_400n);
    expect(current.rounds).toHaveLength(3);
    expect(current.rounds.every((round) => round.quantity === 1)).toBe(true);
    expect(current.currentPool.prizes).toEqual([
      { id: "a", label: "A", remaining: 0 },
      { id: "b", label: "B", remaining: 1 },
      { id: "c", label: "C", remaining: 0 },
    ]);
    expect(current.calculation).toMatchObject({
      remainingTickets: 1,
      targetTickets: 0,
      nextDrawHitProbability: { numerator: 0n, denominator: 1n },
    });
  });

  it("leaves the entire input object unchanged when confirmation fails", () => {
    const first = confirm(
      select(session(), "b"),
      "round-1",
      "2026-08-06T00:01:00.000Z",
    );
    const prepared = select(first, "c");
    const before = structuredClone(prepared);
    const duplicate = reduceSession(prepared, {
      type: "CONFIRM_DRAFT",
      roundId: "round-1",
      occurredAt: "2026-08-06T00:02:00.000Z",
    });

    expect(duplicate).toMatchObject({
      ok: false,
      error: { code: "DUPLICATE_ID" },
    });
    expect(prepared).toEqual(before);
  });

  it("undoes only the latest round, restores all numeric state and rejects repeats", () => {
    const initial = session();
    const confirmed = confirm(
      select(initial, "b"),
      "round-1",
      "2026-08-06T00:01:00.000Z",
    );
    const undone = reduceSession(confirmed, {
      type: "UNDO_LAST_ROUND",
      undoneAt: "2026-08-06T00:02:00.000Z",
    });
    if (!undone.ok) throw new Error(undone.error.message);

    expect(undone.value.currentPool.remainingTickets).toBe(4);
    expect(undone.value.currentPool.prizes).toEqual(initial.currentPool.prizes);
    expect(undone.value.spentMinor).toBe(0n);
    expect(undone.value.calculation.nextDrawHitProbability).toEqual(
      fraction(1n, 4n),
    );
    expect(undone.value.rounds[0]).toMatchObject({
      status: "undone",
      undoneAt: "2026-08-06T00:02:00.000Z",
    });

    const repeated = reduceSession(undone.value, {
      type: "UNDO_LAST_ROUND",
      undoneAt: "2026-08-06T00:03:00.000Z",
    });
    expect(repeated).toMatchObject({
      ok: false,
      error: { code: "ROUND_ALREADY_UNDONE" },
    });
  });

  it("rejects unsafe undo after a baseline revision or while a draft exists", () => {
    const confirmed = confirm(
      select(session(), "b"),
      "round-1",
      "2026-08-06T00:01:00.000Z",
    );
    const withDraft = select(confirmed, "c");
    expect(
      reduceSession(withDraft, {
        type: "UNDO_LAST_ROUND",
        undoneAt: "2026-08-06T00:02:00.000Z",
      }),
    ).toMatchObject({
      ok: false,
      error: { code: "DRAFT_MUST_BE_CLEARED" },
    });

    const changed = { ...confirmed, poolRevision: confirmed.poolRevision + 1 };
    expect(
      reduceSession(changed, {
        type: "UNDO_LAST_ROUND",
        undoneAt: "2026-08-06T00:02:00.000Z",
      }),
    ).toMatchObject({
      ok: false,
      error: { code: "BASELINE_CHANGED" },
    });
  });

  it("rejects non-conserving pools before a session exists", () => {
    const invalid = createSession({
      id: "invalid",
      startedAt: "2026-08-06T00:00:00.000Z",
      pool: { ...pool(), remainingTickets: 99 },
    });
    expect(invalid).toMatchObject({
      ok: false,
      error: { code: "INVALID_SESSION" },
    });
  });

  it("rejects an invalid persisted probability threshold at the session boundary", () => {
    const invalid = createSession({
      id: "invalid-threshold",
      startedAt: "2026-08-06T00:00:00.000Z",
      pool: pool(),
      budget: {
        minimumSuccessProbability: { numerator: 2n, denominator: 1n },
      },
    });
    expect(invalid).toMatchObject({
      ok: false,
      error: { code: "INVALID_SESSION", field: "budget" },
    });
  });
});
