import { describe, expect, it, vi } from "vitest";

import {
  parseBoardRecognitionTransport,
  recognizeBoardImage,
  type BoardRecognitionApi,
} from "./board-recognition.js";

const file = { tempFilePath: "/tmp/board.jpg", size: 4 };
const recognitionJob = {
  jobId: "private-job",
  jobToken: "private-recognition-job-token",
};

type MutableRecognitionPayload = {
  draft: {
    ipName?: string;
    themeName?: string;
    tiers: Array<{
      totalTickets: unknown;
      pastedTickets: unknown;
      remainingTickets: unknown;
    }>;
  };
};

const response = () => ({
  contractVersion: "1.0.0",
  requestId: "recognize-1",
  status: "needs_user_input",
  draft: {
    price: { amount: 790 },
    tiers: [
      {
        componentId: "tier-a",
        label: "A",
        confidence: 0.98,
        totalTickets: 2,
        pastedTickets: 1,
        remainingTickets: 1,
        slotObservation: {
          totalSlots: 2,
          openSlots: 1,
          coveredSlots: 1,
          unknownSlots: 0,
        },
      },
      {
        componentId: "tier-b",
        label: "B",
        confidence: 0.6,
        totalTickets: 3,
        pastedTickets: 1,
        remainingTickets: 2,
        slotObservation: {
          totalSlots: 3,
          openSlots: 2,
          coveredSlots: 1,
          unknownSlots: 0,
        },
      },
    ],
    blocks: [
      { componentType: "series_identity", rawText: "女神异闻录" },
      { componentType: "board_theme", rawText: "30周年" },
    ],
  },
  issues: [{ code: "TIER_LABEL_LOW_CONFIDENCE" }],
  imageHandling: {
    retention: "ephemeral",
    published: false,
    storedInSessionHistory: false,
  },
});

const createApi = (transport: unknown = response()): BoardRecognitionApi => ({
  getFileSize: vi.fn().mockResolvedValue(4),
  getImageInfo: vi.fn().mockResolvedValue({ width: 1080, height: 1440 }),
  compressImage: vi.fn().mockResolvedValue("/tmp/board-compressed.jpg"),
  uploadTemporaryImage: vi.fn().mockResolvedValue({
    fileId: "cloud://test-env/recognition-temp/private-job/recognize-1.jpg",
  }),
  deleteTemporaryImage: vi.fn().mockResolvedValue(undefined),
  deleteLocalFile: vi.fn().mockResolvedValue(undefined),
  callRecognizeBoard: vi.fn().mockResolvedValue(transport),
});

