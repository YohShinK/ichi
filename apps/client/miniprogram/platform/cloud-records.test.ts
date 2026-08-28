import { describe, expect, it, vi } from "vitest";

import {
  loadMyCloudRecords,
  requestCloudRecordDeletion,
} from "./cloud-records.js";

describe("private cloud record adapter", () => {
  it("sanitizes server records into the existing three-line card model", async () => {
    const callFunction = vi.fn(async () => ({
      result: {
        ok: true,
        data: {
          hasMore: false,
          records: [
            {
              recordId: "record_private_1",
              recordCode: "A1B2C3",
              boardId: "board-1",
              sourcePath: "direct-upload",
              status: "clue_submitted",
              updatedAt: "2026-08-19T03:32:00.000Z",
              initialSnapshot: {
                ip: "葬送的芙莉莲",
                totalTickets: 65,
                remainingTickets: 63,
              },
              ownerAccountId: "must-not-leak",
            },
          ],
        },
      },
    }));
    const result = await loadMyCloudRecords({ callFunction });
    expect(result.records).toEqual([
      expect.objectContaining({
        recordId: "record_private_1",
        title: "仅上传版面 · A1B2C3",
        identityMeta: expect.stringContaining("IP: 葬送的芙莉莲"),
        statsMeta: "余 63 / 65",
        recordStateLabel: "待核对",
      }),
    ]);
    expect(JSON.stringify(result)).not.toContain("must-not-leak");
  });

  it("requests deletion only through the owner-scoped cloud function", async () => {
    const callFunction = vi.fn(async () => ({
      result: {
        ok: true,
        data: { deletionId: "record:record_private_1", status: "pending" },
      },
    }));
    await expect(
      requestCloudRecordDeletion(
        { callFunction },
        {
          recordId: "record_private_1",
          boardId: "board-private-1",
        },
      ),
    ).resolves.toEqual({
      deletionId: "record:record_private_1",
      status: "pending",
    });
    expect(callFunction).toHaveBeenCalledWith({
      name: "delete-my-record",
      data: { recordId: "record_private_1", boardId: "board-private-1" },
    });
  });

  it("rebuilds an assisted orphan from its persisted recognition snapshot without Qwen", async () => {
    const callFunction = vi.fn(async () => ({
      result: {
        ok: true,
        data: {
          hasMore: false,
          records: [
            {
              recordId: "record_0123456789abcdef0123456789abcdef",
              recordCode: "A1B2C3",
              boardId: "recoverable-board",
              recognitionJobId: "recognition-job-1",
              sourcePath: "assisted-draw",
              status: "private_saved",
              updatedAt: "2026-08-19T03:32:00.000Z",
              initialSnapshot: {
                ip: "女神异闻录",
                theme: "30周年",
                pricePerDraw: 58,
                totalTickets: 2,
                remainingTickets: 1,
                tiers: [{ tierId: "A", total: 2, remaining: 1, attached: 1 }],
              },
            },
          ],
        },
      },
    }));
    const result = await loadMyCloudRecords({ callFunction });
    expect(result.records[0]).toMatchObject({
      canResume: true,
      recoveryDraft: {
        boardId: "recoverable-board",
        cloudRecordId: "record_0123456789abcdef0123456789abcdef",
        recognitionJobId: "recognition-job-1",
        ipName: "女神异闻录",
        themeName: "30周年",
        prizeData: [{ tier: "A", total: 2, remaining: 1 }],
      },
    });
    expect(callFunction).toHaveBeenCalledTimes(1);
  });

  it("restores an R2 baseline, manual Grand choices and draw events without T/P", async () => {
    const initialSnapshot = {
      schemaVersion: "board-record-r2-1.0.0",
      recognitionVersion: "R2",
      ipName: "世界之外",
      themeName: "此间即无间",
      pricePerDraw: 65,
      tiers: [
        {
          tierCode: "A",
          rawLabel: "A賞",
          remainingTickets: 5,
          isGrandPrize: false,
        },
        {
          tierCode: "SP1",
          rawLabel: "SP賞",
          remainingTickets: 0,
          isGrandPrize: true,
        },
      ],
    };
    const callFunction = vi.fn(async () => ({
      result: {
        ok: true,
        data: {
          hasMore: false,
          records: [
            {
              recordId: "record_r2",
              recordCode: "R2A1B2",
              boardId: "board-r2",
              sourcePath: "assisted-draw",
              status: "private_saved",
              updatedAt: "2026-08-27T03:32:00.000Z",
              initialSnapshot,
              finalSnapshot: {
                ...initialSnapshot,
                tiers: [
                  { ...initialSnapshot.tiers[0], remainingTickets: 3 },
                  initialSnapshot.tiers[1],
                ],
              },
              authoritativeDrawEvents: [
                { eventId: "draw-1", tierCode: "A", occurredAt: 1 },
                { eventId: "draw-2", tierCode: "A", occurredAt: 2 },
              ],
            },
          ],
        },
      },
    }));

    const result = await loadMyCloudRecords({ callFunction });
    expect(result.records[0]).toMatchObject({
      statsMeta: "剩余 3 抽",
      canResume: true,
      recoveryDraft: {
        schemaVersion: "board-record-r2-1.0.0",
        prizeData: [
          {
            tier: "A",
            initialRemainingTickets: 5,
            isGrandPrize: false,
          },
          {
            tier: "SP1",
            initialRemainingTickets: 0,
            isGrandPrize: true,
          },
        ],
        history: [
          { id: "draw-1", tier: "A", occurredAt: 1 },
          { id: "draw-2", tier: "A", occurredAt: 2 },
        ],
      },
    });
    expect(JSON.stringify(result.records[0]?.recoveryDraft)).not.toMatch(
      /totalTickets|pastedTickets/u,
    );
  });

  it("labels a non-resumable assisted orphan explicitly while keeping deletion available", async () => {
    const callFunction = vi.fn(async () => ({
      result: {
        ok: true,
        data: {
          hasMore: false,
          records: [
            {
              recordId: "record_orphan",
              recordCode: "D3A4D5",
              boardId: "orphan-board",
              sourcePath: "assisted-draw",
              status: "private_saved",
              updatedAt: "2026-08-19T03:32:00.000Z",
              initialSnapshot: {
                ip: "火影忍者",
                totalTickets: 8,
                remainingTickets: 3,
              },
            },
          ],
        },
      },
    }));

    const result = await loadMyCloudRecords({ callFunction });

    expect(result.records[0]).toMatchObject({
      recordStateLabel: "无法恢复",
      canResume: false,
      canDelete: true,
    });
    expect(result.records[0]).not.toHaveProperty("recoveryDraft");
  });

  it.each([
    ["PENDING", "待核对"],
    ["LOCATION_PENDING", "待核对"],
    ["PHOTO_PENDING", "待核对"],
    ["NOTE_PENDING", "待核对"],
    ["APPROVED", "已上传"],
    ["LOCATION_FAILED", "核验失败"],
    ["PHOTO_FAILED", "照片核验失败"],
    ["NOTE_FAILED", "备注未通过"],
    ["VERIFIED", "已上传"],
    ["MISMATCH", "核验失败"],
    ["INVALID_EVIDENCE", "核验失败"],
    ["NEEDS_REVIEW", "核验异常"],
    ["PROVIDER_FAILED", "核验异常"],
  ] as const)("maps cloud verification %s to %s", async (status, label) => {
    const callFunction = vi.fn(async () => ({
      result: {
        ok: true,
        data: {
          hasMore: false,
          records: [
            {
              recordId: `record_${status.toLowerCase()}`,
              recordCode: "A1B2C3",
              boardId: `board-${status.toLowerCase()}`,
              sourcePath: "assisted-draw",
              status: "private_saved",
              prizeTicketVerificationStatus: status,
              updatedAt: "2026-08-25T03:32:00.000Z",
              initialSnapshot: {
                ip: "测试 IP",
                pricePerDraw: 58,
                totalTickets: 1,
                remainingTickets: 0,
                tiers: [{ tierId: "A", total: 1, remaining: 0 }],
              },
            },
          ],
        },
      },
    }));
    await expect(loadMyCloudRecords({ callFunction })).resolves.toMatchObject({
      records: [{ recordStateLabel: label }],
    });
  });

  it.each([
    ["LOCATION_FAILED", "核验失败", undefined],
    ["PHOTO_FAILED", "照片核验失败", "reupload"],
    ["NOTE_FAILED", "备注未通过", "edit-note"],
  ] as const)(
    "maps %s to the stage-specific recovery action",
    async (status, label, action) => {
      const callFunction = vi.fn(async () => ({
        result: {
          ok: true,
          data: {
            hasMore: false,
            records: [
              {
                recordId: `record_${status.toLowerCase()}`,
                recordCode: "A1B2C3",
                boardId: `board-${status.toLowerCase()}`,
                sourcePath: "assisted-draw",
                status: "private_saved",
                updatedAt: "2026-08-27T03:32:00.000Z",
                initialSnapshot: {
                  schemaVersion: "board-record-r2-1.0.0",
                  recognitionVersion: "R2",
                  ipName: "世界之外",
                  pricePerDraw: 65,
                  tiers: [
                    {
                      tierCode: "A",
                      rawLabel: "A賞",
                      remainingTickets: 0,
                      isGrandPrize: true,
                    },
                  ],
                },
                latestPrizeTicketSubmission: {
                  submissionVersion: 1,
                  status,
                  userNote: "现场备注",
                  result: { status },
                },
              },
            ],
          },
        },
      }));

      const [record] = (await loadMyCloudRecords({ callFunction })).records;
      expect(record).toMatchObject({ recordStateLabel: label });
      if (action) expect(record).toMatchObject({ verificationAction: action });
      else expect(record).not.toHaveProperty("verificationAction");
    },
  );

  it("uses the versioned submission as the uploaded record fact source", async () => {
    const callFunction = vi.fn(async () => ({
      result: {
        ok: true,
        data: {
          hasMore: false,
          records: [
            {
              recordId: "record_joined",
              recordCode: "A1B2C3",
              boardId: "board-joined",
              sourcePath: "assisted-draw",
              status: "uploaded",
              location: { latitude: 35.6, longitude: 139.7 },
              updatedAt: "2026-08-25T04:00:00.000Z",
              initialSnapshot: {
                ip: "世界之外",
                totalTickets: 2,
                remainingTickets: 2,
                pricePerDraw: 58,
                tiers: [{ tierId: "A", total: 2, remaining: 2 }],
              },
              latestPrizeTicketSubmission: {
                status: "VERIFIED",
                submittedAt: "2026-08-25T03:32:00.000Z",
                locationNote: "秋叶原本店",
                finalSnapshot: {
                  ip: "世界之外",
                  totalTickets: 2,
                  remainingTickets: 1,
                  pricePerDraw: 58,
                  tiers: [{ tierId: "A", total: 2, remaining: 1 }],
                },
                result: { status: "VERIFIED" },
              },
            },
          ],
        },
      },
    }));

    await expect(loadMyCloudRecords({ callFunction })).resolves.toMatchObject({
      records: [
        {
          recordStateLabel: "已上传",
          statsMeta: "余 2 / 2",
          uploadedAt: "2026-08-25T03:32:00.000Z",
          locationNote: "秋叶原本店",
          location: { latitude: 35.6, longitude: 139.7 },
        },
      ],
    });
  });

  it("recovers a cloud-only technical failure with the same evidence version", async () => {
    const callFunction = vi.fn(async () => ({
      result: {
        ok: true,
        data: {
          hasMore: false,
          records: [
            {
              recordId: "record_retry",
              recordCode: "R3T4R5",
              boardId: "board-retry",
              sourcePath: "assisted-draw",
              status: "private_saved",
              initialSnapshot: {
                ip: "世界之外",
                totalTickets: 2,
                remainingTickets: 1,
                pricePerDraw: 58,
                tiers: [{ tierId: "A", total: 2, remaining: 1 }],
              },
              latestPrizeTicketSubmission: {
                submissionVersion: 1,
                status: "PROVIDER_FAILED",
                captureSource: "camera",
                originalEvidenceCapturedAt: 123,
                currentEvidenceFileId: "cloud://private/ticket.jpg",
                submittedAt: "2026-08-25T03:32:00.000Z",
                finalSnapshot: {
                  ip: "世界之外",
                  totalTickets: 2,
                  remainingTickets: 1,
                  pricePerDraw: 58,
                  tiers: [{ tierId: "A", total: 2, remaining: 1 }],
                },
              },
            },
          ],
        },
      },
    }));

    await expect(loadMyCloudRecords({ callFunction })).resolves.toMatchObject({
      records: [
        {
          recordStateLabel: "核验异常",
          verificationAction: "retry",
          verificationPending: {
            recordId: "record_retry",
            boardId: "board-retry",
            submissionVersion: 1,
            imageFileId: "cloud://private/ticket.jpg",
            captureSource: "camera",
            capturedAt: 123,
          },
        },
      ],
    });
  });
});
