import { createRequire } from "node:module";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const recognizeBoard = require("./index.js") as any;

const event = () => ({
  contractVersion: "1.0.0",
  requestId: "request-r1",
  imageFileId: "cloud://test/recognition-temp/job-r1/board.jpg",
  image: {
    mediaType: "image/jpeg",
    width: 1080,
    height: 1440,
    byteLength: 123456,
    acquisition: "camera",
  },
  recognitionJobId: "job-r1",
  recognitionJobToken: "recognition-job-token-for-tests",
});

const r1Extraction = () => ({
  ipName: "宝可梦",
  ipRawText: "ポケットモンスター",
  themeName: "30周年",
  price: 790,
  tiers: [
    {
      tierCode: "A1",
      rawLabel: "A1賞",
      prizeName: "A奖品",
      visibleNumberRuns: [
        [12, 13, 14, 15].map((value) => ({ value, rawText: String(value) })),
      ],
      totalTicketsObserved: null,
      pastedTicketsObserved: 11,
    },
    {
      tierCode: "A2",
      rawLabel: "A2賞",
      prizeName: "A2奖品",
      visibleNumberRuns: [[{ value: 1, rawText: "1" }]],
      totalTicketsObserved: 2,
      pastedTicketsObserved: 1,
    },
    {
      tierCode: "SP1",
      rawLabel: "SP賞",
      prizeName: null,
      visibleNumberRuns: [],
      totalTicketsObserved: 8,
      pastedTicketsObserved: 2,
    },
  ],
});

const r2Extraction = () => ({
  ipName: "宝可梦",
  themeName: "测试篇",
  tiers: [
    {
      tierCode: "A",
      rawLabel: "A賞",
      visibleNumberRuns: [
        [1, 2, 3].map((value) => ({ value, rawText: String(value) })),
      ],
      remainingTickets: 0,
    },
    {
      tierCode: "B",
      rawLabel: "B賞",
      visibleNumberRuns: [
        [1, 2].map((value) => ({ value, rawText: String(value) })),
      ],
      remainingTickets: null,
    },
  ],
});

