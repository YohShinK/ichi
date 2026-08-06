import { createSession, type DrawSession } from "@ichi/session";
import { describe, expect, it } from "vitest";

import {
  deserializeSessionCollection,
  serializeLegacyV0ForMigrationTest,
  serializeSessionCollection,
} from "./codec.js";
import {
  deleteSession,
  getStorageCapacity,
  SessionRepository,
  upsertSession,
} from "./repository.js";
import type { SessionCollection, StorageDriver, StorageInfo } from "./types.js";

class MemoryDriver implements StorageDriver {
  value: unknown = null;
  info: StorageInfo = { currentSizeKB: 1, limitSizeKB: 10 };
  failRead = false;
  failWrite = false;
  failDelete = false;

  getItem(): unknown {
    if (this.failRead) throw new Error("read failed");
    return this.value;
  }

  setItem(_key: string, value: string): void {
    if (this.failWrite) throw new Error("write failed");
    this.value = value;
  }

  removeItem(): void {
    if (this.failDelete) throw new Error("delete failed");
    this.value = null;
  }

  getInfo(): StorageInfo {
    return this.info;
  }
}

const makeSession = (id = "session-1"): DrawSession => {
  const result = createSession({
    id,
    startedAt: "2026-08-06T00:00:00.000Z",
    pool: {
      id: `${id}:pool`,
      remainingTickets: 1,
      prizes: [{ id: "a", label: "A", remaining: 1 }],
      unitPriceMinor: 5800n,
      lastPrizeRuleConfirmed: true,
      updatedAt: "2026-08-06T00:00:00.000Z",
    },
    budget: { sessionBudgetMinor: 20_000n },
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
};

const collection = (): SessionCollection => ({
  sessions: [makeSession()],
  activeSessionId: "session-1",
});

describe("versioned session storage", () => {
  it("round-trips bigint values through decimal-string JSON tags", () => {
    const encoded = serializeSessionCollection(
      collection(),
      "2026-08-06T00:00:00.000Z",
    );
    expect(encoded).toContain('"__ichi_bigint_v1__":"5800"');
    expect(() => JSON.parse(encoded)).not.toThrow();

    const decoded = deserializeSessionCollection(encoded);
    if (!decoded.ok) throw new Error(decoded.error.message);
    expect(decoded.status).toBe("current");
    expect(decoded.value.sessions[0]?.currentPool.unitPriceMinor).toBe(5800n);
    expect(decoded.value.sessions[0]?.budget.sessionBudgetMinor).toBe(20_000n);
  });

  it("migrates the supported V0 envelope without changing session history", () => {
    const original = collection();
    const legacy = serializeLegacyV0ForMigrationTest(
      original.sessions,
      original.activeSessionId,
      "2026-08-06T00:00:00.000Z",
    );
    const decoded = deserializeSessionCollection(legacy);
    if (!decoded.ok) throw new Error(decoded.error.message);
    expect(decoded.status).toBe("migrated");
    expect(decoded.value).toEqual(original);
  });

  it("keeps the supplied memory fallback for corrupt or future data", () => {
    const fallback = collection();
    const driver = new MemoryDriver();
    const repository = new SessionRepository(driver);

    driver.value = "{broken";
    const corrupt = repository.load(fallback);
    expect(corrupt).toMatchObject({
      ok: false,
      status: "fallback",
      value: fallback,
      error: { code: "INVALID_PAYLOAD" },
    });

    driver.value = JSON.stringify({
      schemaVersion: 99,
      savedAt: "2026-08-06T00:00:00.000Z",
      payload: {},
    });
    const future = repository.load(fallback);
    expect(future).toMatchObject({
      ok: false,
      status: "fallback",
      value: fallback,
      error: { code: "UNSUPPORTED_STORAGE_VERSION" },
    });

    const malformedSession = JSON.parse(
      serializeSessionCollection(fallback, "2026-08-06T00:00:00.000Z"),
    ) as { payload: { sessions: Array<Record<string, unknown>> } };
    delete malformedSession.payload.sessions[0]?.activity;
    driver.value = JSON.stringify(malformedSession);
    expect(repository.load(fallback)).toMatchObject({
      ok: false,
      status: "fallback",
      value: fallback,
      error: { code: "INVALID_PAYLOAD" },
    });
  });

  it("preserves memory state when platform writes fail", () => {
    const fallback = collection();
    const driver = new MemoryDriver();
    driver.failWrite = true;
    const repository = new SessionRepository(driver);
    const result = repository.save(fallback, "2026-08-06T00:00:00.000Z");

    expect(result).toMatchObject({
      ok: false,
      error: { code: "WRITE_FAILED" },
    });
    expect(fallback.sessions).toHaveLength(1);
    expect(driver.value).toBeNull();
  });

  it("restores, deletes the ICHI key and reports capacity", () => {
    const driver = new MemoryDriver();
    const repository = new SessionRepository(driver);
    const original = collection();
    expect(repository.save(original, "2026-08-06T00:00:00.000Z")).toMatchObject(
      { ok: true, capacity: { state: "normal" } },
    );
    expect(
      repository.load({ sessions: [], activeSessionId: null }),
    ).toMatchObject({ ok: true, status: "restored", value: original });
    expect(repository.removeAll()).toMatchObject({ ok: true });
    expect(driver.value).toBeNull();
  });

  it("warns near the platform limit without deleting history", () => {
    const driver = new MemoryDriver();
    driver.info = { currentSizeKB: 9, limitSizeKB: 10 };
    expect(getStorageCapacity(driver)).toEqual({
      state: "near_limit",
      currentSizeKB: 9,
      limitSizeKB: 10,
      usageRatio: 0.9,
    });
    driver.info = { currentSizeKB: 10, limitSizeKB: 10 };
    expect(getStorageCapacity(driver).state).toBe("full");
  });

  it("upserts and deletes one session without touching the others", () => {
    const first = makeSession("first");
    const second = makeSession("second");
    const withFirst = upsertSession(
      { sessions: [], activeSessionId: null },
      first,
    );
    const both = upsertSession(withFirst, second);
    const deleted = deleteSession(both, "second");

    expect(both.sessions.map((session) => session.id)).toEqual([
      "first",
      "second",
    ]);
    expect(both.activeSessionId).toBe("second");
    expect(deleted.sessions.map((session) => session.id)).toEqual(["first"]);
    expect(deleted.activeSessionId).toBeNull();
  });
});
