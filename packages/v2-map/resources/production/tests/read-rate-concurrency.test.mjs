import { describe, expect, it } from "vitest";
import { consumeRate, guardedDatabase, hash } from "../shared/security.mjs";
import { localDatabase } from "./db.test-support.mjs";
const NOW = Date.parse("2026-10-06T00:00:30Z");
const caller = { digest: "isolated-test-account" };
const setup = () => {
  const s = localDatabase();
  s.db.runTransaction = () => {
    throw Error("PUBLIC_READ_TRANSACTION_FORBIDDEN");
  };
  return { ...s, guarded: guardedDatabase(s.db, ["mapControlState"]) };
};
describe("durable public read quota under contention", () => {
  it.each(["missing", "existing", "rollover"])(
    "accepts 50 simultaneous details with an exact counter from %s",
    async (mode) => {
      const s = setup(),
        id = "rate:" + hash(caller.digest, "detail");
      if (mode !== "missing")
        s.table("mapControlState").set(id, {
          kind: "RATE",
          window: Math.floor(NOW / 60000) - (mode === "rollover" ? 1 : 0),
          count: mode === "rollover" ? 60 : 0,
        });
      const r = await Promise.all(
        Array.from({ length: 50 }, () =>
          consumeRate(s.guarded, caller, "detail", NOW),
        ),
      );
      expect(r.every(Boolean)).toBe(true);
      expect(s.table("mapControlState").get(id)).toMatchObject({
        window: Math.floor(NOW / 60000),
        count: 50,
      });
      expect(s.table("mapControlState").size).toBe(1);
    },
  );
  it.each([
    ["detail", 60],
    ["query", 30],
  ])(
    "enforces %s quota even with 100 simultaneous requests",
    async (op, limit) => {
      const s = setup();
      const r = await Promise.all(
        Array.from({ length: 100 }, () =>
          consumeRate(s.guarded, caller, op, NOW),
        ),
      );
      expect(r.filter(Boolean)).toHaveLength(limit);
      expect(r.filter((x) => !x)).toHaveLength(100 - limit);
      expect(
        s.table("mapControlState").get("rate:" + hash(caller.digest, op)).count,
      ).toBe(limit);
    },
  );
  it("isolates account and operation buckets and rolls over without growing storage", async () => {
    const s = setup();
    for (let minute = 0; minute < 3; minute++) {
      const results = await Promise.all(
        ["a", "b"].flatMap((digest) =>
          ["query", "detail"].flatMap((op) =>
            Array.from({ length: 50 }, () =>
              consumeRate(s.guarded, { digest }, op, NOW + minute * 60000),
            ),
          ),
        ),
      );
      expect(results.filter(Boolean)).toHaveLength(160);
      expect(s.table("mapControlState").size).toBe(4);
    }
  });
  it.each([NaN, -1, 1.5, Infinity])(
    "fails closed for malformed count %s",
    async (count) => {
      const s = setup();
      s.table("mapControlState").set("rate:" + hash(caller.digest, "detail"), {
        kind: "RATE",
        window: Math.floor(NOW / 60000),
        count,
      });
      expect(await consumeRate(s.guarded, caller, "detail", NOW)).toBe(false);
    },
  );
  it("propagates storage failure without granting a read or swallowing it as a duplicate", async () => {
    const s = setup();
    s.injectCrashAfter(1);
    await expect(consumeRate(s.guarded, caller, "detail", NOW)).rejects.toThrow(
      "injected crash",
    );
    expect(s.table("mapControlState").size).toBe(0);
  });
  it("retains transactional quotas for write commands", async () => {
    const s = setup();
    await expect(
      consumeRate(s.guarded, caller, "resolve", NOW),
    ).rejects.toThrow("PUBLIC_READ_TRANSACTION_FORBIDDEN");
  });
});
