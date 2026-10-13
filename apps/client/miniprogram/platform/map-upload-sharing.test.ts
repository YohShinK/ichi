import { describe, expect, it, vi } from "vitest";
import { SharedUploadAuthorizationQueue } from "./map-upload-sharing.js";

const id = (c: string) => `record_${c.repeat(32)}`;
const memory = () => {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
};
describe("sharing authorization from upload confirmation", () => {
  it("fails honestly when durable storage is unavailable or corrupt", () => {
    expect(
      new SharedUploadAuthorizationQueue(
        null,
        "key",
        async () => true,
      ).remember(id("a")),
    ).toBe(false);
    const s = memory();
    s.setItem("key", "broken JSON");
    expect(
      new SharedUploadAuthorizationQueue(s, "key", async () => true).remember(
        id("a"),
      ),
    ).toBe(false);
    expect(
      new SharedUploadAuthorizationQueue(
        {
          getItem: () => null,
          setItem: () => {
            throw new Error("full");
          },
        },
        "key",
        async () => true,
      ).remember(id("a")),
    ).toBe(false);
  });
  it("processes a new confirmation in a serial follow-up batch and coalesces its triggers", async () => {
    const s = memory();
    let release!: (value: boolean) => void;
    const authorize = vi.fn(async (recordId: string) =>
      recordId === id("a")
        ? new Promise<boolean>((resolve) => {
            release = resolve;
          })
        : true,
    );
    const q = new SharedUploadAuthorizationQueue(s, "key", authorize);
    q.remember(id("a"));
    const first = q.flush();
    const next = q.flush();
    expect(q.flush()).toBe(next);
    q.remember(id("b"));
    release(true);
    await Promise.all([first, next]);
    expect(JSON.parse(s.getItem("key")!)).toEqual([]);
    expect(authorize).toHaveBeenCalledTimes(2);
  });
  it("retries after verification finishes during an older unverified request", async () => {
    const s = memory();
    let release!: () => void;
    const request = new Promise<void>((resolve) => {
      release = resolve;
    });
    let approved = false;
    const authorize = vi.fn(async () => {
      const current = approved;
      if (!current) await request;
      return current;
    });
    const q = new SharedUploadAuthorizationQueue(s, "key", authorize);
    q.remember(id("a"));
    const before = q.flush();
    approved = true;
    const after = q.flush();
    release();
    await Promise.all([before, after]);
    expect(authorize).toHaveBeenCalledTimes(2);
    expect(JSON.parse(s.getItem("key")!)).toEqual([]);
  });
  it("does not let twenty unverified records starve a later verified upload after restart", async () => {
    const s = memory();
    const eligible = `record_${(24).toString(16).padStart(32, "0")}`;
    const authorize = vi.fn(async (recordId: string) => recordId === eligible);
    const q = new SharedUploadAuthorizationQueue(s, "key", authorize);
    for (let n = 0; n < 25; n++)
      q.remember(`record_${n.toString(16).padStart(32, "0")}`);
    await q.flush();
    expect(authorize).toHaveBeenCalledTimes(20);
    expect(JSON.parse(s.getItem("key")!)).toContain(eligible);
    await new SharedUploadAuthorizationQueue(s, "key", authorize).flush();
    expect(JSON.parse(s.getItem("key")!)).not.toContain(eligible);
    expect(authorize).toHaveBeenCalledTimes(40);
  });
  it("never replays a queue belonging to an earlier terms scope", async () => {
    const s = memory(),
      authorize = vi.fn(async () => true);
    new SharedUploadAuthorizationQueue(s, "old-scope", authorize).remember(
      id("a"),
    );
    await new SharedUploadAuthorizationQueue(s, "new-scope", authorize).flush();
    expect(authorize).not.toHaveBeenCalled();
  });
  it("retains server rejection across restart and bounds work to twenty records", async () => {
    const s = memory(),
      authorize = vi.fn(async () => false);
    const q = new SharedUploadAuthorizationQueue(s, "key", authorize);
    for (let n = 0; n < 25; n++)
      q.remember(`record_${n.toString(16).padStart(32, "0")}`);
    await q.flush();
    expect(authorize).toHaveBeenCalledTimes(20);
    expect(JSON.parse(s.getItem("key")!)).toHaveLength(25);
    const success = vi.fn(async () => true);
    await new SharedUploadAuthorizationQueue(s, "key", success).flush();
    expect(JSON.parse(s.getItem("key")!)).toHaveLength(5);
  });
});
