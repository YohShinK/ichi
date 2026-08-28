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
const evidence = require(
  path.resolve(
    process.cwd(),
    "experiments/evidence-primitive/evidence-primitive-experiment.js",
  ),
);
const request = { requestId: "evidence-exp", width: 1080, height: 1440 };
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
  stateEvidence: Record<string, unknown>,
  prizeName: string | null = null,
) => ({
  rawLabel,
  prizeName,
  totalTickets,
  stateEvidence: {
    remainingLabel: null,
    firstOpenOrdinal: null,
    openCount: null,
    pastedCount: null,
    ...stateEvidence,
  },
});
const normalized = (tiers: unknown[]) =>
  evidence.normalizeEvidenceProvider(provider(tiers), request);
const mapped = (result: any, label: string) =>
  result.trace.tiers.find((entry: any) => entry.label === label);

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

describe("evidence primitive deterministic resolver", () => {
  it("requires the exact minimal Provider shape", () => {
    expect(
      evidence.validateProvider(provider([tier("A", 1, { openCount: 1 })])),
    ).toBe(true);
    expect(evidence.validateProvider({ ...provider([]), warnings: [] })).toBe(
      false,
    );
    expect(
      evidence.validateProvider(
        provider([
          {
            rawLabel: "A",
            prizeName: null,
            totalTickets: 1,
            stateEvidence: { openCount: 1 },
          },
        ]),
      ),
    ).toBe(false);
  });
  it("A resolves あと1枚 with total 15", () =>
    expect(
      mapped(normalized([tier("A", 15, { remainingLabel: "あと1枚" })]), "A"),
    ).toMatchObject({
      totalTickets: 15,
      pastedTickets: 14,
      remainingTickets: 1,
      evidencePrimitive: "REMAINING_LABEL",
    }));
  it("B normalizes fullwidth digits in 残り３枚", () =>
    expect(
      mapped(normalized([tier("A", 8, { remainingLabel: "残り３枚" })]), "A"),
    ).toMatchObject({
      totalTickets: 8,
      pastedTickets: 5,
      remainingTickets: 3,
    }));
  it("parses common Chinese and Japanese numerals", () => {
    expect(evidence.parseRemainingLabel("还剩十二张")).toEqual({
      ok: true,
      value: 12,
    });
    expect(evidence.parseRemainingLabel("残り二十三枚")).toEqual({
      ok: true,
      value: 23,
    });
  });
  it("C resolves firstOpenOrdinal 14 with total 16", () =>
    expect(
      mapped(normalized([tier("A", 16, { firstOpenOrdinal: 14 })]), "A"),
    ).toMatchObject({
      pastedTickets: 13,
      remainingTickets: 3,
      evidencePrimitive: "FIRST_OPEN",
    }));
  it("D resolves firstOpenOrdinal 1 with total 3", () =>
    expect(
      mapped(normalized([tier("A", 3, { firstOpenOrdinal: 1 })]), "A"),
    ).toMatchObject({ pastedTickets: 0, remainingTickets: 3 }));
  it("E resolves openCount 5 with total 12", () =>
    expect(
      mapped(normalized([tier("A", 12, { openCount: 5 })]), "A"),
    ).toMatchObject({
      pastedTickets: 7,
      remainingTickets: 5,
      evidencePrimitive: "OPEN_COUNT",
    }));
  it("F resolves pastedCount 11 with total 16", () =>
    expect(
      mapped(normalized([tier("A", 16, { pastedCount: 11 })]), "A"),
    ).toMatchObject({
      pastedTickets: 11,
      remainingTickets: 5,
      evidencePrimitive: "PASTED_COUNT",
    }));
  it("G keeps all-null evidence unknown, never zero", () =>
    expect(mapped(normalized([tier("A", 5, {})]), "A")).toMatchObject({
      pastedTickets: null,
      remainingTickets: null,
      evidencePrimitive: "UNKNOWN",
      issues: [expect.objectContaining({ code: "EVIDENCE_UNKNOWN" })],
    }));
  it("H rejects multiple primitives without choosing", () =>
    expect(
      mapped(normalized([tier("A", 5, { openCount: 2, pastedCount: 3 })]), "A"),
    ).toMatchObject({
      pastedTickets: null,
      remainingTickets: null,
      evidencePrimitive: "CONFLICT",
      issues: [expect.objectContaining({ code: "MULTIPLE_STATE_EVIDENCE" })],
    }));
  it("I rejects openCount above total", () =>
    expect(
      mapped(normalized([tier("A", 3, { openCount: 4 })]), "A"),
    ).toMatchObject({
      pastedTickets: null,
      remainingTickets: null,
      issues: [expect.objectContaining({ code: "COUNT_RANGE_INVALID" })],
    }));
  it("J rejects pastedCount above total", () =>
    expect(
      mapped(normalized([tier("A", 3, { pastedCount: 4 })]), "A"),
    ).toMatchObject({
      pastedTickets: null,
      remainingTickets: null,
      issues: [expect.objectContaining({ code: "COUNT_RANGE_INVALID" })],
    }));
  it("K rejects firstOpenOrdinal above total", () =>
    expect(
      mapped(normalized([tier("A", 3, { firstOpenOrdinal: 4 })]), "A"),
    ).toMatchObject({
      pastedTickets: null,
      remainingTickets: null,
      issues: [expect.objectContaining({ code: "COUNT_RANGE_INVALID" })],
    }));
  it("L rejects an unparseable remaining label", () =>
    expect(
      mapped(normalized([tier("A", 3, { remainingLabel: "剩余若干" })]), "A"),
    ).toMatchObject({
      pastedTickets: null,
      remainingTickets: null,
      evidencePrimitive: "REMAINING_LABEL",
      issues: [expect.objectContaining({ code: "EVIDENCE_LABEL_UNPARSEABLE" })],
    }));
  it("M preserves null independently when total is unknown", () => {
    expect(
      mapped(normalized([tier("A", null, { openCount: 2 })]), "A"),
    ).toMatchObject({
      totalTickets: null,
      pastedTickets: null,
      remainingTickets: 2,
    });
    expect(
      mapped(normalized([tier("B", null, { pastedCount: 2 })]), "B"),
    ).toMatchObject({
      totalTickets: null,
      pastedTickets: 2,
      remainingTickets: null,
    });
  });
  it("N aggregates A1/A2 only after child resolution", () =>
    expect(
      mapped(
        normalized([
          tier("A1賞", 3, { firstOpenOrdinal: 3 }),
          tier("A2賞", 2, { openCount: 1 }),
        ]),
        "A",
      ),
    ).toMatchObject({
      totalTickets: 5,
      pastedTickets: 3,
      remainingTickets: 2,
      children: expect.any(Array),
    }));
  it("rejects conflicting duplicate child values", () => {
    const result = normalized([
      tier("A1", 3, { pastedCount: 2 }),
      tier("A1賞", 4, { pastedCount: 2 }),
    ]);
    expect(mapped(result, "A")).toMatchObject({
      totalTickets: null,
      pastedTickets: null,
      remainingTickets: null,
      evidencePrimitive: "CONFLICT",
    });
    expect(result.trace.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "COUNT_CONFLICT" }),
      ]),
    );
  });
  it("O preserves four SP items and stable visual mapping", () => {
    const result = normalized([
      tier("SP賞", 2, { pastedCount: 2 }),
      tier("SP賞", 2, { openCount: 1 }),
      tier("SP賞", 2, { firstOpenOrdinal: 2 }),
      tier("SP賞", 2, { pastedCount: 2 }),
    ]);
    expect(result.trace.specialItemCount).toBe(4);
    expect(result.trace.tiers).toMatchObject([
      { label: "SP1", pastedTickets: 2 },
      { label: "SP2", pastedTickets: 1 },
      { label: "SP3", pastedTickets: 1 },
      { label: "SP4", pastedTickets: 2 },
    ]);
  });
  it("flags weak all-full board signals without changing counts", () => {
    const result = normalized([
      tier("A", 1, { pastedCount: 1 }),
      tier("B", 2, { pastedCount: 2 }),
    ]);
    expect(result.trace.boardRisk).toEqual([
      expect.objectContaining({ code: "WEAK_FULL_BOARD_SIGNAL" }),
    ]);
    expect(mapped(result, "A").pastedTickets).toBe(1);
  });
  it("builds unchanged RecognitionContract 1.0.0", () => {
    const result = normalized([tier("A", 3, { openCount: 1 })]);
    const { contractVersion, ...response } = result.contract;
    expect(contractVersion).toBe("1.0.0");
    const exchange = {
      contractVersion,
      request: {
        requestId: request.requestId,
        imageRef: "cloud://test/recognition-temp/evidence.jpg",
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
