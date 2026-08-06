import { describe, expect, it } from "vitest";

import { copySession } from "./copy-session.js";
import { createSession, reduceSession } from "./session.js";
import type { DrawSession, SessionPrizePool } from "./types.js";

const makeSource = (): DrawSession => {
  const pool: SessionPrizePool = {
    id: "source-pool",
    remainingTickets: 2,
    prizes: [
      { id: "a", label: "A", remaining: 1 },
      { id: "b", label: "B", remaining: 1 },
    ],
    unitPriceMinor: 5000n,
    lastPrizeRuleConfirmed: false,
    updatedAt: "2026-08-06T00:00:00.000Z",
  };
  const created = createSession({
    id: "source",
    startedAt: "2026-08-06T00:00:00.000Z",
    pool,
    targets: [{ prizeId: "a", required: 1 }],
    boardSnapshot: {
      snapshotVersion: 1,
      boardSchemaVersion: "1.0.0",
      componentRegistryId: "v1-saturated-board-components",
      recognitionContractVersion: "1.0.0",
      confirmedDraft: { schemaVersion: "1.0.0", draftId: "draft-1" },
    },
  });
  if (!created.ok) throw new Error(created.error.message);
  const selected = reduceSession(created.value, {
    type: "SELECT_PRIZE",
    prizeId: "b",
  });
  if (!selected.ok) throw new Error(selected.error.message);
  const confirmed = reduceSession(selected.value, {
    type: "CONFIRM_DRAFT",
    roundId: "source-round",
    occurredAt: "2026-08-06T00:01:00.000Z",
  });
  if (!confirmed.ok) throw new Error(confirmed.error.message);
  return confirmed.value;
};

describe("copySession", () => {
  it("copies the current pool into a fresh identity without history or spend", () => {
    const source = makeSource();
    const copied = copySession(source, {
      newSessionId: "copy",
      newPoolId: "copy-pool",
      startedAt: "2026-08-06T01:00:00.000Z",
    });
    if (!copied.ok) throw new Error(copied.error.message);

    expect(copied.value.id).toBe("copy");
    expect(copied.value.startedAt).toBe("2026-08-06T01:00:00.000Z");
    expect(copied.value.initialPool.id).toBe("copy-pool");
    expect(copied.value.initialPool.remainingTickets).toBe(1);
    expect(copied.value.currentPool).toEqual(copied.value.initialPool);
    expect(copied.value.rounds).toEqual([]);
    expect(copied.value.spentMinor).toBe(0n);
    expect(copied.value.activity).toEqual({ state: "idle" });
    expect(copied.value.poolRevision).toBe(0);
    expect(copied.value.boardSnapshot).toEqual(source.boardSnapshot);
    expect(copied.value.boardSnapshot).not.toBe(source.boardSnapshot);
    expect(source.rounds).toHaveLength(1);
    expect(source.spentMinor).toBe(5000n);
  });
});
