import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const Ajv2020 = require("ajv/dist/2020").default;
const resolver = require("./r2-direct-remaining-resolver.js") as {
  resolveR2Tier(tier: unknown, index?: number): any;
  resolveR2Extraction(raw: unknown): any;
  normalizeR2Extraction(
    raw: unknown,
    request: unknown,
    metrics?: Record<string, number>,
  ): { contract: Record<string, any>; trace: Record<string, any> };
};

const providerSchema = JSON.parse(
  fs.readFileSync(
    path.resolve(
      process.cwd(),
      "data/recognition-contract/schema/board-provider-r2-direct-remaining-1.0.0.schema.json",
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
const validateProvider = new Ajv2020({
  strict: true,
  allErrors: true,
}).compile(providerSchema);
const contractAjv = new Ajv2020({
  strict: true,
  strictRequired: false,
  allErrors: true,
});
contractAjv.addSchema(boardLayoutSchema);
const validateContract = contractAjv.compile(recognitionContractSchema);

const observation = (value: number | null, rawText: string | null) => ({
  value,
  rawText,
});
const runs = (count: number) =>
  count === 0
    ? []
    : [
        Array.from({ length: count }, (_, index) =>
          observation(index + 1, String(index + 1)),
        ),
      ];
const tier = (remainingTickets: number | null, count: number) => ({
  tierCode: "A",
  rawLabel: "A賞",
  visibleNumberRuns: runs(count),
  remainingTickets,
});
const raw = (tiers: Array<Record<string, unknown>>) => ({
  ipName: "宝可梦",
  themeName: "测试篇",
  tiers,
});
const request = { requestId: "r2-test", width: 1080, height: 1440 };
const asExchange = (contract: Record<string, unknown>) => {
  const { contractVersion, ...response } = contract;
  return {
    contractVersion,
    request: {
      requestId: request.requestId,
      imageRef: "cloud://test/recognition-temp/r2.jpg",
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

describe("R2 direct-remaining deterministic resolver", () => {
  it("1 keeps provider R=5 when five observations agree", () => {
    expect(resolver.resolveR2Tier(tier(5, 5))).toMatchObject({
      providerRemainingTickets: 5,
      visibleEvidenceCount: 5,
      resolvedRemainingTickets: 5,
      resolutionSource: "provider_r",
      evidenceMatched: true,
    });
  });

  it("2 keeps provider R=5 when four observations disagree", () => {
    expect(resolver.resolveR2Tier(tier(5, 4))).toMatchObject({
      resolvedRemainingTickets: 5,
      resolutionSource: "provider_r",
      evidenceMatched: false,
    });
  });

  it("3 keeps provider R=1 when visible evidence is absent", () => {
    expect(resolver.resolveR2Tier(tier(1, 0))).toMatchObject({
      resolvedRemainingTickets: 1,
      evidenceMatched: null,
    });
  });

  it("4 preserves provider R=0 as a present value", () => {
    expect(resolver.resolveR2Tier(tier(0, 0))).toMatchObject({
      providerRemainingTickets: 0,
      resolvedRemainingTickets: 0,
      resolutionSource: "provider_r",
    });
  });

  it("5 keeps provider R=0 even when two observations disagree", () => {
    expect(resolver.resolveR2Tier(tier(0, 2))).toMatchObject({
      resolvedRemainingTickets: 0,
      evidenceMatched: false,
    });
  });

  it("6 falls back from null provider R to three observation objects", () => {
    expect(resolver.resolveR2Tier(tier(null, 3))).toMatchObject({
      resolvedRemainingTickets: 3,
      resolutionSource: "visible_fallback",
    });
  });

  it("7 falls back from null provider R to one observation object", () => {
    expect(resolver.resolveR2Tier(tier(null, 1))).toMatchObject({
      resolvedRemainingTickets: 1,
      resolutionSource: "visible_fallback",
    });
  });

  it("8 keeps R unknown when provider R and observations are absent", () => {
    expect(resolver.resolveR2Tier(tier(null, 0))).toMatchObject({
      resolvedRemainingTickets: null,
      resolutionSource: "unknown",
    });
  });

  it("9 counts observation objects across multiple runs", () => {
    const value = tier(null, 0);
    value.visibleNumberRuns = [runs(6)[0]!, runs(5)[0]!];
    expect(resolver.resolveR2Tier(value).visibleEvidenceCount).toBe(11);
  });

  it("10 counts a fully null observation object as visible evidence", () => {
    const value = tier(null, 0);
    value.visibleNumberRuns = [[observation(null, null)]];
    expect(resolver.resolveR2Tier(value)).toMatchObject({
      visibleEvidenceCount: 1,
      resolvedRemainingTickets: 1,
      resolutionSource: "visible_fallback",
    });
  });

  it("11 carries R=0 through normalization without falsy filtering", () => {
    const result = resolver.normalizeR2Extraction(raw([tier(0, 0)]), request);
    expect(result.contract.draft.tiers[0]).toMatchObject({
      totalTickets: null,
      pastedTickets: null,
      remainingTickets: 0,
      slotObservation: { openSlots: 0 },
    });
    expect(result.trace.zeroTierCount).toBe(1);
  });

  it("12 never derives T or P while aggregating A1/A2 direct R", () => {
    const a1 = { ...tier(2, 2), tierCode: "A1" };
    const a2 = { ...tier(3, 0), tierCode: "A2" };
    const result = resolver.normalizeR2Extraction(raw([a1, a2]), request);
    expect(result.contract.draft.tiers).toHaveLength(1);
    expect(result.contract.draft.tiers[0]).toMatchObject({
      label: "A",
      totalTickets: null,
      pastedTickets: null,
      remainingTickets: 5,
    });
    const source = fs.readFileSync(
      path.resolve(
        process.cwd(),
        "services/cloudbase/functions/recognize-board/r2-direct-remaining-resolver.js",
      ),
      "utf8",
    );
    expect(source).not.toMatch(/if\s*\(\s*!\s*[^\n]*remainingTickets/u);
    expect(source).not.toMatch(/remainingTickets\s*\|\|/u);
  });

  it("13 rejects any extra Provider field under the frozen Schema", () => {
    expect(validateProvider(raw([tier(3, 3)]))).toBe(true);
    expect(validateProvider({ ...raw([tier(3, 3)]), totalTickets: 9 })).toBe(
      false,
    );
  });

  it("14 validates null observations and the normalized RecognitionContract", () => {
    const provider = raw([
      {
        ...tier(null, 0),
        visibleNumberRuns: [[observation(null, null)]],
      },
    ]);
    expect(validateProvider(provider)).toBe(true);
    const result = resolver.normalizeR2Extraction(provider, request);
    expect(validateContract(asExchange(result.contract))).toBe(true);
    expect(validateContract.errors).toBeNull();
  });
});
