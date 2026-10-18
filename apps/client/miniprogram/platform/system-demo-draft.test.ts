import { toR2MapBoardProjection } from "./board-record-r2.js";
import { describe, expect, it, vi } from "vitest";
import type { MiniProgramStorageDriver } from "./storage.js";
import {
  LocalDrawDraftRepository,
  LOCAL_DRAW_DRAFTS_KEY,
  currentRemainingForPrize,
  initialRemainingForPrize,
  isLocalDrawDraft,
  summarizeLocalDrawDraft,
  toInitialCloudSnapshot,
  type LocalDrawDraft,
} from "./local-draw-drafts.js";
import {
  createSystemDemoDraft,
  ensureSystemDemoDraft,
} from "./system-demo-draft.js";
import {
  SYSTEM_DEMO_BOARD_ID,
  SYSTEM_DEMO_ISSUANCE_KEY,
  SYSTEM_DEMO_TUTORIAL_ID,
} from "./local-board-source.js";
import { drawPrize, undoLastDraw, remainingTickets } from "./draw-session.js";
import { buildBoardOutlook } from "./board-outlook.js";
import { projectPrizeStates } from "./draw-session.js";
import {
  finalizeCloudObservation,
  prepareCloudObservationForUpload,
} from "./cloud-recognition-task.js";
import {
  prepareAuthoritativeDrawRecord,
  uploadDrawTicketEvidence,
  createPendingDrawTicketVerification,
  runPendingDrawTicketVerification,
  reviewDrawTicketNote,
  submitDrawTicketEvidence,
  type DrawTicketEvidenceApi,
  type PendingDrawTicketEvidence,
} from "./draw-ticket-recognition.js";

class Storage implements MiniProgramStorageDriver {
  readonly values = new Map<string, string>();
  fail: ((operation: string, key: string) => boolean) | undefined;
  getItem(key: string) {
    if (this.fail?.("get", key)) throw Error("read");
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (this.fail?.("set", key)) throw Error("write");
    this.values.set(key, value);
  }
  removeItem(key: string) {
    if (this.fail?.("remove", key)) throw Error("remove");
    this.values.delete(key);
  }
  getInfo() {
    return { currentSizeKB: 1, limitSizeKB: 10240 };
  }
}
const setup = () => {
  const storage = new Storage();
  const repository = new LocalDrawDraftRepository(storage);
  return {
    storage,
    repository,
    ensure: () => ensureSystemDemoDraft(repository),
  };
};
const realDraft: LocalDrawDraft = {
  schemaVersion: 1,
  boardId: "real-board",
  savedAt: 2,
  prizeData: [{ id: "a", tier: "A", total: 3, remaining: 3 }],
  history: [],
  cost: 0,
  unitPrice: 50,
  ipName: "真实版面",
  verificationStatus: "unverified",
  uploadStatus: "not-uploaded",
};