describe("board recognition mini-program adapter", () => {
  it("preserves R2 direct remaining counts including zero without inventing T or P", () => {
    const payload = response() as unknown as {
      draft: {
        price: { amount?: number };
        tiers: Array<{
          componentId: string;
          label: string;
          confidence: number;
          totalTickets: number | null;
          pastedTickets: number | null;
          remainingTickets: number | null;
          slotObservation: {
            totalSlots: number | null;
            openSlots: number | null;
            coveredSlots: number | null;
            unknownSlots: number | null;
          };
        }>;
      };
    };
    payload.draft.price = {};
    payload.draft.tiers = [
      {
        componentId: "tier-a",
        label: "A",
        confidence: 1,
        totalTickets: null,
        pastedTickets: null,
        remainingTickets: 0,
        slotObservation: {
          totalSlots: null,
          openSlots: 0,
          coveredSlots: null,
          unknownSlots: null,
        },
      },
      {
        componentId: "tier-b",
        label: "B",
        confidence: 1,
        totalTickets: null,
        pastedTickets: null,
        remainingTickets: 3,
        slotObservation: {
          totalSlots: null,
          openSlots: 3,
          coveredSlots: null,
          unknownSlots: null,
        },
      },
    ];
    expect(parseBoardRecognitionTransport(payload)).toMatchObject({
      status: "recognized",
      unitPrice: null,
      prizes: [
        { rawLabel: "A賞", remainingTickets: 0 },
        { rawLabel: "B賞", remainingTickets: 3 },
      ],
    });
  });

  it("maps direct semantic count fields without Number coercion", () => {
    const payload = response() as unknown as MutableRecognitionPayload;
    payload.draft.ipName = "女神异闻录";
    payload.draft.themeName = "30周年";
    payload.draft.tiers[0]!.totalTickets = 10;
    payload.draft.tiers[0]!.pastedTickets = null;
    payload.draft.tiers[0]!.remainingTickets = null;
    const parsed = parseBoardRecognitionTransport(payload);
    expect(parsed).toMatchObject({
      status: "recognized",
      ipName: "女神异闻录",
      themeName: "30周年",
      prizes: [
        { rawLabel: "A賞", remainingTickets: null },
        { rawLabel: "B賞", remainingTickets: 2 },
      ],
    });
    const invalid = response() as unknown as MutableRecognitionPayload;
    invalid.draft.tiers[0]!.totalTickets = "10";
    expect(parseBoardRecognitionTransport(invalid)).toMatchObject({
      status: "failed",
      code: "invalid-response",
    });
    const invalidPrice = response() as unknown as {
      draft: { price: { amount: unknown } };
    };
    invalidPrice.draft.price.amount = "790";
    expect(parseBoardRecognitionTransport(invalidPrice)).toMatchObject({
      status: "failed",
      code: "invalid-response",
    });
    const invalidConfidence = response() as unknown as {
      draft: { tiers: Array<{ confidence: unknown }> };
    };
    invalidConfidence.draft.tiers[0]!.confidence = "0.98";
    expect(parseBoardRecognitionTransport(invalidConfidence)).toMatchObject({
      status: "failed",
      code: "invalid-response",
    });

    const missingCriticalField = response() as unknown as {
      draft: { tiers: Array<Record<string, unknown>> };
    };
    delete missingCriticalField.draft.tiers[0]!.pastedTickets;
    expect(parseBoardRecognitionTransport(missingCriticalField)).toMatchObject({
      status: "failed",
      code: "invalid-response",
    });

    const numericStringInObservation = response() as unknown as {
      draft: { tiers: Array<{ slotObservation: { openSlots: unknown } }> };
    };
    numericStringInObservation.draft.tiers[0]!.slotObservation.openSlots = "1";
    expect(
      parseBoardRecognitionTransport(numericStringInObservation),
    ).toMatchObject({
      status: "failed",
      code: "invalid-response",
    });
  });

  it("fails closed on retake-required payloads before persisting an editable draft", () => {
    const payload = response();
    payload.status = "retake_required";
    expect(parseBoardRecognitionTransport(payload)).toMatchObject({
      status: "failed",
      code: "invalid-response",
      retryable: true,
    });
  });

  it("closes retake-required responses as failures through the upload pipeline", async () => {
    const payload = response();
    payload.status = "retake_required";
    const api = createApi(payload);
    const progressEvents: string[] = [];
    const result = await recognizeBoardImage(api, file, "camera", {
      ...recognitionJob,
      onProgress: (event) => progressEvents.push(event),
    });
    expect(result).toMatchObject({
      status: "failed",
      code: "invalid-response",
      retryable: true,
    });
    expect(progressEvents).toContain("response-received");
    expect(progressEvents).not.toContain("result-ready");
    expect(api.deleteTemporaryImage).toHaveBeenCalledTimes(1);
  });

  it("uploads an ephemeral object reference and maps recognized tiers into editable drafts", async () => {
    const api = createApi();
    const progressEvents: string[] = [];
    const result = await recognizeBoardImage(api, file, "camera", {
      ...recognitionJob,
      onProgress: (event) => progressEvents.push(event),
    });

    expect(api.uploadTemporaryImage).toHaveBeenCalledWith(
      expect.stringMatching(
        /^recognition-temp\/private-job\/recognize-.+\.jpg$/u,
      ),
      "/tmp/board.jpg",
    );
    expect(api.callRecognizeBoard).toHaveBeenCalledWith(
      expect.objectContaining({
        contractVersion: "1.0.0",
        recognitionJobId: "private-job",
        recognitionJobToken: "private-recognition-job-token",
        imageFileId:
          "cloud://test-env/recognition-temp/private-job/recognize-1.jpg",
        image: expect.objectContaining({
          width: 1080,
          height: 1440,
          byteLength: 4,
          acquisition: "camera",
        }),
      }),
    );
    expect(result).toEqual({
      status: "recognized",
      recognitionStatus: "needs_user_input",
      prizes: [
        {
          id: "tier-a",
          tier: "A",
          rawLabel: "A賞",
          remainingTickets: 1,
          confidence: "high",
        },
        {
          id: "tier-b",
          tier: "B",
          rawLabel: "B賞",
          remainingTickets: 2,
          confidence: "low",
        },
      ],
      unitPrice: null,
      ipName: "女神异闻录",
      themeName: "30周年",
      issueCodes: ["TIER_LABEL_LOW_CONFIDENCE"],
      timings: {
        metadataMs: expect.any(Number),
        compressionMs: expect.any(Number),
        uploadMs: expect.any(Number),
        cloudCallMs: expect.any(Number),
        transportParseMs: expect.any(Number),
        pipelineMs: expect.any(Number),
      },
    });
    expect(api.deleteTemporaryImage).toHaveBeenCalledTimes(1);
    expect(api.deleteLocalFile).toHaveBeenCalledWith("/tmp/board.jpg");
    expect(progressEvents).toEqual([
      "photo-prepared",
      "request-dispatched",
      "response-received",
      "result-ready",
    ]);
  });

  it("keeps confidently counted covered slots visible while unresolved slots remain editable", async () => {
    const payload = response();
    payload.draft.tiers[0]!.slotObservation.unknownSlots = 1;
    payload.draft.tiers[0]!.slotObservation.openSlots = 0;
    const result = await recognizeBoardImage(
      createApi(payload),
      { ...file, size: 0 },
      "camera",
      recognitionJob,
    );

    expect(result).toMatchObject({
      status: "recognized",
      prizes: [
        {
          tier: "A",
          rawLabel: "A賞",
          remainingTickets: null,
          confidence: "low",
        },
        { tier: "B", rawLabel: "B賞", remainingTickets: 2 },
      ],
    });
  });

  it("fails closed when the service omits ephemeral image-handling guarantees", async () => {
    const payload = response();
    payload.imageHandling.retention = "persistent";
    const result = await recognizeBoardImage(
      createApi(payload),
      file,
      "camera",
      recognitionJob,
    );
    expect(result).toMatchObject({
      status: "failed",
      code: "invalid-response",
    });
  });

  it("rejects an image over the configured provider hard limit after light compression", async () => {
    const api = createApi();
    vi.mocked(api.getFileSize).mockResolvedValue(20 * 1024 * 1024 + 1);
    const result = await recognizeBoardImage(
      api,
      { ...file, size: 0 },
      "camera",
      recognitionJob,
    );
    expect(result).toMatchObject({
      status: "failed",
      code: "image-too-large",
      retryable: false,
    });
    expect(api.callRecognizeBoard).not.toHaveBeenCalled();
  });

  it("rejects unsupported camera formats instead of labelling them as JPEG", async () => {
    const api = createApi();
    vi.mocked(api.getImageInfo).mockResolvedValue({
      width: 1080,
      height: 1440,
      type: "heic",
    });
    const result = await recognizeBoardImage(
      api,
      { tempFilePath: "/tmp/board.heic", size: 4 },
      "camera",
      recognitionJob,
    );

    expect(result).toMatchObject({
      status: "failed",
      code: "unsupported-image-format",
      retryable: false,
    });
    expect(api.uploadTemporaryImage).not.toHaveBeenCalled();
    expect(api.callRecognizeBoard).not.toHaveBeenCalled();
  });

  it("resizes a high-resolution portrait to the 2400px recognition target", async () => {
    const api = createApi();
    vi.mocked(api.getFileSize)
      .mockResolvedValueOnce(6 * 1024 * 1024 + 1)
      .mockResolvedValueOnce(5 * 1024 * 1024);
    vi.mocked(api.getImageInfo)
      .mockResolvedValueOnce({ width: 3024, height: 4032, type: "jpeg" })
      .mockResolvedValueOnce({ width: 1350, height: 1800, type: "jpeg" });

    const result = await recognizeBoardImage(
      api,
      { ...file, size: 0 },
      "camera",
      recognitionJob,
    );

    expect(result.status).toBe("recognized");
    expect(api.compressImage).toHaveBeenCalledWith("/tmp/board.jpg", {
      quality: 85,
      compressedHeight: 2400,
    });
    expect(api.callRecognizeBoard).toHaveBeenCalledWith(
      expect.objectContaining({
        imageFileId: expect.stringContaining("recognition-temp/private-job/"),
        image: expect.objectContaining({ width: 1350, height: 1800 }),
      }),
    );
  });

  it("uses a second compression pass when the first pass is still too large", async () => {
    const api = createApi();
    vi.mocked(api.getFileSize)
      .mockResolvedValueOnce(9 * 1024 * 1024)
      .mockResolvedValueOnce(9 * 1024 * 1024)
      .mockResolvedValueOnce(5 * 1024 * 1024);
    vi.mocked(api.getImageInfo)
      .mockResolvedValueOnce({ width: 4032, height: 3024, type: "jpeg" })
      .mockResolvedValueOnce({ width: 2400, height: 1800, type: "jpeg" })
      .mockResolvedValueOnce({ width: 1800, height: 1350, type: "jpeg" });

    const result = await recognizeBoardImage(
      api,
      { ...file, size: 0 },
      "camera",
      recognitionJob,
    );

    expect(result.status).toBe("recognized");
    expect(api.compressImage).toHaveBeenNthCalledWith(2, "/tmp/board.jpg", {
      quality: 82,
      compressedWidth: 2048,
    });
  });

  it("resizes high-resolution input even when its original file is under the performance target", async () => {
    const api = createApi();
    vi.mocked(api.getImageInfo)
      .mockResolvedValueOnce({ width: 4032, height: 3024, type: "jpeg" })
      .mockResolvedValueOnce({ width: 2400, height: 1800, type: "jpeg" });
    vi.mocked(api.getFileSize).mockResolvedValue(3 * 1024 * 1024);

    const result = await recognizeBoardImage(
      api,
      { ...file, size: 3 * 1024 * 1024 },
      "camera",
      recognitionJob,
    );

    expect(result.status).toBe("recognized");
    expect(api.compressImage).toHaveBeenCalledTimes(1);
    expect(api.compressImage).toHaveBeenCalledWith("/tmp/board.jpg", {
      quality: 85,
      compressedWidth: 2400,
    });
  });

  it("deletes both local and cloud temporary files after a provider failure", async () => {
    const api = createApi();
    vi.mocked(api.callRecognizeBoard).mockRejectedValueOnce(
      new Error("provider failed"),
    );
    const result = await recognizeBoardImage(
      api,
      file,
      "camera",
      recognitionJob,
    );
    expect(result.status).toBe("failed");
    expect(api.deleteTemporaryImage).toHaveBeenCalledTimes(1);
    expect(api.deleteLocalFile).toHaveBeenCalledWith("/tmp/board.jpg");
  });

  it("keeps the cloud object until a timed-out invocation actually settles", async () => {
    vi.useFakeTimers();
    try {
      const api = createApi();
      let settleCall: ((value: unknown) => void) | undefined;
      vi.mocked(api.callRecognizeBoard).mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            settleCall = resolve;
          }),
      );
      const pending = recognizeBoardImage(api, file, "camera", recognitionJob);
      await vi.advanceTimersByTimeAsync(55_001);
      await expect(pending).resolves.toMatchObject({
        status: "failed",
        code: "timeout",
      });
      expect(api.deleteTemporaryImage).not.toHaveBeenCalled();

      settleCall?.(response());
      await vi.advanceTimersByTimeAsync(0);
      expect(api.deleteTemporaryImage).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
