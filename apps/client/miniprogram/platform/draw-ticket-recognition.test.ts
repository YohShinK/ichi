import { describe, expect, it, vi } from "vitest";

import {
  createPendingDrawTicketVerification,
  runPendingDrawTicketVerification,
  uploadDrawTicketEvidence,
  type DrawTicketEvidenceApi,
} from "./draw-ticket-recognition.js";

const pending = {
  recordId: "record_0123456789abcdef0123456789abcdef",
  boardId: "board-test",
  submissionVersion: 1,
  imageFileId:
    "cloud://env/recognition-temp/prize-ticket-record_0123456789abcdef0123456789abcdef-v1/ticket.jpg",
  captureSource: "camera" as const,
  capturedAt: 1,
  albumSaveWarning: false,
  image: { width: 1080, height: 1440, byteLength: 1024 },
};

const pendingEnvelope = {
  ok: true,
  data: {
    recordId: pending.recordId,
    boardId: pending.boardId,
    submissionVersion: 1,
    status: "PENDING",
    originalEvidenceFileId: pending.imageFileId,
  },
};

describe("draw-ticket mini-program adapter", () => {
  it("keeps the original local capture until a PENDING submission is durable", async () => {
    const api = {
      getFileSize: vi.fn(async () => 1024),
      getImageInfo: vi.fn(async () => ({ width: 1080, height: 1440 })),
      compressImage: vi.fn(async () => "/tmp/compressed.jpg"),
      uploadFile: vi.fn(async () => pending.imageFileId),
      deleteFile: vi.fn(async () => undefined),
      deleteLocalFile: vi.fn(async () => undefined),
      saveImageToPhotosAlbum: vi.fn(async () => undefined),
      callFunction: vi.fn(),
    } satisfies DrawTicketEvidenceApi;

    await expect(
      uploadDrawTicketEvidence(api, {
        recordId: pending.recordId,
        boardId: pending.boardId,
        submissionVersion: 1,
        imagePath: "/tmp/evidence.jpg",
        captureSource: "camera",
        capturedAt: 1,
      }),
    ).resolves.toMatchObject({ imageFileId: pending.imageFileId });
    expect(api.uploadFile).toHaveBeenCalledWith(
      expect.stringContaining(`prize-ticket-${pending.recordId}-v1`),
      "/tmp/evidence.jpg",
    );
    expect(api.deleteLocalFile).not.toHaveBeenCalledWith("/tmp/evidence.jpg");
  });

  it("saves the untouched camera photo and uploads a 2048px transport derivative", async () => {
    const api = {
      getFileSize: vi
        .fn()
        .mockResolvedValueOnce(6 * 1024 * 1024)
        .mockResolvedValueOnce(900 * 1024),
      getImageInfo: vi
        .fn()
        .mockResolvedValueOnce({ width: 4032, height: 3024 })
        .mockResolvedValueOnce({ width: 2048, height: 1536 }),
      compressImage: vi.fn(async () => "/tmp/evidence-2048.jpg"),
      uploadFile: vi.fn(async () => pending.imageFileId),
      deleteFile: vi.fn(async () => undefined),
      deleteLocalFile: vi.fn(async () => undefined),
      saveImageToPhotosAlbum: vi.fn(async () => undefined),
      callFunction: vi.fn(),
    } satisfies DrawTicketEvidenceApi;

    await uploadDrawTicketEvidence(api, {
      recordId: pending.recordId,
      boardId: pending.boardId,
      submissionVersion: 1,
      imagePath: "/tmp/evidence-original.jpg",
      captureSource: "camera",
      capturedAt: 1,
    });

    expect(api.saveImageToPhotosAlbum).toHaveBeenCalledWith(
      "/tmp/evidence-original.jpg",
    );
    expect(api.compressImage).toHaveBeenCalledWith(
      "/tmp/evidence-original.jpg",
      { quality: 82, compressedWidth: 2048 },
    );
    expect(api.uploadFile).toHaveBeenCalledWith(
      expect.stringContaining(`prize-ticket-${pending.recordId}-v1`),
      "/tmp/evidence-2048.jpg",
    );
    expect(api.deleteLocalFile).toHaveBeenCalledWith("/tmp/evidence-2048.jpg");
    expect(api.deleteLocalFile).not.toHaveBeenCalledWith(
      "/tmp/evidence-original.jpg",
    );
  });

  it("waits for the original camera photo to finish saving before completing upload", async () => {
    let resolveAlbumSave!: () => void;
    const albumSave = new Promise<void>((resolve) => {
      resolveAlbumSave = resolve;
    });
    const api = {
      getFileSize: vi.fn(async () => 1024),
      getImageInfo: vi.fn(async () => ({ width: 1080, height: 1440 })),
      compressImage: vi.fn(async () => "/tmp/compressed.jpg"),
      uploadFile: vi.fn(async () => pending.imageFileId),
      deleteFile: vi.fn(async () => undefined),
      deleteLocalFile: vi.fn(async () => undefined),
      saveImageToPhotosAlbum: vi.fn(() => albumSave),
      callFunction: vi.fn(),
    } satisfies DrawTicketEvidenceApi;

    const operation = uploadDrawTicketEvidence(api, {
      recordId: pending.recordId,
      boardId: pending.boardId,
      submissionVersion: 1,
      imagePath: "/tmp/evidence.jpg",
      captureSource: "camera",
      capturedAt: 1,
    });
    let completed = false;
    void operation.then(() => {
      completed = true;
    });
    await vi.waitFor(() => expect(api.uploadFile).toHaveBeenCalledOnce());
    expect(completed).toBe(false);

    resolveAlbumSave();
    await expect(operation).resolves.toMatchObject({
      imageFileId: pending.imageFileId,
      albumSaveWarning: false,
    });
  });

  it("persists PENDING without waiting for the provider verification call", async () => {
    const callFunction = vi.fn(async (name: string) => {
      expect(name).toBe("recognize-draw-tickets");
      return pendingEnvelope;
    });
    await expect(
      createPendingDrawTicketVerification(
        { callFunction } as unknown as DrawTicketEvidenceApi,
        pending,
        {
          drawEvents: [{ id: "round-1", tier: "A", occurredAt: 123 }],
          userNote: "现场备注",
          ticketLocation: {
            latitude: 31.23,
            longitude: 121.47,
            accuracy: 12,
            source: "camera",
            capturedAt: "2026-08-27T12:00:00.000Z",
            consentVersion: "v1-location",
          },
        },
      ),
    ).resolves.toMatchObject({ status: "PENDING" });
    expect(callFunction).toHaveBeenCalledWith(
      "recognize-draw-tickets",
      expect.objectContaining({
        action: "submit",
        submissionVersion: 1,
        authoritativeDrawEvents: [
          { eventId: "round-1", tierCode: "A", occurredAt: 123 },
        ],
        userNote: "现场备注",
        ticketLocation: expect.objectContaining({
          latitude: 31.23,
          longitude: 121.47,
        }),
      }),
    );
  });

  it("maps a later provider failure separately from a mismatch", async () => {
    const callFunction = vi.fn(async () => ({
      ok: true,
      data: {
        ...pendingEnvelope.data,
        status: "PROVIDER_FAILED",
        expected: { total: 0, tierCounts: {} },
        observed: { total: 0, tierCounts: {}, unknownTickets: 0 },
        mismatches: [],
      },
    }));
    await expect(
      runPendingDrawTicketVerification(
        { callFunction } as unknown as DrawTicketEvidenceApi,
        pending,
      ),
    ).resolves.toMatchObject({ status: "PROVIDER_FAILED", mismatches: [] });
  });
});