describe("system demo R2 uses the real draw session", () => {
  it("has all ten exact capacities, D then C, 86→84 and ¥138", () => {
    const draft = createSystemDemoDraft(100);
    expect(isLocalDrawDraft(draft)).toBe(true);
    expect(
      draft.prizeData.map((p) => [
        p.tier,
        initialRemainingForPrize(p),
        currentRemainingForPrize(draft, p),
      ]),
    ).toEqual([
      ["SP1", 1, 1],
      ["A", 3, 3],
      ["B", 3, 3],
      ["C", 1, 0],
      ["D", 12, 11],
      ["E", 13, 13],
      ["F", 20, 20],
      ["G", 11, 11],
      ["H", 11, 11],
      ["I", 11, 11],
    ]);
    expect(
      draft.prizeData
        .filter((p) => "isGrandPrize" in p && p.isGrandPrize)
        .map((p) => p.tier),
    ).toEqual(["SP1", "A", "B", "C"]);
    expect(draft.history.map((e) => e.tier)).toEqual(["D", "C"]);
    expect(new Set(draft.history.map((e) => e.id)).size).toBe(2);
    expect(draft.history.every((e) => e.occurredAt === 100)).toBe(true);
    expect(remainingTickets(draft)).toBe(84);
    expect(draft.cost).toBe(138);
    expect(draft).toMatchObject({
      unitPrice: 69,
      ipName: "新手引导",
      themeName: "教程体验版面",
      source: "SYSTEM_DEMO",
      undoFloor: 0,
    });
    expect(draft.cloudRecordId).toBeUndefined();
    expect(draft.recognitionJobId).toBeUndefined();
    expect(draft.capturedAt).toBeUndefined();
  });
  it("undoes C then D with exact history/cost restoration and permits C again", () => {
    const initial = createSystemDemoDraft(100);
    const first = undoLastDraw(initial, 69, 0, 101);
    expect(first).toMatchObject({ ok: true, tier: "C", draft: { cost: 69 } });
    expect(remainingTickets(first.draft)).toBe(85);
    expect(first.draft.history.map((e) => e.tier)).toEqual(["D"]);
    const last = undoLastDraw(first.draft, 69, 1, 102);
    expect(last).toMatchObject({
      ok: true,
      tier: "D",
      draft: { cost: 0, history: [] },
    });
    expect(remainingTickets(last.draft)).toBe(86);
    expect(
      last.draft.prizeData.every(
        (p) =>
          currentRemainingForPrize(last.draft, p) ===
          initialRemainingForPrize(p),
      ),
    ).toBe(true);
    expect(drawPrize(last.draft, "C", 69, 103)).toMatchObject({
      ok: true,
      draft: { cost: 69 },
    });
  });
  it.each(["SP1", "A", "B", "D", "E", "F", "G", "H", "I"])(
    "continues tier %s and preserves the existing calculation path",
    (tier) => {
      const initial = createSystemDemoDraft();
      const next = drawPrize(initial, tier, 69).draft;
      expect(remainingTickets(next)).toBe(83);
      expect(next.cost).toBe(207);
      expect(undoLastDraw(next, 69, 0).draft.history).toEqual(initial.history);
      expect(
        buildBoardOutlook({
          prizes: projectPrizeStates(next),
          targetTiers: next.targetTiers ?? [],
          unitPrice: 69,
        }),
      ).toMatchObject({ status: "available" });
    },
  );
  it("rejects empty C and labels demo as local only without retry actions", () => {
    const demo = createSystemDemoDraft();
    expect(drawPrize(demo, "C", 69).ok).toBe(false);
    expect(summarizeLocalDrawDraft(demo)).toMatchObject({
      total: 86,
      remaining: 84,
      drawCount: 2,
      cost: 138,
      canUpload: false,
      isSystemDemo: true,
      recordStateLabel: "不可上传",
      canResume: true,
    });
    expect(
      summarizeLocalDrawDraft({ ...demo, verificationStatus: "photo-failed" })
        .verificationAction,
    ).toBeUndefined();
  });
});