const providerResponse = (value: unknown = r1Extraction()) =>
  new Response(
    JSON.stringify({
      choices: [{ message: { content: JSON.stringify(value) } }],
      usage: {
        prompt_tokens: 1200,
        completion_tokens: 450,
        total_tokens: 1650,
        prompt_tokens_details: { image_tokens: 900 },
      },
      id: "provider-request-r1",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );

const createJobGuard = () => ({
  claim: vi.fn(async () => ({ jobId: "job-r1" })),
  succeed: vi.fn(async () => undefined),
  fail: vi.fn(async () => undefined),
});
const createImageStore = () => ({
  getTemporaryUrl: vi.fn(async () => "https://example.test/board.jpg?signed=1"),
  delete: vi.fn(async () => undefined),
});
const runtime = (fetchImpl: typeof fetch, mode = "r1_remaining") => ({
  env: {
    DASHSCOPE_API_KEY: "test-key",
    DASHSCOPE_WORKSPACE_ID: "workspace-id",
    BOARD_RECOGNITION_MODE: mode,
  },
  fetchImpl,
  jobGuard: createJobGuard(),
  imageStore: createImageStore(),
  logger: { error: vi.fn(), info: vi.fn() },
});

describe("recognize-board R1 production dispatcher", () => {
  it("defaults to R2, retains R1 and frozen H0, and rejects removed v4", () => {
    expect(recognizeBoard.__test.resolveRecognitionMode({}).mode).toBe(
      "r2_direct_remaining",
    );
    expect(
      recognizeBoard.__test.resolveRecognitionMode({
        BOARD_RECOGNITION_MODE: "r2_direct_remaining",
      }).mode,
    ).toBe("r2_direct_remaining");
    expect(
      recognizeBoard.__test.resolveRecognitionMode({
        BOARD_RECOGNITION_MODE: "r1_remaining",
      }).mode,
    ).toBe("r1_remaining");
    expect(
      recognizeBoard.__test.resolveRecognitionMode({
        BOARD_RECOGNITION_MODE: "hybrid_semantic",
      }).mode,
    ).toBe("hybrid_semantic");
    expect(() =>
      recognizeBoard.__test.resolveRecognitionMode({
        BOARD_RECOGNITION_MODE: "v4",
      }),
    ).toThrow("BOARD_RECOGNITION_MODE_INVALID");
    expect(Object.keys(recognizeBoard.__test.RECOGNITION_MODE_CONFIGS)).toEqual(
      ["r2_direct_remaining", "r1_remaining", "hybrid_semantic"],
    );
  });

  it("dispatches R2 through Provider AJV and preserves direct and fallback R", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(providerResponse(r2Extraction()));
    const result = await recognizeBoard.main(
      { ...event(), requestId: "request-r2" },
      runtime(fetchImpl, "r2_direct_remaining"),
    );
    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(body).toMatchObject({
      model: "qwen3.7-flash",
      enable_thinking: false,
      temperature: 0,
      response_format: { type: "json_object" },
    });
    expect(JSON.stringify(body.messages)).toContain("remainingTickets");
    expect(result).toMatchObject({
      status: "needs_user_input",
      draft: {
        tiers: [
          {
            label: "A",
            totalTickets: null,
            pastedTickets: null,
            remainingTickets: 0,
          },
          {
            label: "B",
            totalTickets: null,
            pastedTickets: null,
            remainingTickets: 2,
          },
        ],
      },
    });
  });

  it("does not accept a client mode without the server-only smoke token", () => {
    expect(() =>
      recognizeBoard.__test.resolveRecognitionContext(
        { internalRecognitionMode: "hybrid_semantic" },
        { BOARD_RECOGNITION_MODE: "r1_remaining" },
      ),
    ).toThrow("INTERNAL_SMOKE_AUTH_INVALID");
  });

  it("uses the production default for a token-authenticated diagnostic smoke", () => {
    const token = "server-only-smoke-token-at-least-32-characters";
    expect(
      recognizeBoard.__test.resolveRecognitionContext(
        { internalSmoke: true, internalSmokeToken: token },
        {
          BOARD_RECOGNITION_MODE: "r1_remaining",
          BOARD_RECOGNITION_INTERNAL_SMOKE_TOKEN: token,
        },
      ),
    ).toMatchObject({
      internalSmoke: true,
      modeConfig: { mode: "r1_remaining" },
    });
  });

  it("uses one non-thinking structured multimodal request with the R1 prompt", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(providerResponse());
    const result = await recognizeBoard.main(event(), runtime(fetchImpl));
    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(body).toMatchObject({
      model: "qwen3.7-flash",
      enable_thinking: false,
      temperature: 0,
      response_format: { type: "json_object" },
    });
    expect(body).not.toHaveProperty("max_tokens");
    expect(JSON.stringify(body.messages)).toContain("visibleNumberRuns");
    expect(JSON.stringify(body.messages)).toContain('"max_pixels":6291456');
    expect(result.status).toBe("ready_for_confirmation");
  });

  it("builds a RecognitionContract from authoritative T/U and derives P", async () => {
    const testRuntime = runtime(
      vi.fn<typeof fetch>().mockResolvedValue(providerResponse()),
    );
    const result = await recognizeBoard.main(event(), testRuntime);
    expect(result).toMatchObject({
      contractVersion: "1.0.0",
      draft: {
        tiers: [
          expect.objectContaining({
            label: "A",
            totalTickets: 17,
            remainingTickets: 5,
            pastedTickets: 12,
          }),
          expect.objectContaining({
            label: "SP1",
            totalTickets: 8,
            remainingTickets: 6,
            pastedTickets: 2,
          }),
        ],
      },
    });
    expect(testRuntime.jobGuard.succeed).toHaveBeenCalledTimes(1);
  });

  it("preserves partial T-only results and never infers false zero", async () => {
    const raw = r1Extraction();
    raw.tiers = [
      {
        ...raw.tiers[0]!,
        tierCode: "B",
        rawLabel: "B賞",
        visibleNumberRuns: [],
        totalTicketsObserved: 8,
        pastedTicketsObserved: 8,
      },
    ];
    const result = await recognizeBoard.main(
      event(),
      runtime(vi.fn<typeof fetch>().mockResolvedValue(providerResponse(raw))),
    );
    expect(result).toMatchObject({
      status: "needs_user_input",
      draft: {
        tiers: [
          expect.objectContaining({
            totalTickets: 8,
            remainingTickets: null,
            pastedTickets: null,
          }),
        ],
      },
    });
  });

  it("rejects forbidden canonical provider fields at AJV", async () => {
    const result = await recognizeBoard.main(
      event(),
      runtime(
        vi
          .fn<typeof fetch>()
          .mockResolvedValue(
            providerResponse({ ...r1Extraction(), remainingTickets: 0 }),
          ),
      ),
    );
    expect(result).toMatchObject({
      status: "service_error",
      reasonCode: "RECOGNITION_SCHEMA_INVALID",
    });
  });

  it("retains raw provider output, request id, and complete AJV errors only for an authorized diagnostic failure", async () => {
    const token = "server-only-smoke-token-at-least-32-characters";
    const raw = { ...r1Extraction(), remainingTickets: 0, extra: true };
    const testRuntime = runtime(
      vi.fn<typeof fetch>().mockResolvedValue(providerResponse(raw)),
    );
    (testRuntime.env as any).BOARD_RECOGNITION_INTERNAL_SMOKE_TOKEN = token;
    const result = await recognizeBoard.main(
      {
        ...event(),
        internalSmoke: true,
        internalSmokeToken: token,
        internalDiagnostics: true,
      },
      testRuntime,
    );
    expect(result).toMatchObject({
      status: "service_error",
      reasonCode: "RECOGNITION_SCHEMA_INVALID",
      internalDiagnostics: {
        providerRequestId: "provider-request-r1",
        promptVersion: "ichi-board-vlm-r1-visible-evidence-1.1.0",
        schemaVersion: "board-provider-r1-visible-evidence-1.1.0",
        providerDiagnostic: {
          rawMessageContent: JSON.stringify(raw),
          jsonParse: { pass: true, error: null },
          parsedJson: raw,
          ajv: { reached: true, pass: false },
        },
      },
    });
    expect(result.internalDiagnostics.providerDiagnostic.ajv.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          instancePath: "",
          schemaPath: expect.any(String),
          keyword: "additionalProperties",
          params: expect.any(Object),
          message: expect.any(String),
        }),
      ]),
    );
  });

  it("fails closed for invalid JSON and provider errors", async () => {
    const invalidJson = new Response(
      JSON.stringify({ choices: [{ message: { content: "not-json" } }] }),
      { status: 200 },
    );
    await expect(
      recognizeBoard.main(
        event(),
        runtime(vi.fn<typeof fetch>().mockResolvedValue(invalidJson)),
      ),
    ).resolves.toMatchObject({
      status: "service_error",
      reasonCode: "RECOGNITION_PROVIDER_RESPONSE_INVALID",
    });
    await expect(
      recognizeBoard.main(
        event(),
        runtime(
          vi
            .fn<typeof fetch>()
            .mockResolvedValue(new Response("bad", { status: 500 })),
        ),
      ),
    ).resolves.toMatchObject({ status: "service_error" });
  });

  it("fails closed without credentials before Provider", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const jobGuard = createJobGuard();
    const imageStore = createImageStore();
    const result = await recognizeBoard.main(event(), {
      env: { BOARD_RECOGNITION_MODE: "r1_remaining" },
      fetchImpl,
      jobGuard,
      imageStore,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      status: "service_error",
      reasonCode: "RECOGNITION_PROVIDER_NOT_CONFIGURED",
    });
    expect(imageStore.delete).toHaveBeenCalledTimes(1);
  });

  it("queues durable cleanup when the board image delete fails", async () => {
    const imageStore = createImageStore();
    imageStore.delete.mockRejectedValueOnce(new Error("storage unavailable"));
    const enqueueStorageCleanup = vi.fn(async () => undefined);
    const result = await recognizeBoard.main(event(), {
      env: { BOARD_RECOGNITION_MODE: "r1_remaining" },
      fetchImpl: vi.fn<typeof fetch>(),
      jobGuard: createJobGuard(),
      imageStore,
      enqueueStorageCleanup,
    });

    expect(result).toMatchObject({
      status: "service_error",
      reasonCode: "RECOGNITION_PROVIDER_NOT_CONFIGURED",
    });
    expect(enqueueStorageCleanup).toHaveBeenCalledWith({
      fileId: event().imageFileId,
      ownerAccountId: undefined,
    });
  });

  it("keeps the fileID URL transport and camera-only boundary", () => {
    expect(
      recognizeBoard.__test.validateEvent({
        ...event(),
        image: { ...event().image, acquisition: "album" },
      }),
    ).toMatchObject({ error: "IMAGE_ACQUISITION_INVALID" });
    expect(
      recognizeBoard.__test.validateEvent({
        ...event(),
        imageFileId: "data:image/jpeg;base64,abc",
      }),
    ).toMatchObject({ error: "IMAGE_INPUT_INVALID" });
  });
});
