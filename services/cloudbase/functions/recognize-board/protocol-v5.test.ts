import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";

import { parseBoardRecognitionTransport } from "../../../../apps/client/miniprogram/platform/board-recognition.js";

const require = createRequire(import.meta.url);
const Ajv2020 = require("ajv/dist/2020").default;
const recognizeBoard = require("./index.js") as {
  __test: {
    computeV5Counts(tier: unknown): {
      total: number | null;
      pasted: number | null;
      remaining: number | null;
      valid: boolean;
    };
    normalizeV5Extraction(
      raw: unknown,
      request: unknown,
      metrics?: Record<string, number>,
    ): Record<string, any>;
  };
};

const rawFixture = JSON.parse(
  fs.readFileSync(
    path.resolve(
      process.cwd(),
      "services/cloudbase/functions/recognize-board/fixtures/provider-v5-nikke.json",
    ),
    "utf8",
  ),
) as Record<string, any>;

const providerSchema = JSON.parse(
  fs.readFileSync(
    path.resolve(
      process.cwd(),
      "data/recognition-contract/schema/board-provider-extraction-5.0.0-rc1.schema.json",
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

describe("provider protocol 5 count semantics", () => {
  it.each([
    [
      "numbered_prefix",
      {
        totalCount: 15,
        sequenceStartOrdinal: 1,
        firstOpenOrdinal: 7,
        pastedCount: null,
        remainingCount: null,
      },
      15,
      6,
      9,
    ],
    [
      "pasted_plus_remaining",
      {
        totalCount: null,
        sequenceStartOrdinal: null,
        firstOpenOrdinal: null,
        pastedCount: 14,
        remainingCount: 1,
      },
      15,
      14,
      1,
    ],
    [
      "pasted_plus_remaining",
      {
        totalCount: null,
        sequenceStartOrdinal: null,
        firstOpenOrdinal: null,
        pastedCount: 17,
        remainingCount: 1,
      },
      18,
      17,
      1,
    ],
    [
      "pasted_full",
      {
        totalCount: null,
        sequenceStartOrdinal: null,
        firstOpenOrdinal: null,
        pastedCount: 13,
        remainingCount: null,
      },
      13,
      13,
      0,
    ],
    [
      "unknown",
      {
        totalCount: null,
        sequenceStartOrdinal: null,
        firstOpenOrdinal: null,
        pastedCount: null,
        remainingCount: null,
      },
      null,
      null,
      null,
    ],
  ])(
    "computes %s only in CloudBase",
    (countMode, evidence, total, pasted, remaining) => {
      expect(
        recognizeBoard.__test.computeV5Counts({ countMode, evidence }),
      ).toMatchObject({
        total,
        pasted,
        remaining,
        valid: true,
      });
    },
  );

  it.each([4, 7])(
    "preserves a directly observed overlap-stack physical count of %i",
    (pastedCount) => {
      expect(
        recognizeBoard.__test.computeV5Counts({
          countMode: "pasted_full",
          evidence: {
            totalCount: null,
            sequenceStartOrdinal: null,
            firstOpenOrdinal: null,
            pastedCount,
            remainingCount: null,
          },
        }),
      ).toMatchObject({
        total: pastedCount,
        pasted: pastedCount,
        remaining: 0,
      });
    },
  );

  it("runs the NIKKE 80/78/2 fixture through Provider AJV, Normalize, RecognitionContract, and the client parser", () => {
    const validateProvider = new Ajv2020({
      strict: true,
      allErrors: true,
    }).compile(providerSchema);
    expect(validateProvider(rawFixture), validateProvider.errors).toBe(true);
    const normalized = recognizeBoard.__test.normalizeV5Extraction(
      rawFixture,
      { requestId: "nikke-v5", width: 1080, height: 1440 },
      {},
    );
    const exchange = {
      contractVersion: normalized.contractVersion,
      request: {
        requestId: "nikke-v5",
        imageRef: "cloud://test/recognition-temp/nikke.jpg",
        image: {
          mediaType: "image/jpeg",
          width: 1080,
          height: 1440,
          acquisition: "camera",
        },
        localeHints: ["zh-CN"],
      },
      response: Object.fromEntries(
        Object.entries(normalized).filter(([key]) => key !== "contractVersion"),
      ),
    };
    const contractAjv = new Ajv2020({
      strict: true,
      strictRequired: false,
      allErrors: true,
    });
    contractAjv.addSchema(boardLayoutSchema);
    const validateContract = contractAjv.compile(recognitionContractSchema);
    expect(validateContract(exchange), validateContract.errors).toBe(true);
    const parsed = parseBoardRecognitionTransport(normalized);
    expect(
      parsed.prizes.map(({ tier, remainingTickets }) => ({
        tier,
        remaining: remainingTickets,
      })),
    ).toEqual(
      [
        ["A", 2, 2, 0],
        ["B", 2, 2, 0],
        ["C", 1, 1, 0],
        ["D", 1, 1, 0],
        ["E", 1, 1, 0],
        ["F", 5, 5, 0],
        ["G", 15, 14, 1],
        ["H", 18, 17, 1],
        ["I", 13, 13, 0],
        ["J", 8, 8, 0],
        ["K", 14, 14, 0],
      ].map(([tier, , , remaining]) => ({
        tier,
        remaining,
      })),
    );
    expect(
      parsed.prizes.reduce(
        (sum, tier) => sum + (tier.remainingTickets ?? 0),
        0,
      ),
    ).toBe(2);
  });

  it("keeps the prompt's terminal-ticket and multi-segment rules explicit", () => {
    const prompt = fs.readFileSync(
      path.resolve(
        process.cwd(),
        "data/recognition-contract/prompt/ichi-board-vlm-5.0.1-rc1.txt",
      ),
      "utf8",
    );
    expect(prompt).toContain(
      "terminal full-length strip is also exactly one pasted physical ticket",
    );
    expect(prompt).toContain(
      "multiple rows or multiple overlap stack segments",
    );
    expect(prompt).toContain('countMode="pasted_plus_remaining"');
  });
});
