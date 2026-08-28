import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

import { describe, expect, it } from "vitest";

/* eslint-disable @typescript-eslint/no-explicit-any */
const require = createRequire(
  path.resolve(
    process.cwd(),
    "services/cloudbase/functions/recognize-board/package.json",
  ),
);
const Ajv2020 = require("ajv/dist/2020").default;
const hybrid = require(
  path.resolve(
    process.cwd(),
    "experiments/hybrid-semantic/hybrid-semantic-experiment.js",
  ),
) as {
  validateProvider(value: unknown): boolean;
  normalizeHybridProvider(
    raw: unknown,
    request: { requestId: string; width: number; height: number },
  ): { contract: Record<string, any>; trace: Record<string, any> };
};

const request = { requestId: "hybrid-exp", width: 1080, height: 1440 };
const provider = (tiers: unknown[]) => ({
  ipName: "测试 IP",
  ipRawText: "TEST IP VOL.1",
  themeName: "VOL.1",
  price: 65,
  tiers,
});
const tier = (
  rawLabel: string | null,
  totalTickets: number | null,
  pastedTickets: number | null,
) => ({ rawLabel, prizeName: null, totalTickets, pastedTickets });

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

const normalized = (tiers: unknown[]) =>
  hybrid.normalizeHybridProvider(provider(tiers), request);
const mappedTier = (result: ReturnType<typeof normalized>, label: string) =>
  result.trace.tiers.find((entry: { label: string }) => entry.label === label);

describe("hybrid semantic deterministic transformer", () => {
  it("requires the minimal exact Provider shape", () => {
    expect(hybrid.validateProvider(provider([tier("A赏", 1, 0)]))).toBe(true);
    expect(
      hybrid.validateProvider({
        ...provider([tier("A赏", 1, 0)]),
        warnings: [],
      }),
    ).toBe(false);
    expect(
      hybrid.validateProvider({
        ...provider([tier("A赏", 1, 0)]),
        tiers: [{ rawLabel: "A赏", totalTickets: 1, pastedTickets: 0 }],
      }),
    ).toBe(false);
  });

  it("CASE A aggregates A1/A2 child-first", () => {
    const result = normalized([tier("Ａ１賞", 3, 2), tier("A2賞", 2, 1)]);
    expect(mappedTier(result, "A")).toMatchObject({
      totalTickets: 5,
      pastedTickets: 3,
      remainingTickets: 2,
    });
  });

  it("CASE B aggregates D1/D2 child-first", () => {
    const result = normalized([tier("D1賞", 2, 0), tier("D2賞", 3, 2)]);
    expect(mappedTier(result, "D")).toMatchObject({
      totalTickets: 5,
      pastedTickets: 2,
      remainingTickets: 3,
    });
  });

  it("CASE C preserves four visual SP instances and maps by order", () => {
    const result = normalized([
      tier("SP賞", 2, 2),
      tier("SP賞", 2, 1),
      tier("SP賞", 2, 1),
      tier("SP賞", 2, 2),
    ]);
    expect(result.trace.specialItemCount).toBe(4);
    expect(result.trace.tiers).toMatchObject([
      { label: "SP1", totalTickets: 2, pastedTickets: 2, remainingTickets: 0 },
      { label: "SP2", totalTickets: 2, pastedTickets: 1, remainingTickets: 1 },
      { label: "SP3", totalTickets: 2, pastedTickets: 1, remainingTickets: 1 },
      { label: "SP4", totalTickets: 2, pastedTickets: 2, remainingTickets: 0 },
    ]);
  });

  it("CASE D keeps remaining null when pasted is null", () => {
    expect(mappedTier(normalized([tier("A", 10, null)]), "A")).toMatchObject({
      totalTickets: 10,
      pastedTickets: null,
      remainingTickets: null,
    });
  });

  it("CASE E keeps remaining null when total is null and pasted is zero", () => {
    expect(mappedTier(normalized([tier("A", null, 0)]), "A")).toMatchObject({
      totalTickets: null,
      pastedTickets: 0,
      remainingTickets: null,
    });
  });

  it("CASE F flags pasted above total without clamping", () => {
    const result = normalized([tier("A", 3, 4)]);
    expect(mappedTier(result, "A")).toMatchObject({
      totalTickets: 3,
      pastedTickets: null,
      remainingTickets: null,
    });
    expect(result.trace.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "COUNT_RANGE_INVALID" }),
      ]),
    );
  });

  it("CASE G flags conflicting duplicate child counts", () => {
    const result = normalized([tier("A1", 3, 2), tier("A1賞", 4, 2)]);
    expect(mappedTier(result, "A")).toMatchObject({
      totalTickets: null,
      pastedTickets: null,
      remainingTickets: null,
    });
    expect(result.trace.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "COUNT_CONFLICT" }),
      ]),
    );
  });

  it("CASE H never coerces null to zero and builds RecognitionContract 1.0.0", () => {
    const result = normalized([tier("A", null, null)]);
    expect(mappedTier(result, "A")).toMatchObject({
      totalTickets: null,
      pastedTickets: null,
      remainingTickets: null,
    });
    const { contractVersion, ...response } = result.contract;
    const exchange = {
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
    expect(
      validateExchange(exchange),
      contractAjv.errorsText(validateExchange.errors),
    ).toBe(true);
  });
});
