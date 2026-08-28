import { describe, expect, it, vi } from "vitest";

import {
  finalizeCloudObservation,
  releaseCloudRecognition,
  reserveCloudRecognition,
  toConfirmedBoardSnapshot,
} from "./cloud-recognition-task.js";

describe("cloud recognition task adapter", () => {
  it("turns only fully confirmed editable fields into the server snapshot", () => {
    const snapshot = toConfirmedBoardSnapshot({
      ip: "  葬送的芙莉莲  ",
      unitPrice: 650,
      prizes: [
        {
          id: "tier-a",
          tier: "A",
          rawLabel: "A賞",
          remainingTickets: 1,
          confidence: "high",
        },
        {
          id: "tier-sp1",
          tier: "SP1",
          rawLabel: "SP賞",
          remainingTickets: 4,
          confidence: "low",
        },
      ],
      grandPrizeTiers: ["A"],
    });
    expect(snapshot).toMatchObject({
      schemaVersion: "board-record-r2-1.0.0",
      recognitionVersion: "R2",
      ipName: "葬送的芙莉莲",
      tiers: [
        {
          tierCode: "A",
          rawLabel: "A賞",
          remainingTickets: 1,
          isGrandPrize: true,
        },
        {
          tierCode: "SP1",
          rawLabel: "SP賞",
          remainingTickets: 4,
          isGrandPrize: false,
        },
      ],
    });
  });

  it("keeps reservation and finalization owner-scoped behind cloud functions", async () => {
    const callFunction = vi.fn(async ({ name }: { name: string }) => ({
      result: {
        ok: true,
        data:
          name === "reserve-recognition"
            ? {
                jobId: "private-job",
                jobToken: "private-recognition-job-token",
                status: "reserved",
                quota: {
                  dateKey: "2026-08-19",
                  limit: 5,
                  used: 0,
                  reserved: 1,
                  remaining: 4,
                  resetAt: "2026-08-19T16:00:00.000Z",
                },
              }
            : {
                recordId: "private-record",
                recordCode: "A1B2C3",
                boardId: "board-1",
                status: "private_saved",
                idempotent: false,
              },
      },
    }));
    const api = { callFunction };
    await reserveCloudRecognition(api, {
      idempotencyKey: "device-generated-random-key",
      sourcePath: "assisted-draw",
    });
    await finalizeCloudObservation(api, {
      recognitionJobId: "private-job",
      sourcePath: "assisted-draw",
      confirmedSnapshot: toConfirmedBoardSnapshot({
        ip: "IP",
        unitPrice: 650,
        prizes: [
          {
            id: "a",
            tier: "A",
            rawLabel: "A賞",
            remainingTickets: 1,
            confidence: "high",
          },
        ],
        grandPrizeTiers: [],
      }),
      location: {
        latitude: 31.23,
        longitude: 121.47,
        accuracy: 12,
        source: "camera",
        capturedAt: "2026-08-19T03:31:00.000Z",
        consentVersion: "v1-location-2026-08-19",
      },
      observedAt: "2026-08-19T03:32:00.000Z",
      promptVersion: "ichi-board-vlm-3.0.0-rc1",
      consentVersion: "v1-location-2026-08-19",
      disclosureVersion: "v1-no-photo-retention-2026-08-19",
    });
    expect(callFunction.mock.calls.map(([input]) => input.name)).toEqual([
      "reserve-recognition",
      "finalize-board-observation",
    ]);
    expect(JSON.stringify(callFunction.mock.calls)).not.toContain(
      "ownerAccountId",
    );
    expect(JSON.stringify(callFunction.mock.calls)).not.toContain(
      "imageDataUrl",
    );
  });

  it("rejects a reservation whose remaining count disagrees with used plus reserved", async () => {
    const callFunction = vi.fn(async () => ({
      result: {
        ok: true,
        data: {
          jobId: "private-job",
          status: "reserved",
          quota: {
            dateKey: "2026-08-19",
            limit: 5,
            used: 2,
            reserved: 1,
            remaining: 5,
            resetAt: "2026-08-19T16:00:00.000Z",
          },
        },
      },
    }));

    await expect(
      reserveCloudRecognition(
        { callFunction },
        {
          idempotencyKey: "device-generated-random-key",
          sourcePath: "assisted-draw",
        },
      ),
    ).rejects.toMatchObject({ code: "INVALID_CLOUD_RESPONSE" });
  });

  it("releases an unclaimed reservation through its owner-scoped job token", async () => {
    const callFunction = vi.fn(async () => ({
      result: {
        ok: true,
        data: {
          jobId: "private-job",
          status: "failed",
          released: true,
          quota: {
            dateKey: "2026-08-19",
            limit: 5,
            used: 0,
            reserved: 0,
            remaining: 5,
            resetAt: "2026-08-19T16:00:00.000Z",
          },
        },
      },
    }));

    await expect(
      releaseCloudRecognition(
        { callFunction },
        { jobId: "private-job", jobToken: "private-token" },
      ),
    ).resolves.toMatchObject({ released: true, quota: { remaining: 5 } });
    expect(callFunction).toHaveBeenCalledWith({
      name: "release-recognition",
      data: { jobId: "private-job", jobToken: "private-token" },
    });
  });
});
