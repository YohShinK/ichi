import { describe, expect, it } from "vitest";

import type { MiniProgramStorageDriver } from "./storage.js";
import {
  createRecordCode,
  deriveRecordCode,
  LOCAL_DRAW_DRAFTS_KEY,
  LocalDrawDraftRepository,
  RECORD_CODE_PATTERN,
  inspectLocalDraftStorage,
  summarizeLocalDrawDraft,
  toInitialCloudSnapshot,
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
  it("rebuilds the immutable R2 initial snapshot without replaying draw history", () => {
    const draft: LocalDrawDraft = {
      schemaVersion: "board-record-r2-1.0.0",
      boardId: "board-r2-recovery",
      savedAt: 1,
      prizeData: [
        {
          id: "a",
          tier: "A",
          rawLabel: "A賞",
          initialRemainingTickets: 3,
          isGrandPrize: true,
        },
      ],
      history: [
        { id: "draw-1", tier: "A" },
        { id: "draw-2", tier: "A" },
      ],
      cost: 130,
      verificationStatus: "verified",
      uploadStatus: "uploaded",
      unitPrice: 65,
      ipName: "世界之外",
    };

    expect(toInitialCloudSnapshot(draft)).toMatchObject({
      schemaVersion: "board-record-r2-1.0.0",
      ipName: "世界之外",
      tiers: [{ tierCode: "A", remainingTickets: 3 }],
    });
  });

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
    ).toEqual(["mutable"]);
    expect(
      repository.deleteIfMutable("mutable").map((draft) => draft.boardId),
    ).toEqual([]);
  });

  it("keeps a draw with only a legacy uploaded flag in local records", () => {
    const storage = new FakeStorage();
    const repository = new LocalDrawDraftRepository(storage);
    repository.upsert(
      makeDraft("legacy-draw", {
        uploadStatus: "uploaded",
        verificationStatus: "unverified",
      }),
    );

    expect(summarizeLocalDrawDraft(repository.readAll()[0]!)).toMatchObject({
      recordStateLabel: "待上传",
      canDelete: true,
    });
    expect(repository.deleteIfMutable("legacy-draw")).toEqual([]);
  });

  it("ignores malformed storage without deleting it silently", () => {
    const storage = new FakeStorage();
    storage.values.set(LOCAL_DRAW_DRAFTS_KEY, "not-json");
    const repository = new LocalDrawDraftRepository(storage);

    expect(repository.readAll()).toEqual([]);
    expect(storage.values.get(LOCAL_DRAW_DRAFTS_KEY)).toBe("not-json");
    expect(inspectLocalDraftStorage("not-json")).toBe("schema-incompatible");
  });

  it("does not rewrite a mixed legacy/future payload during migration", () => {
    const storage = new FakeStorage();
    const future = {
      ...makeDraft("future-v2"),
      schemaVersion: 2,
      recordCode: "F2TURE",
    };
    const legacy = { ...makeDraft("legacy-v0") } as Record<string, unknown>;
    delete legacy.schemaVersion;
    const raw = JSON.stringify([legacy, future]);
    storage.values.set(LOCAL_DRAW_DRAFTS_KEY, raw);

    expect(new LocalDrawDraftRepository(storage).readAll()).toHaveLength(1);
    expect(storage.values.get(LOCAL_DRAW_DRAFTS_KEY)).toBe(raw);
    expect(inspectLocalDraftStorage(raw)).toBe("schema-incompatible");
  });

  it("builds the shared three-line draw-record summary", () => {
    const summary = summarizeLocalDrawDraft(
      makeDraft("board-a", {
        recordType: "draw",
        recordCode: "A1B2C3",
        ipName: "葬送的芙莉莲",
        capturedAt: new Date(2026, 7, 10, 12, 0).valueOf(),
        submittedAt: new Date(2026, 7, 11, 14, 32).valueOf(),
      }),
    );

    expect(summary).toMatchObject({
      boardId: "board-a",
      title: "抽赏记录 · A1B2C3",
      recordType: "draw",
      recordCode: "A1B2C3",
      ipLabel: "葬送的芙莉莲",
      remaining: 9,
      total: 12,
      drawCount: 1,
      cost: 700,
      canResume: true,
      canDelete: true,
      recordStateLabel: "待上传",
    });
    expect(summary.createdAtLabel).toBe("8/11 14:32");
    expect(summary.identityMeta).toBe("IP: 葬送的芙莉莲 · 8/11 14:32");
    expect(summary.title).not.toContain("葬送的芙莉莲");
    expect(summary.identityMeta).not.toContain("拍摄");
    expect(summary.identityMeta).not.toContain("上传");
    expect(summary.statsMeta).toBe("余 9 / 12 · 已抽 1");
    expect(summary.statsMeta).not.toContain("累计");
  });

  it("omits draw count and spend from board-upload record summaries", () => {
    const summary = summarizeLocalDrawDraft(
      makeDraft("upload-a", {
        recordType: "board-upload",
        recordCode: "UP81A2",
        ipName: "间谍过家家",
        submittedAt: new Date(2026, 7, 12, 16, 45).valueOf(),
        history: [],
        cost: 0,
      }),
    );

    expect(summary.title).toBe("仅上传版面 · UP81A2");
    expect(summary.recordStateLabel).toBe("待上传");
    expect(summary.createdAtLabel).toBe("8/12 16:45");
    expect(summary.identityMeta).toBe("IP: 间谍过家家 · 8/12 16:45");
    expect(summary.title).not.toContain("间谍过家家");
    expect(summary.identityMeta).not.toContain("拍摄");
    expect(summary.identityMeta).not.toContain("上传");
    expect(summary.statsMeta).toBe("余 9 / 12");
    expect(summary.statsMeta).not.toContain("已抽");
    expect(summary.statsMeta).not.toContain("累计");
    expect(summary.canResume).toBe(false);
  });

  it("marks an empty historical draw as unrecoverable instead of a dead normal card", () => {
    expect(
      summarizeLocalDrawDraft(
        makeDraft("orphan", { recordType: "draw", prizeData: [] }),
      ),
    ).toMatchObject({
      canResume: false,
      canDelete: true,
      recordStateLabel: "无法恢复",
    });
  });

  it("generates stable uppercase six-character record codes", () => {
    expect(deriveRecordCode("board-a")).toBe(deriveRecordCode("board-a"));
    expect(deriveRecordCode("board-a")).not.toBe(deriveRecordCode("board-b"));
    expect(RECORD_CODE_PATTERN.test(deriveRecordCode("legacy-board"))).toBe(
      true,
    );
    expect(RECORD_CODE_PATTERN.test(createRecordCode("new-board"))).toBe(true);
    expect(deriveRecordCode("legacy-board")).toMatch(/[A-Z]/);
    expect(deriveRecordCode("legacy-board")).toMatch(/\d/);
  });

  it("keeps server-issued all-letter and all-digit display codes readable", () => {
    const storage = new FakeStorage();
    storage.values.set(
      LOCAL_DRAW_DRAFTS_KEY,
      JSON.stringify([
        makeDraft("board-all-letters", { recordCode: "LXZDNB", savedAt: 2 }),
        makeDraft("board-all-digits", { recordCode: "123456", savedAt: 1 }),
      ]),
    );

    const records = new LocalDrawDraftRepository(storage).readAll();

    expect(records.map((record) => record.recordCode)).toEqual([
      "LXZDNB",
      "123456",
    ]);
    expect(
      inspectLocalDraftStorage(storage.values.get(LOCAL_DRAW_DRAFTS_KEY)),
    ).toBe("ok");
  });

  it("resolves display-code collisions without changing board identity", () => {
    const storage = new FakeStorage();
    storage.values.set(
      LOCAL_DRAW_DRAFTS_KEY,
      JSON.stringify([
        makeDraft("board-first", { recordCode: "A1B2C3", savedAt: 2 }),
        makeDraft("board-second", { recordCode: "A1B2C3", savedAt: 1 }),
      ]),
    );
    const repository = new LocalDrawDraftRepository(storage);
    const firstRead = repository.readAll();
    const secondRead = repository.readAll();

    expect(firstRead.map((draft) => draft.boardId)).toEqual([
      "board-first",
      "board-second",
    ]);
    expect(new Set(firstRead.map((draft) => draft.recordCode)).size).toBe(2);
    expect(firstRead.map((draft) => draft.recordCode)).toEqual(
      secondRead.map((draft) => draft.recordCode),
    );
    expect(firstRead[0]?.recordCode).toBe("A1B2C3");
    expect(firstRead[1]?.recordCode).toMatch(RECORD_CODE_PATTERN);
    expect(
      JSON.parse(String(storage.values.get(LOCAL_DRAW_DRAFTS_KEY))),
    ).toEqual(expect.arrayContaining(firstRead));
  });

  it("keeps an existing code stable when a new record requests the same code", () => {
    const storage = new FakeStorage();
    const repository = new LocalDrawDraftRepository(storage);
    repository.upsert(
      makeDraft("board-existing", { recordCode: "A1B2C3", savedAt: 1 }),
    );
    repository.upsert(
      makeDraft("board-new", { recordCode: "A1B2C3", savedAt: 2 }),
    );

    const byId = new Map(
      repository.readAll().map((draft) => [draft.boardId, draft.recordCode]),
    );
    expect(byId.get("board-existing")).toBe("A1B2C3");
    expect(byId.get("board-new")).toMatch(RECORD_CODE_PATTERN);
    expect(byId.get("board-new")).not.toBe("A1B2C3");
  });

  it("keeps migrated records readable when a best-effort migration write fails", () => {
    const storage = new FakeStorage();
    storage.values.set(
      LOCAL_DRAW_DRAFTS_KEY,
      JSON.stringify([makeDraft("legacy-without-code")]),
    );
    storage.setItem = () => {
      throw new Error("storage full");
    };

    const records = new LocalDrawDraftRepository(storage).readAll();
    expect(records).toHaveLength(1);
    expect(records[0]?.recordCode).toMatch(RECORD_CODE_PATTERN);
  });

  it("migrates structurally valid pre-version drafts without losing history", () => {
    const storage = new FakeStorage();
    const legacy = { ...makeDraft("legacy-v0") } as Record<string, unknown>;
    delete legacy.schemaVersion;
    delete legacy.recordCode;
    storage.values.set(LOCAL_DRAW_DRAFTS_KEY, JSON.stringify([legacy]));

    const records = new LocalDrawDraftRepository(storage).readAll();

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      schemaVersion: 1,
      boardId: "legacy-v0",
      history: [{ id: "round-1", tier: "G" }],
    });
    expect(records[0]?.recordCode).toMatch(RECORD_CODE_PATTERN);
    expect(
      inspectLocalDraftStorage(storage.values.get(LOCAL_DRAW_DRAFTS_KEY)),
    ).toBe("ok");
  });

  it.each([
    ["pending", "待核对", undefined],
    ["verified", "已上传", undefined],
    ["location-failed", "核验失败", undefined],
    ["photo-failed", "照片核验失败", "reupload"],
    ["note-failed", "备注未通过", "edit-note"],
    ["mismatch", "核验失败", "reupload"],
    ["invalid-evidence", "核验失败", "reupload"],
    ["needs-review", "核验异常", "retry"],
    ["provider-failed", "核验异常", "retry"],
  ] as const)(
    "maps %s to the uploaded-board verification UX",
    (verificationStatus, label, action) => {
      expect(
        summarizeLocalDrawDraft(
          makeDraft(`board-${verificationStatus}`, {
            verificationStatus,
            uploadStatus: "uploaded",
            submissionState: "pending-review",
            evidenceSubmissionVersion: 1,
          }),
        ),
      ).toMatchObject({
        recordStateLabel: label,
        ...(action ? { verificationAction: action } : {}),
      });
    },
  );
});
