import { describe, expect, it } from "vitest";

import type { MiniProgramStorageDriver } from "./storage.js";
import {
  LOCAL_DRAW_DRAFTS_KEY,
  LocalDrawDraftRepository,
  summarizeLocalDrawDraft,
  type LocalDrawDraft,
} from "./local-draw-drafts.js";

class FakeStorage implements MiniProgramStorageDriver {
  readonly values = new Map<string, string>();

  getItem(key: string): unknown {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  getInfo(): { currentSizeKB: number; limitSizeKB: number } {
    return { currentSizeKB: 1, limitSizeKB: 10240 };
  }
}

const makeDraft = (
  boardId: string,
  overrides: Partial<LocalDrawDraft> = {},
): LocalDrawDraft => ({
  schemaVersion: 1,
  boardId,
  savedAt: new Date(2026, 7, 11, 14, 32).valueOf(),
  prizeData: [
    { id: "a", tier: "A", total: 2, remaining: 1 },
    { id: "g", tier: "G", total: 10, remaining: 8 },
  ],
  history: [{ id: "round-1", tier: "G" }],
  cost: 700,
  verificationStatus: "unverified",
  uploadStatus: "not-uploaded",
  ...overrides,
});

describe("mini-program local draw drafts", () => {
  it("upserts by boardId and returns newest drafts first", () => {
    const storage = new FakeStorage();
    const repository = new LocalDrawDraftRepository(storage);

    repository.upsert(makeDraft("board-a", { savedAt: 1 }));
    repository.upsert(makeDraft("board-b", { savedAt: 2 }));
    repository.upsert(makeDraft("board-a", { savedAt: 3, cost: 1400 }));

    expect(repository.readAll().map((draft) => draft.boardId)).toEqual([
      "board-a",
      "board-b",
    ]);
    expect(repository.readAll()[0]?.cost).toBe(1400);
  });

  it("deletes only unverified and not-uploaded drafts", () => {
    const storage = new FakeStorage();
    const repository = new LocalDrawDraftRepository(storage);
    repository.upsert(makeDraft("mutable"));
    repository.upsert(
      makeDraft("uploaded", {
        verificationStatus: "verified",
        uploadStatus: "uploaded",
      }),
    );

    expect(
      repository.deleteIfMutable("uploaded").map((draft) => draft.boardId),
    ).toEqual(["uploaded", "mutable"]);
    expect(
      repository.deleteIfMutable("mutable").map((draft) => draft.boardId),
    ).toEqual(["uploaded"]);
  });

  it("ignores malformed storage without deleting it silently", () => {
    const storage = new FakeStorage();
    storage.values.set(LOCAL_DRAW_DRAFTS_KEY, "not-json");
    const repository = new LocalDrawDraftRepository(storage);

    expect(repository.readAll()).toEqual([]);
    expect(storage.values.get(LOCAL_DRAW_DRAFTS_KEY)).toBe("not-json");
  });

  it("builds the shared start and local-record summary", () => {
    const summary = summarizeLocalDrawDraft(makeDraft("board-a"));

    expect(summary).toMatchObject({
      boardId: "board-a",
      title: "未分享的抽赏记录",
      remaining: 9,
      total: 12,
      drawCount: 1,
      cost: 700,
      canDelete: true,
      verificationLabel: "未核对",
      uploadLabel: "未上传",
    });
    expect(summary.meta).toContain("余 9 / 12 · 已抽 1 · 累计 ¥700");
  });
});
