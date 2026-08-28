import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

const root = path.resolve(
  import.meta.dirname,
  "../../../../data/recognition-contract",
);
const prompt = fs.readFileSync(
  path.join(root, "prompt/ichi-board-vlm-r1-visible-evidence-1.1.0.txt"),
  "utf8",
);
const h0Prompt = fs.readFileSync(
  path.join(root, "prompt/ichi-board-vlm-hybrid-semantic-1.0.0.txt"),
  "utf8",
);
const schemaText = fs.readFileSync(
  path.join(
    root,
    "schema/board-provider-r1-visible-evidence-1.1.0.schema.json",
  ),
  "utf8",
);
const schema = JSON.parse(schemaText);
const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
const historicalPrompt = fs.readFileSync(
  path.join(root, "prompt/ichi-board-vlm-r1-visible-evidence-1.0.0.txt"),
);
const historicalSchema = fs.readFileSync(
  path.join(
    root,
    "schema/board-provider-r1-visible-evidence-1.0.0.schema.json",
  ),
);

describe("R1 Provider contract freeze gates", () => {
  it("keeps the frozen H0 prompt byte-identical", () => {
    expect(crypto.createHash("sha256").update(h0Prompt).digest("hex")).toBe(
      "0b4e572378fad8e445f63c6b67997415a1099a0c4ae4d968a6182b545b22226b",
    );
  });

  it("keeps historical R1 1.0 byte-identical and freezes R1.1", () => {
    expect(
      crypto.createHash("sha256").update(historicalPrompt).digest("hex"),
    ).toBe("9abd4aa230b81239b41d4861d5c8deb2a2e73dbaed6211ab9ed930264e1ba859");
    expect(
      crypto.createHash("sha256").update(historicalSchema).digest("hex"),
    ).toBe("5c4822c081ecc71a66ddbbeee5819b414af63b97b315aff49f7e4a4557e3eeac");
    expect(crypto.createHash("sha256").update(prompt).digest("hex")).toBe(
      "756adbef6e563fc55aec15ea05c8933ce50496055ce267c026e8b2f6f025283e",
    );
    expect(crypto.createHash("sha256").update(schemaText).digest("hex")).toBe(
      "387cf2fcf3d549d88a71a3f74b3337d172993ac8f1ec6f5dc2086719cfa325d2",
    );
  });

  it("contains only visible-evidence fields and forbids canonical reasoning fields", () => {
    const schemaText = JSON.stringify(schema);
    for (const required of [
      "tierCode",
      "visibleNumberRuns",
      "totalTicketsObserved",
      "pastedTicketsObserved",
    ])
      expect(schemaText).toContain(required);
    for (const forbidden of [
      'totalTickets"',
      'pastedTickets"',
      "remainingTickets",
      "direction",
      "countMode",
      "sequenceType",
      "confidence",
      "observationComplete",
      "fullyCovered",
      "allPasted",
      "soldOut",
      "remainingLabel",
      "stateEvidence",
      "ticketPattern",
    ])
      expect(schemaText).not.toContain(forbidden);
    for (const forbidden of [
      "remainingTickets",
      "countMode",
      "sequenceType",
      "observationComplete",
      "fullyCovered",
      "allPasted",
      "soldOut",
      "remainingLabel",
      "stateEvidence",
      "ticketPattern",
    ])
      expect(prompt).not.toContain(forbidden);
  });

  it("accepts null-valued occurrences and rejects extra canonical fields", () => {
    const valid = {
      ipName: null,
      ipRawText: null,
      themeName: null,
      price: null,
      tiers: [
        {
          tierCode: "A1",
          rawLabel: "A1賞",
          prizeName: null,
          visibleNumberRuns: [[{ value: null, rawText: "?" }]],
          totalTicketsObserved: null,
          pastedTicketsObserved: 0,
        },
      ],
    };
    expect(validate(valid)).toBe(true);
    expect(validate({ ...valid, remainingTickets: 0 })).toBe(false);
  });

  it("enforces the exact nested run and required-field boundary", () => {
    const tier = {
      tierCode: "A",
      rawLabel: null,
      prizeName: null,
      visibleNumberRuns: [],
      totalTicketsObserved: null,
      pastedTicketsObserved: null,
    };
    const rootValue = {
      ipName: null,
      ipRawText: null,
      themeName: null,
      price: null,
      tiers: [tier],
    };
    expect(validate(rootValue)).toBe(true);
    expect(
      validate({
        ...rootValue,
        tiers: [
          {
            ...tier,
            visibleNumberRuns: [[{ value: null, rawText: null }]],
          },
        ],
      }),
    ).toBe(true);
    expect(
      validate({
        ...rootValue,
        tiers: [{ ...tier, visibleNumberRuns: [[]] }],
      }),
    ).toBe(false);
    const missingRoot = { ...rootValue } as Partial<typeof rootValue>;
    delete missingRoot.price;
    expect(validate(missingRoot)).toBe(false);
    const missingTier = { ...tier } as Partial<typeof tier>;
    delete missingTier.rawLabel;
    expect(validate({ ...rootValue, tiers: [missingTier] })).toBe(false);
    expect(validate({ ...rootValue, extra: true })).toBe(false);
  });
});
