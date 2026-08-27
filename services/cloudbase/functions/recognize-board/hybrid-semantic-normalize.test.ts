import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const Ajv2020 = require("ajv/dist/2020").default;
const hybrid = require("./hybrid-semantic-normalize.js") as {
  normalizeHybridExtraction(
    raw: Record<string, unknown>,
    request: Record<string, unknown>,
    metrics?: Record<string, number>,
    options?: Record<string, unknown>,
  ): { contract: Record<string, any>; trace: Record<string, any> };
};
const recognizeBoard = require("./index.js") as {
  main(
    event: Record<string, unknown>,
    runtime: Record<string, unknown>,
  ): Promise<Record<string, any>>;
  __test: {
    normalizeForRecognitionMode(
      raw: unknown,
      request: unknown,
      metrics: Record<string, number>,
      mode: unknown,
    ): { contract: Record<string, any>; trace: Record<string, any> };
    resolveRecognitionMode(
      env: Record<string, string>,
    ): Record<string, unknown>;
    resolveRecognitionContext(
      event: Record<string, unknown>,
      env: Record<string, string>,
    ): Record<string, any>;
  };
};

const schema = JSON.parse(
  fs.readFileSync(
    path.resolve(
      process.cwd(),
      "data/recognition-contract/schema/board-provider-hybrid-semantic-1.0.0.schema.json",
    ),
    "utf8",
  ),
);
const boardLayoutSchema = JSON.parse(
  fs.readFileSync(
    path.resolve(
      process.cwd(),
      "data/board-layout/schema/board-layout.schema.json",
    ),
    "utf8",
  ),
);
const recognitionContractSchema = JSON.parse(
  fs.readFileSync(
    path.resolve(
      process.cwd(),
      "data/recognition-contract/schema/recognition-contract.schema.json",
    ),
    "utf8",
  ),
);
const providerAjv = new Ajv2020({ strict: true, allErrors: true });
const validateProvider = providerAjv.compile(schema);
const contractAjv = new Ajv2020({
  strict: true,
  strictRequired: false,
  allErrors: true,
});
contractAjv.addSchema(boardLayoutSchema);
const validateContract = contractAjv.compile(recognitionContractSchema);

const request = { requestId: "hybrid-test", width: 1080, height: 1440 };
const provider = (
  tiers: Array<Record<string, unknown>>,
  overrides: Record<string, unknown> = {},
) => ({
  ipName: "测试作品",
  ipRawText: "测试作品 一番赏",
  themeName: "测试篇",
  price: 65,
  tiers,
  ...overrides,
});
const tier = (
  rawLabel: string | null,
  totalTickets: number | null,
  pastedTickets: number | null,
  prizeName: string | null = null,
) => ({ rawLabel, prizeName, totalTickets, pastedTickets });
const normalize = (
  tiers: Array<Record<string, unknown>>,
  overrides: Record<string, unknown> = {},
) => hybrid.normalizeHybridExtraction(provider(tiers, overrides), request);
const counts = (result: ReturnType<typeof normalize>, label = "A") => {
  const value = result.contract.draft.tiers.find(
    (item: Record<string, unknown>) => item.label === label,
  );
  return [value.totalTickets, value.pastedTickets, value.remainingTickets];
};
const asExchange = (contract: Record<string, unknown>) => {
  const { contractVersion, ...response } = contract;
  return {
    contractVersion,
    request: {
      requestId: request.requestId,
      imageRef: "cloud://test/recognition-temp/hybrid.jpg",
      image: {
        mediaType: "image/jpeg",
        width: request.width,
        height: request.height,
        acquisition: "camera",
      },
      localeHints: ["zh-CN"],
    },
    response,
  };
};

