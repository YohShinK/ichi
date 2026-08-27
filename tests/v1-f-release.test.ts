import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  LOCAL_DRAW_DRAFTS_KEY,
  LocalDrawDraftRepository,
  RECORD_CODE_PATTERN,
  type LocalDrawDraft,
} from "../apps/client/miniprogram/platform/local-draw-drafts.js";
import {
  drawPrize,
  undoLastDraw,
} from "../apps/client/miniprogram/platform/draw-session.js";
import { recognizeBoardImage } from "../apps/client/miniprogram/platform/board-recognition.js";
import type { MiniProgramStorageDriver } from "../apps/client/miniprogram/platform/storage.js";

const root = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

class MemoryStorage implements MiniProgramStorageDriver {
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

  getInfo() {
    return { currentSizeKB: 1, limitSizeKB: 10240 };
  }
}

const makeDraft = (index: number): LocalDrawDraft => ({
  schemaVersion: 1,
  boardId: `board-${index}`,
  savedAt: index,
  prizeData: [{ id: `g-${index}`, tier: "G", total: 60, remaining: 60 }],
  history: [],
  cost: 0,
  verificationStatus: "unverified",
  uploadStatus: "not-uploaded",
  ipName: `IP ${index}`,
});

describe("V1-F release safeguards", () => {
  it("keeps both entry paths, strict recognition gates and private-data disclosure visible", () => {
    const wxml = read("apps/client/miniprogram/pages/home/index.wxml");
    const page = read("apps/client/miniprogram/pages/home/index.ts");

    expect(wxml).toContain('data-flow-mode="assist"');
    expect(wxml).toContain('data-flow-mode="direct-upload"');
    expect(wxml).toContain(
      "版面照片和赏票照片都只用于当次识别或核验，终态后删除",
    );
    expect(wxml).toContain("赏票照片只用于本次核验，核验终态后删除");
    expect(wxml).toContain("待上传草稿保存在当前设备");
    expect(wxml).toContain("V1 不公开地图");
    expect(wxml).toContain(
      "disabled=\"{{!recognitionValidation.canConfirm || generationState === 'generating'}}\"",
    );
    expect(wxml).toContain("recognitionValidation.unitPriceBlocking");
    expect(wxml).toContain("item.remainingTicketsBlocking");
    expect(wxml).toContain("设定大赏");
    expect(wxml).not.toContain("item.totalTickets");
    expect(wxml).not.toContain("item.pastedTickets");
    expect(page).toContain('recognitionMode === "direct-upload"');
    expect(page).not.toContain("wx.uploadFile");
    expect(page).not.toContain("wx.cloud.database");
  });

  it("provides non-color semantics and minimum critical touch targets", () => {
    const wxml = read("apps/client/miniprogram/pages/home/index.wxml");
    const wxss = read("apps/client/miniprogram/pages/home/index.wxss");

    expect(wxml).toContain('aria-label="撕开{{prize.tier}}赏"');
    expect(wxml).toContain('aria-disabled="{{prize.remaining === 0}}"');
    expect(wxml).toContain('aria-label="关闭局面可能性"');
    expect(wxml).toContain('aria-label="关闭抽取记录"');
    expect(wxml).toContain(
      "aria-label=\"{{evidenceSubmitting ? '正在上传赏票' : '提交赏票核对'}}\"",
    );
    expect(wxml).toContain("aria-current=\"{{activeTab === 'recognize'}}\"");
    expect(wxml).toContain('aria-live="polite"');
    expect(wxss).toMatch(/\.draw-quick-actions button\s*\{[^}]*width:\s*44px/s);
    expect(wxss).toMatch(
      /\.draw-quick-actions button\s*\{[^}]*height:\s*44px/s,
    );
    expect(wxss).toMatch(/\.flow-back,[\s\S]*width:\s*52px/s);
  });

  it("keeps recognition images ephemeral and deletes temporary cloud objects", () => {
    const proxy = read("services/cloudbase/functions/recognize-board/index.js");
    const client = read(
      "apps/client/miniprogram/platform/board-recognition.ts",
    );

    expect(proxy).toContain("cloud.database()");
    expect(proxy).not.toMatch(/uploadFile|console\.(?:log|info|debug)/u);
    expect(proxy).toContain("getTempFileURL");
    expect(proxy).toContain("deleteFile");
    expect(proxy).toContain("sanitizeStructuredResult");
    expect(proxy).toContain("delete sanitized.imageHandling");
    expect(proxy).toContain("delete sanitized.draft.image");
    expect(proxy).toContain("storedInSessionHistory: false");
    expect(proxy).toContain("published: false");
    expect(proxy).toContain('event.imageFileId = ""');
    expect(client).toContain("uploadTemporaryImage");
    expect(client).toContain("deleteTemporaryImage");
    expect(client).toContain("deleteLocalFile");
    expect(client).not.toContain("setStorage");
  });

  it("migrates and reads 500 local records within a generous release budget", () => {
    const storage = new MemoryStorage();
    storage.values.set(
      LOCAL_DRAW_DRAFTS_KEY,
      JSON.stringify(
        Array.from({ length: 500 }, (_, index) => makeDraft(index)),
      ),
    );
    const startedAt = performance.now();
    const records = new LocalDrawDraftRepository(storage).readAll();
    const elapsed = performance.now() - startedAt;

    expect(records).toHaveLength(500);
    expect(new Set(records.map((record) => record.recordCode)).size).toBe(500);
    expect(
      records.every((record) =>
        RECORD_CODE_PATTERN.test(record.recordCode ?? ""),
      ),
    ).toBe(true);
    expect(elapsed).toBeLessThan(2_000);
  });

  it("preserves invariants through 50 draws, persistence, restart and 50 undos", () => {
    const storage = new MemoryStorage();
    const repository = new LocalDrawDraftRepository(storage);
    let current = makeDraft(1);
    for (let index = 0; index < 50; index += 1) {
      const result = drawPrize(current, "G", 650, 1_000 + index);
      expect(result.ok).toBe(true);
      current = result.draft;
    }
    repository.upsert(current);
    current = new LocalDrawDraftRepository(storage).readAll()[0]!;
    expect(current.history).toHaveLength(50);
    expect(current.prizeData[0]?.remaining).toBe(10);

    for (let index = 0; index < 50; index += 1) {
      const result = undoLastDraw(current, 650, index, 2_000 + index);
      expect(result.ok).toBe(true);
      current = result.draft;
    }
    expect(current.history).toHaveLength(0);
    expect(current.prizeData[0]?.remaining).toBe(60);
    expect(current.cost).toBe(0);
  });

  it("fails a new offline recognition without mutating an existing draft", async () => {
    const storage = new MemoryStorage();
    const repository = new LocalDrawDraftRepository(storage);
    repository.upsert(makeDraft(7));
    const before = storage.values.get(LOCAL_DRAW_DRAFTS_KEY);

    const result = await recognizeBoardImage(
      {
        getFileSize: async () => 3,
        getImageInfo: async () => ({ width: 1080, height: 1440 }),
        compressImage: async () => "/tmp/compressed.jpg",
        uploadTemporaryImage: async () => ({
          fileId: "cloud://test-env/recognition-temp/job-offline/request.jpg",
        }),
        deleteTemporaryImage: async () => undefined,
        deleteLocalFile: async () => undefined,
        callRecognizeBoard: async () => {
          throw new Error("offline");
        },
      },
      { tempFilePath: "/tmp/board.jpg", size: 3 },
      "camera",
      {
        jobId: "job-offline",
        jobToken: "recognition-job-token-for-offline-test",
      },
    );

    expect(result).toMatchObject({ status: "failed", retryable: true });
    expect(storage.values.get(LOCAL_DRAW_DRAFTS_KEY)).toBe(before);
    expect(repository.readAll()).toHaveLength(1);
  });
});
