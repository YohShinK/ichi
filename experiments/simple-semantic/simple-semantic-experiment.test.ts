import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

import { describe, expect, it } from "vitest";

import { parseBoardRecognitionTransport } from "../../apps/client/miniprogram/platform/board-recognition.js";
import {
  buildBoardFromRecognitionSnapshot,
  createRecognitionGenerationSnapshot,
} from "../../apps/client/miniprogram/platform/recognition-generation.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
const require = createRequire(
  path.resolve(
    process.cwd(),
    "services/cloudbase/functions/recognize-board/package.json",
  ),
);
const Ajv2020 = require("ajv/dist/2020").default;
const experiment = require(
  path.resolve(
    process.cwd(),
    "experiments/simple-semantic/simple-semantic-experiment.js",
  ),
) as {
  validateProvider(value: unknown): boolean;
  normalizeSimpleProvider(
    raw: unknown,
    request: { requestId: string; width: number; height: number },
  ): Record<string, any>;
};

const request = { requestId: "simple-exp", width: 1080, height: 1440 };
const provider = (tiers: unknown[], extra: Record<string, unknown> = {}) => ({
  ipName: "崩坏：星穹铁道",
  ipRawText: "崩坏：星穹铁道 VOL.3",
  themeName: "VOL.3",
  price: 85,
  tiers,
  ...extra,
});

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
const contractAjv = new Ajv2020({
  strict: true,
  strictRequired: false,
  allErrors: true,
});
contractAjv.addSchema(boardLayoutSchema);
const validateExchange = contractAjv.compile(recognitionContractSchema);

const exchangeFor = (result: Record<string, any>) => {
  const { contractVersion, ...response } = result;
  return {
    contractVersion,
    request: {
      requestId: request.requestId,
      imageRef: "cloud://test/recognition-temp/simple.jpg",
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

describe("simple semantic provider experiment", () => {
  it("accepts integer/null counts and optional fields without a global schema failure", () => {
    expect(
      experiment.validateProvider({
        tiers: [
          { rawTier: "A", totalTickets: 10, pastedTickets: null },
          { rawTier: "B" },
        ],
      }),
    ).toBe(true);
    expect(
      experiment.validateProvider({
        tiers: [{ rawTier: "A", totalTickets: "10", pastedTickets: 3 }],
      }),
    ).toBe(false);
  });

  it("preserves null as unknown and never coerces it to zero", () => {
    const result = experiment.normalizeSimpleProvider(
      provider([
        {
          rawTier: "A",
          prizeName: null,
          totalTickets: 10,
          pastedTickets: null,
        },
      ]),
      request,
    );
    expect(result.status).toBe("needs_user_input");
    expect(result.draft.tiers[0]).toMatchObject({
      totalTickets: 10,
      pastedTickets: null,
      remainingTickets: null,
    });
  });

  it("invalidates only pasted when pasted exceeds total", () => {
    const result = experiment.normalizeSimpleProvider(
      provider([
        {
          rawTier: "A",
          totalTickets: 3,
          pastedTickets: 4,
        },
        {
          rawTier: "B",
          totalTickets: 2,
          pastedTickets: 1,
        },
      ]),
      request,
    );
    expect(result.status).toBe("needs_user_input");
    expect(result.draft.tiers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "A",
          totalTickets: 3,
          pastedTickets: null,
          remainingTickets: null,
          countConflict: true,
        }),
        expect.objectContaining({
          label: "B",
          totalTickets: 2,
          pastedTickets: 1,
          remainingTickets: 1,
        }),
      ]),
    );
  });

  it("derives remaining, merges numbered children, and assigns specials in visual order", () => {
    const result = experiment.normalizeSimpleProvider(
      provider([
        { rawTier: "A1赏", totalTickets: 2, pastedTickets: 1 },
        { rawTier: "A2", totalTickets: 3, pastedTickets: 2 },
        { rawTier: "最终赏", totalTickets: 1, pastedTickets: 1 },
        { rawTier: "双重机会赏", totalTickets: 2, pastedTickets: 0 },
      ]),
      request,
    );
    expect(result.draft.tiers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "A",
          totalTickets: 5,
          pastedTickets: 3,
          remainingTickets: 2,
        }),
        expect.objectContaining({ label: "SP1", totalTickets: 1 }),
        expect.objectContaining({ label: "SP2", totalTickets: 2 }),
      ]),
    );
  });

  it("produces a valid RecognitionContract and preserves 15/14 through Board LEFT 1", () => {
    const normalized = experiment.normalizeSimpleProvider(
      provider([{ rawTier: "G", totalTickets: 15, pastedTickets: 14 }]),
      request,
    );
    const exchange = exchangeFor(normalized);
    expect(
      validateExchange(exchange),
      contractAjv.errorsText(validateExchange.errors),
    ).toBe(true);
    const client = parseBoardRecognitionTransport({
      contractVersion: normalized.contractVersion,
      requestId: normalized.requestId,
      status: normalized.status,
      draft: normalized.draft,
      issues: normalized.issues,
      imageHandling: normalized.imageHandling,
    });
    expect(client.status).toBe("recognized");
    if (client.status !== "recognized") return;
    expect(client.prizes[0]).toMatchObject({
      tier: "G",
      remainingTickets: 1,
    });
    const snapshot = createRecognitionGenerationSnapshot({
      generationId: "simple-exp",
      mode: "assisted-draw",
      ipName: client.ipName,
      themeName: client.themeName,
      locationNote: "",
      unitPrice: client.unitPrice,
      capturedAt: 1,
      prizes: [...client.prizes],
    });
    expect(buildBoardFromRecognitionSnapshot(snapshot)[0]).toMatchObject({
      tier: "G",
      initialRemainingTickets: 1,
      isGrandPrize: false,
    });
  });
});