describe("production hybrid semantic normalizer", () => {
  it("validates the exact minimal Provider shape", () => {
    expect(validateProvider(provider([tier("A赏", 10, 3)]))).toBe(true);
    expect(
      validateProvider({
        ...provider([tier("A赏", 10, 3)]),
        stateEvidence: [],
      }),
    ).toBe(false);
    expect(
      validateProvider(
        provider([{ ...tier("A赏", 10, 3), ticketPattern: "prefix" }]),
      ),
    ).toBe(false);
  });

  it.each([
    [10, 3, 7],
    [10, 0, 10],
    [10, 10, 0],
    [null, 0, null],
    [10, null, null],
  ])(
    "computes remaining for total=%s pasted=%s",
    (total, pasted, remaining) => {
      expect(counts(normalize([tier("A赏", total, pasted)]))).toEqual([
        total,
        pasted,
        remaining,
      ]);
    },
  );

  it("never coerces null to zero", () => {
    const result = normalize([tier("A赏", null, null)]);
    expect(counts(result)).toEqual([null, null, null]);
    expect(result.contract.draft.tiers[0].slotObservation).toMatchObject({
      totalSlots: null,
      coveredSlots: null,
      openSlots: null,
      unknownSlots: null,
    });
  });

  it("keeps pasted greater than total editable and emits COUNT_RANGE_INVALID", () => {
    const result = normalize([tier("A赏", 3, 4)]);
    expect(counts(result)).toEqual([3, null, null]);
    expect(result.trace.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "COUNT_RANGE_INVALID" }),
      ]),
    );
    expect(result.contract.status).toBe("needs_user_input");
  });

  it("aggregates A1/A2 child-first", () => {
    expect(counts(normalize([tier("A1賞", 3, 2), tier("A2賞", 2, 1)]))).toEqual(
      [5, 3, 2],
    );
  });

  it("aggregates D1/D2 child-first", () => {
    expect(
      counts(normalize([tier("Ｄ１ 賞", 4, 1), tier("D2赏", 6, 2)]), "D"),
    ).toEqual([10, 3, 7]);
  });

  it("maps four raw SP items to SP1-SP4 in stable visual order", () => {
    const result = normalize([
      tier("SP賞", 2, 2, "一"),
      tier("SP賞", 2, 1, "二"),
      tier("SP賞", 2, 1, "三"),
      tier("SP賞", 2, 2, "四"),
    ]);
    expect(
      result.contract.draft.tiers.map(
        (item: Record<string, unknown>) => item.label,
      ),
    ).toEqual(["SP1", "SP2", "SP3", "SP4"]);
    expect(
      result.contract.draft.tiers.map(
        (item: Record<string, unknown>) => item.prizeName,
      ),
    ).toEqual(["一", "二", "三", "四"]);
    expect(result.trace.rawSpecialItemCount).toBe(4);
    expect(result.trace.normalizedSpecialItemCount).toBe(4);
  });

  it("does not silently resolve conflicting duplicate children", () => {
    const result = normalize([tier("A1", 3, 2), tier("A1賞", 4, 2)]);
    expect(counts(result)).toEqual([null, null, null]);
    expect(result.trace.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "COUNT_CONFLICT" }),
      ]),
    );
    expect(result.contract.draft.tiers[0].countConflict).toBe(true);
  });

  it("deduplicates identical child observations without double counting", () => {
    const result = normalize([
      tier("A1", 3, 2),
      tier("A1賞", 3, 2),
      tier("A2", 2, 1),
    ]);
    expect(counts(result)).toEqual([5, 3, 2]);
    expect(result.trace.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "COUNT_DUPLICATE" }),
      ]),
    );
  });

  it("computes whole-board math from final parents without child double counting", () => {
    const result = normalize([
      tier("A1", 3, 2),
      tier("A2", 2, 1),
      tier("B賞", 4, 0),
      tier("SP賞", 2, 1),
    ]);
    expect(result.trace.whole).toEqual({
      totalTickets: 11,
      pastedTickets: 4,
      remainingTickets: 7,
    });
    expect(result.contract.draft.derived.totalTickets.value).toBe(11);
    expect(result.contract.draft.derived.remainingTickets.value).toBe(7);
  });

  it("keeps a partial tier editable instead of failing the board", () => {
    const result = normalize([tier("A赏", 10, null), tier("B赏", 2, 1)]);
    expect(result.contract.status).toBe("needs_user_input");
    expect(result.contract.draft.tiers).toHaveLength(2);
    expect(result.trace.partialTierCount).toBe(1);
  });

  it("fails only when no usable tier exists", () => {
    const result = normalize([tier(null, null, null)]);
    expect(result.contract.status).toBe("retake_required");
    expect(result.contract).not.toHaveProperty("draft");
  });

  it("validates its output as RecognitionContract 1.0.0", () => {
    const result = normalize([tier("A1", 3, 2), tier("A2", 2, 1)]);
    expect(validateContract(asExchange(result.contract))).toBe(true);
    expect(validateContract.errors).toEqual(null);
  });

  it("selects modes only from server environment", () => {
    const hybridMode = recognizeBoard.__test.resolveRecognitionMode({
      BOARD_RECOGNITION_MODE: "hybrid_semantic",
    });
    const defaultMode = recognizeBoard.__test.resolveRecognitionMode({});
    expect(hybridMode).toMatchObject({
      mode: "hybrid_semantic",
      protocolVersion: "hybrid-semantic-1.0.0",
    });
    expect(defaultMode).toMatchObject({ mode: "r2_direct_remaining" });
    expect(() =>
      recognizeBoard.__test.resolveRecognitionMode({
        BOARD_RECOGNITION_MODE: "from_client",
      }),
    ).toThrow("BOARD_RECOGNITION_MODE_INVALID");

    const internalToken = "server-only-smoke-token-at-least-32-characters";
    expect(
      recognizeBoard.__test.resolveRecognitionContext(
        {
          internalRecognitionMode: "hybrid_semantic",
          internalSmokeToken: internalToken,
        },
        {
          BOARD_RECOGNITION_MODE: "r1_remaining",
          BOARD_RECOGNITION_INTERNAL_SMOKE_TOKEN: internalToken,
        },
      ),
    ).toMatchObject({
      internalSmoke: true,
      modeConfig: { mode: "hybrid_semantic" },
    });
    expect(() =>
      recognizeBoard.__test.resolveRecognitionContext(
        {
          internalRecognitionMode: "hybrid_semantic",
          internalSmokeToken: "client-controlled-token",
        },
        {
          BOARD_RECOGNITION_MODE: "r1_remaining",
          BOARD_RECOGNITION_INTERNAL_SMOKE_TOKEN: internalToken,
        },
      ),
    ).toThrow("INTERNAL_SMOKE_AUTH_INVALID");
  });

  it("routes H0 through direct counts without v4 ticketPattern evidence", () => {
    const mode = recognizeBoard.__test.resolveRecognitionMode({
      BOARD_RECOGNITION_MODE: "hybrid_semantic",
    });
    const result = recognizeBoard.__test.normalizeForRecognitionMode(
      provider([tier("A赏", 10, 3)]),
      request,
      {},
      mode,
    );
    expect(counts(result)).toEqual([10, 3, 7]);
    expect(JSON.stringify(result.trace)).not.toContain("ticketPattern");
    expect(JSON.stringify(result.trace)).not.toContain("stateEvidence");
  });

  it("runs the production H0 provider path and ignores a client mode field", async () => {
    const raw = provider([
      tier("SP賞", 2, 2),
      tier("SP賞", 2, 1),
      tier("A1賞", 3, 2),
      tier("A2賞", 2, 1),
    ]);
    const fetchImpl = async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      const promptText = body.messages[0].content[0].text as string;
      expect(promptText).toContain("只提取以下视觉事实");
      expect(promptText).not.toContain("ticketPattern");
      expect(promptText).not.toContain("stateEvidence");
      expect(body).toMatchObject({
        model: "qwen3.7-flash",
        enable_thinking: false,
        temperature: 0,
        response_format: { type: "json_object" },
      });
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(raw) } }],
          usage: {
            prompt_tokens: 100,
            completion_tokens: 20,
            total_tokens: 120,
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "x-request-id": "provider-h0-test",
          },
        },
      );
    };
    const jobGuard = {
      claim: async () => ({ jobId: "job-h0" }),
      succeed: async (...args: unknown[]) => args,
      fail: async () => undefined,
    };
    const succeed = vi.spyOn(jobGuard, "succeed");
    const logger = { info: vi.fn(), error: vi.fn() };
    const event = {
      contractVersion: "1.0.0",
      requestId: "hybrid-test",
      recognitionJobId: "job-h0",
      recognitionJobToken: "token",
      imageFileId:
        "cloud://test/recognition-temp/job-h0/hybrid-production-test.jpg",
      image: {
        mediaType: "image/jpeg",
        width: 1080,
        height: 1440,
        byteLength: 123456,
        acquisition: "camera",
      },
    };
    const result = await recognizeBoard.main(event, {
      env: {
        DASHSCOPE_API_KEY: "test-key",
        DASHSCOPE_WORKSPACE_ID: "workspace",
        BOARD_RECOGNITION_MODE: "hybrid_semantic",
      },
      fetchImpl,
      jobGuard,
      imageStore: {
        getTemporaryUrl: async () => "https://example.test/h0.jpg",
        delete: async () => undefined,
      },
      logger,
    });
    expect(result.status).toBe("ready_for_confirmation");
    expect(
      result.draft.tiers.map((item: Record<string, unknown>) => item.label),
    ).toEqual(["SP1", "SP2", "A"]);
    expect(succeed).toHaveBeenCalledWith(
      { jobId: "job-h0" },
      expect.any(Object),
      expect.objectContaining({
        recognitionMode: "hybrid_semantic",
        protocolVersion: "hybrid-semantic-1.0.0",
        promptVersion: "ichi-board-vlm-hybrid-semantic-1.0.0",
        promptHash:
          "0b4e572378fad8e445f63c6b67997415a1099a0c4ae4d968a6182b545b22226b",
        schemaVersion: "board-provider-hybrid-semantic-1.0.0",
        providerRequestId: "provider-h0-test",
        tiers: expect.arrayContaining([
          expect.objectContaining({ totalTickets: 2, pastedTickets: 2 }),
        ]),
      }),
    );
    expect(logger.info).toHaveBeenCalledWith(
      "recognize_board_performance",
      expect.objectContaining({
        recognitionMode: "hybrid_semantic",
        internalSmoke: false,
        promptHash:
          "0b4e572378fad8e445f63c6b67997415a1099a0c4ae4d968a6182b545b22226b",
        providerRequestId: "provider-h0-test",
        ajvPass: true,
        normalizePass: true,
        rawSpecialItemCount: 2,
        normalizedSpecialItemCount: 2,
      }),
    );
  });

  it("allows a token-authenticated internal smoke to override R1 without a cloud job", async () => {
    const internalToken = "server-only-smoke-token-at-least-32-characters";
    const logger = { info: vi.fn(), error: vi.fn() };
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify(provider([tier("A賞", 2, 1)])),
                },
              },
            ],
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "x-request-id": "provider-internal-smoke",
            },
          },
        ),
    );
    const result = await recognizeBoard.main(
      {
        contractVersion: "1.0.0",
        requestId: "internal-smoke",
        internalRecognitionMode: "hybrid_semantic",
        internalSmokeToken: internalToken,
        recognitionJobId: "internal-smoke-job",
        recognitionJobToken: "internal-smoke-job-token",
        imageFileId:
          "cloud://test/recognition-temp/internal-smoke-job/board.jpg",
        image: {
          mediaType: "image/jpeg",
          width: 1080,
          height: 1440,
          byteLength: 123456,
          acquisition: "camera",
        },
      },
      {
        env: {
          DASHSCOPE_API_KEY: "test-key",
          DASHSCOPE_WORKSPACE_ID: "workspace",
          BOARD_RECOGNITION_MODE: "r1_remaining",
          BOARD_RECOGNITION_INTERNAL_SMOKE_TOKEN: internalToken,
        },
        fetchImpl,
        imageStore: {
          getTemporaryUrl: async () => "https://example.test/h0.jpg",
          delete: async () => undefined,
        },
        logger,
      },
    );

    expect(result.status).toBe("ready_for_confirmation");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      "recognize_board_performance",
      expect.objectContaining({
        recognitionMode: "hybrid_semantic",
        internalSmoke: true,
        providerRequestId: "provider-internal-smoke",
      }),
    );
  });

  it("rejects an unauthenticated internal mode before Provider or quota work", async () => {
    const fetchImpl = vi.fn();
    const result = await recognizeBoard.main(
      {
        contractVersion: "1.0.0",
        requestId: "internal-smoke-rejected",
        internalRecognitionMode: "hybrid_semantic",
        internalSmokeToken: "client-token",
        recognitionJobId: "internal-smoke-job",
        recognitionJobToken: "internal-smoke-job-token",
        imageFileId:
          "cloud://test/recognition-temp/internal-smoke-job/board.jpg",
        image: {
          mediaType: "image/jpeg",
          width: 1080,
          height: 1440,
          byteLength: 123456,
          acquisition: "camera",
        },
      },
      {
        env: {
          BOARD_RECOGNITION_MODE: "r1_remaining",
          BOARD_RECOGNITION_INTERNAL_SMOKE_TOKEN:
            "server-only-smoke-token-at-least-32-characters",
        },
        fetchImpl,
      },
    );

    expect(result).toMatchObject({
      status: "service_error",
      reasonCode: "INTERNAL_SMOKE_AUTH_INVALID",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
