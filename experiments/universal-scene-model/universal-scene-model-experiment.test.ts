import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const experiment = require("./universal-scene-model-experiment.js");
const root = path.resolve(__dirname, "../..");
const groundTruth = JSON.parse(
  fs.readFileSync(path.join(__dirname, "ground-truth.json"), "utf8"),
);

describe("universal scene model A/B isolation", () => {
  it("freezes every provider control except prompt text", () => {
    expect(experiment.MODEL).toBe("qwen3.7-flash");
    expect(experiment.MODEL_MAX_PIXELS).toBe(6_291_456);
    expect(experiment.PROVIDER_SCHEMA_VERSION).toBe(
      "board-provider-extraction-4.0.0-rc1",
    );
    expect(experiment.productionPrompt).not.toBe(experiment.experimentalPrompt);
  });

  it("keeps the required physical facts and frozen v4 output semantics", () => {
    const prompt = experiment.experimentalPrompt;
    for (const required of [
      "Before assigning ticketPattern, first determine the physical structure of the complete tier.",
      "In the ticket-return area, black/dark ticket-shaped strips are pasted physical tickets, not empty slots.",
      "Orientation is layout, not ticket semantics.",
      "terminal fully visible elongated ticket",
      "全X種, 全X款",
      '"protocolVersion":"4.0.0-rc1"',
      "sequenceStart",
      "firstOpen",
      "pastedDirect",
      "Do not merge A1/A2 or D1/D2",
    ]) {
      expect(prompt).toContain(required);
    }
    expect(prompt).not.toContain("Every black object is a ticket");
    expect(prompt).not.toContain("tickets run from left to right");
  });

  it("keeps all ground truth outside both provider prompts", () => {
    for (const board of groundTruth) {
      for (const tier of board.tiers) {
        const triple = `${tier.total}/${tier.pasted}/${tier.total - tier.pasted}`;
        expect(experiment.productionPrompt).not.toContain(triple);
        expect(experiment.experimentalPrompt).not.toContain(triple);
      }
    }
    expect(experiment.experimentalPrompt).not.toContain("CHAPTER7");
    expect(experiment.experimentalPrompt).not.toContain("SNOW MIKU");
    expect(experiment.experimentalPrompt).not.toContain("Pokémon 30th");
  });

  it("binds the five benchmark manifest entries and exact board totals", () => {
    expect(groundTruth).toHaveLength(5);
    expect(
      groundTruth.map(({ caseId, filename, width, height }) => ({
        caseId,
        filename,
        width,
        height,
      })),
    ).toEqual([
      {
        caseId: "case-1-nikke",
        filename: "秋叶原2发捡漏nikke最终赏_1_All is well_来自小红书网页版.jpg",
        width: 1080,
        height: 1440,
      },
      {
        caseId: "case-2-pokemon",
        filename:
          "宝可梦30周年一番赏更新！_1_英俊的马铃薯_来自小红书网页版.jpg",
        width: 1080,
        height: 1920,
      },
      {
        caseId: "case-3-snow-miku",
        filename: "回归初心_1_YFW_来自小红书网页版.jpg",
        width: 1080,
        height: 1440,
      },
      {
        caseId: "case-4-attack-on-titan",
        filename:
          "谁懂！巨人一番赏来啦！_1_黑暗里舞动的少年_来自小红书网页版.jpg",
        width: 1080,
        height: 1460,
      },
      {
        caseId: "case-5-world-beyond",
        filename: "IMG_2329.JPG",
        width: 3002,
        height: 3353,
      },
    ]);
    const nikke = groundTruth[0];
    expect(
      nikke.tiers.reduce(
        (sum: number, tier: { total: number }) => sum + tier.total,
        0,
      ),
    ).toBe(80);
    expect(
      nikke.tiers.reduce(
        (sum: number, tier: { pasted: number }) => sum + tier.pasted,
        0,
      ),
    ).toBe(78);
    expect(
      fs.realpathSync(
        path.join(
          root,
          "data/recognition-contract/prompt/ichi-board-vlm-4.0.3-rc1.txt",
        ),
      ),
    ).not.toBe(
      fs.realpathSync(
        path.join(
          root,
          "data/recognition-contract/prompt/ichi-board-vlm-4.1.0-scene-exp.txt",
        ),
      ),
    );
  });
});