describe("installation-local issuance and ordered recovery", () => {
  it("issues once without an account, API, version or network dependency", () => {
    const { repository, ensure, storage } = setup();
    expect(ensure()).toBe("ISSUED");
    expect(repository.readAll()).toHaveLength(1);
    expect(JSON.parse(storage.values.get(SYSTEM_DEMO_ISSUANCE_KEY)!)).toEqual({
      tutorialId: SYSTEM_DEMO_TUTORIAL_ID,
      state: "ISSUED",
    });
    expect(ensure()).toBe("EXISTING");
  });
  it("adds a demo for existing users without mutating their draft or navigation keys", () => {
    const { storage, repository, ensure } = setup();
    repository.upsert(realDraft);
    storage.values.set("ichi:active-board", "real-board");
    const original = repository.readAll()[0];
    expect(ensure()).toBe("ISSUED");
    expect(
      repository.readAll().find((d) => d.boardId === realDraft.boardId),
    ).toEqual(original);
    expect(storage.values.get("ichi:active-board")).toBe("real-board");
    expect(toInitialCloudSnapshot(realDraft)).toMatchObject({ ip: "真实版面" });
  });
  it("coalesces concurrent callers across repositories with synchronous Storage", async () => {
    const { storage, repository, ensure } = setup();
    const other = new LocalDrawDraftRepository(storage);
    const results = await Promise.all(
      Array.from({ length: 30 }, (_, i) =>
        Promise.resolve().then(() =>
          i % 2 ? ensure() : ensureSystemDemoDraft(other),
        ),
      ),
    );
    expect(results.filter((r) => r === "ISSUED")).toHaveLength(1);
    expect(repository.readAll()).toHaveLength(1);
  });
  it("reconciles the existing played board without rewriting events or saved time", () => {
    const { storage, repository, ensure } = setup();
    const played = drawPrize(createSystemDemoDraft(3), "F", 69, 4).draft;
    repository.upsert(played);
    const before = storage.values.get(LOCAL_DRAW_DRAFTS_KEY);
    expect(ensure()).toBe("EXISTING");
    expect(storage.values.get(LOCAL_DRAW_DRAFTS_KEY)).toBe(before);
    expect(repository.readAll()[0]).toMatchObject({
      cost: 207,
      savedAt: 4,
      history: played.history,
    });
  });
  it("restarts and survives package upgrades without reissuing or resetting draws", () => {
    const { storage, repository, ensure } = setup();
    ensure();
    const played = drawPrize(repository.readAll()[0]!, "I", 69, 500).draft;
    repository.upsert(played);
    const restarted = new LocalDrawDraftRepository(storage);
    expect(ensureSystemDemoDraft(restarted)).toBe("EXISTING");
    expect(restarted.readAll()[0]).toEqual(played);
  });
  it.each(["delete", "deleteIfMutable"] as const)(
    "manual %s remains deleted through restart/upgrade and stale saves",
    (method) => {
      const { storage, repository, ensure } = setup();
      ensure();
      const stale = repository.readAll()[0]!;
      repository[method](SYSTEM_DEMO_BOARD_ID);
      const restarted = new LocalDrawDraftRepository(storage);
      expect(ensureSystemDemoDraft(restarted)).toBe("DELETED");
      expect(restarted.readAll()).toEqual([]);
      expect(() => restarted.upsert(stale)).toThrow("SYSTEM_DEMO_DELETED");
    },
  );
  it("never replenishes a missing issued board, but allows a fresh cleared installation", () => {
    const { storage, repository, ensure } = setup();
    ensure();
    storage.values.delete(LOCAL_DRAW_DRAFTS_KEY);
    expect(ensure()).toBe("ISSUED_MISSING");
    expect(repository.readAll()).toEqual([]);
    storage.values.clear();
    expect(ensure()).toBe("ISSUED");
  });
  it("clear-all suppresses issuance while clearing only the existing draft collection", () => {
    const { storage, repository, ensure } = setup();
    ensure();
    repository.upsert(realDraft);
    storage.values.set("other-data", "keep");
    repository.clearAll();
    expect(ensure()).toBe("DELETED");
    expect(repository.readAll()).toEqual([]);
    expect(storage.values.get("other-data")).toBe("keep");
  });
  it.each(["get", "set"])(
    "a %s failure on the draft key never damages real boards or acknowledges issuance",
    (operation) => {
      const { storage, repository, ensure } = setup();
      repository.upsert(realDraft);
      const before = storage.values.get(LOCAL_DRAW_DRAFTS_KEY);
      storage.fail = (op, key) =>
        op === operation && key === LOCAL_DRAW_DRAFTS_KEY;
      expect(ensure()).toBe("UNAVAILABLE");
      expect(storage.values.get(LOCAL_DRAW_DRAFTS_KEY)).toBe(before);
      expect(storage.values.has(SYSTEM_DEMO_ISSUANCE_KEY)).toBe(false);
      storage.fail = undefined;
      expect(ensure()).toBe("ISSUED");
      expect(repository.readAll()).toHaveLength(2);
    },
  );
  it("acknowledgement failure leaves one complete valid board and recovers without resetting play", () => {
    const { storage, repository, ensure } = setup();
    storage.fail = (op, key) =>
      op === "set" && key === SYSTEM_DEMO_ISSUANCE_KEY;
    expect(ensure()).toBe("UNAVAILABLE");
    const draft = repository.readAll()[0]!;
    expect(isLocalDrawDraft(draft)).toBe(true);
    repository.upsert(drawPrize(draft, "E", 69, 500).draft);
    storage.fail = undefined;
    expect(ensure()).toBe("EXISTING");
    expect(repository.readAll()).toHaveLength(1);
    expect(repository.readAll()[0]!.history).toHaveLength(3);
  });
  it("failure to save the deletion tombstone leaves the board untouched", () => {
    const { storage, repository, ensure } = setup();
    ensure();
    const before = storage.values.get(LOCAL_DRAW_DRAFTS_KEY);
    storage.fail = (op, key) =>
      op === "set" && key === SYSTEM_DEMO_ISSUANCE_KEY;
    expect(() => repository.delete(SYSTEM_DEMO_BOARD_ID)).toThrow();
    expect(storage.values.get(LOCAL_DRAW_DRAFTS_KEY)).toBe(before);
    storage.fail = undefined;
    expect(ensure()).toBe("EXISTING");
  });
  it("a deletion interrupted after the tombstone recovers removal and cannot resurrect", () => {
    const { storage, repository, ensure } = setup();
    ensure();
    repository.upsert(realDraft);
    storage.fail = (op, key) => op === "set" && key === LOCAL_DRAW_DRAFTS_KEY;
    expect(() => repository.delete(SYSTEM_DEMO_BOARD_ID)).toThrow();
    expect(ensure()).toBe("UNAVAILABLE");
    expect(
      JSON.parse(storage.values.get(SYSTEM_DEMO_ISSUANCE_KEY)!).state,
    ).toBe("DELETED");
    storage.fail = undefined;
    expect(ensure()).toBe("DELETED");
    expect(repository.readAll().map((d) => d.boardId)).toEqual(["real-board"]);
  });
  it.each([
    "bad-json",
    JSON.stringify({ tutorialId: "wrong", state: "ISSUED" }),
  ])(
    "an invalid issuance marker fails closed without touching real data",
    (marker) => {
      const { storage, repository, ensure } = setup();
      repository.upsert(realDraft);
      const before = storage.values.get(LOCAL_DRAW_DRAFTS_KEY);
      storage.values.set(SYSTEM_DEMO_ISSUANCE_KEY, marker);
      expect(ensure()).toBe("UNAVAILABLE");
      expect(storage.values.get(LOCAL_DRAW_DRAFTS_KEY)).toBe(before);
    },
  );
  it.each(["bad-json", JSON.stringify([realDraft, { schemaVersion: 999 }])])(
    "incompatible drafts are not decoded and overwritten during issuance",
    (stored) => {
      const { storage, ensure } = setup();
      storage.values.set(LOCAL_DRAW_DRAFTS_KEY, stored);
      expect(ensure()).toBe("UNAVAILABLE");
      expect(storage.values.get(LOCAL_DRAW_DRAFTS_KEY)).toBe(stored);
      expect(storage.values.has(SYSTEM_DEMO_ISSUANCE_KEY)).toBe(false);
    },
  );
  it("real drafts still upload, save and delete normally after demo deletion", () => {
    const { repository, ensure } = setup();
    ensure();
    repository.delete(SYSTEM_DEMO_BOARD_ID);
    repository.upsert(realDraft);
    expect(toInitialCloudSnapshot(repository.readAll()[0]!)).toMatchObject({
      ip: "真实版面",
    });
    expect(summarizeLocalDrawDraft(realDraft)).toMatchObject({
      isSystemDemo: false,
      canUpload: true,
    });
    repository.delete(realDraft.boardId);
    expect(repository.readAll()).toEqual([]);
  });
});

describe("client transport isolation before any side effect", () => {
  const recordId = "record_" + "a".repeat(32);
  const pending: PendingDrawTicketEvidence = {
    boardId: SYSTEM_DEMO_BOARD_ID,
    recordId,
    submissionVersion: 1,
    imageFileId: "fake",
    captureSource: "camera",
    albumSaveWarning: false,
    image: { width: 1, height: 1, byteLength: 1 },
  };
  const input = {
    ...pending,
    imagePath: "photo",
    drawEvents: [],
    userNote: "test",
  };
  const api = new Proxy({} as DrawTicketEvidenceApi, {
    get: () =>
      vi.fn(() => {
        throw Error("UNEXPECTED_SIDE_EFFECT");
      }),
  });
  it.each([
    [
      "initial P1 snapshot",
      () => toInitialCloudSnapshot(createSystemDemoDraft()),
    ],
    [
      "snapshot with source retained but changed ID",
      () =>
        toInitialCloudSnapshot({
          ...createSystemDemoDraft(),
          boardId: "changed",
        }),
    ],
    [
      "snapshot with source removed but stable ID",
      () =>
        toInitialCloudSnapshot({ ...realDraft, boardId: SYSTEM_DEMO_BOARD_ID }),
    ],
    ["create pending", () => createPendingDrawTicketVerification(api, pending)],
    [
      "verification retry",
      () => runPendingDrawTicketVerification(api, pending),
    ],
    ["note review", () => reviewDrawTicketNote(api, input)],
  ] as const)("blocks %s", (_name, run) =>
    expect(run).toThrow("SYSTEM_DEMO_LOCAL_ONLY"),
  );
  it.each([
    ["draw synchronization", () => prepareAuthoritativeDrawRecord(api, input)],
    [
      "image upload/album/compression",
      () => uploadDrawTicketEvidence(api, input),
    ],
    ["submit", () => submitDrawTicketEvidence(api, input)],
    [
      "submit/reused evidence",
      () =>
        submitDrawTicketEvidence(api, {
          ...input,
          reuseOriginalEvidenceFileId: "fake",
        }),
    ],
  ] as const)("blocks %s", async (_name, run) => {
    await expect(run()).rejects.toThrow("SYSTEM_DEMO_LOCAL_ONLY");
  });
  it("blocks both new/restore P1 preparation and finalization before cloud calls", () => {
    const callFunction = vi.fn();
    const cloud = { callFunction };
    const prepare = { boardId: SYSTEM_DEMO_BOARD_ID } as Parameters<
      typeof prepareCloudObservationForUpload
    >[1];
    const finalize = { boardId: SYSTEM_DEMO_BOARD_ID } as Parameters<
      typeof finalizeCloudObservation
    >[1];
    expect(() => prepareCloudObservationForUpload(cloud, prepare)).toThrow(
      "SYSTEM_DEMO_LOCAL_ONLY",
    );
    expect(() => finalizeCloudObservation(cloud, finalize)).toThrow(
      "SYSTEM_DEMO_LOCAL_ONLY",
    );
    expect(callFunction).not.toHaveBeenCalled();
  });
  it("blocks direct local-to-map projection even with forged approved transport fields", () => {
    const record = { boardId: SYSTEM_DEMO_BOARD_ID } as Parameters<
      typeof toR2MapBoardProjection
    >[0];
    expect(() => toR2MapBoardProjection(record)).toThrow(
      "SYSTEM_DEMO_LOCAL_ONLY",
    );
  });
  it("repository forbids cloud identity/finalization metadata on demos", () => {
    const { repository } = setup();
    expect(() =>
      repository.upsert({
        ...createSystemDemoDraft(),
        cloudRecordId: recordId,
      }),
    ).toThrow("SYSTEM_DEMO_LOCAL_ONLY");
    expect(() =>
      repository.upsert({
        ...createSystemDemoDraft(),
        uploadStatus: "uploaded",
      }),
    ).toThrow("SYSTEM_DEMO_LOCAL_ONLY");
  });
});
