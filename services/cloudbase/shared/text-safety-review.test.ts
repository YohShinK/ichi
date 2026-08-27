import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const {
  TEXT_SAFETY_USAGE,
  reviewTextSafety,
} = require("./text-safety-review.js");

describe("shared text safety review", () => {
  it.each([
    [TEXT_SAFETY_USAGE.PROFILE_NICKNAME, 1],
    [TEXT_SAFETY_USAGE.MAP_NOTE, 2],
  ])("maps %s to its fixed server-side scene", async (usage, scene) => {
    const reviewer = vi.fn(async () => ({ result: { suggest: "pass" } }));
    await expect(
      reviewTextSafety({
        cloud: {},
        usage,
        content: "用户原文",
        openId: "trusted-openid",
        reviewer,
      }),
    ).resolves.toEqual({ passed: true });
    expect(reviewer).toHaveBeenCalledWith({
      content: "用户原文",
      version: 2,
      scene,
      openid: "trusted-openid",
    });
  });

  it("rejects unknown usage without invoking OpenAPI or choosing a fallback scene", async () => {
    const reviewer = vi.fn();
    await expect(
      reviewTextSafety({
        cloud: {},
        usage: "CLIENT_SCENE_1",
        content: "用户原文",
        openId: "trusted-openid",
        reviewer,
      }),
    ).resolves.toEqual({ passed: false });
    expect(reviewer).not.toHaveBeenCalled();
  });

  it.each(["risky", "review", "reject", "unknown", ""])(
    "fails closed for suggest=%j",
    async (suggest) => {
      await expect(
        reviewTextSafety({
          cloud: {},
          usage: TEXT_SAFETY_USAGE.MAP_NOTE,
          content: "用户原文",
          openId: "trusted-openid",
          reviewer: async () => ({ result: { suggest } }),
        }),
      ).resolves.toEqual({ passed: false });
    },
  );

  it.each([
    ["API error", async () => Promise.reject(new Error("unavailable"))],
    ["timeout", async () => Promise.reject(new Error("timeout"))],
    ["malformed response", async () => ({ unexpected: true })],
  ])("fails closed for %s", async (_label, reviewer) => {
    await expect(
      reviewTextSafety({
        cloud: {},
        usage: TEXT_SAFETY_USAGE.PROFILE_NICKNAME,
        content: "用户原文",
        openId: "trusted-openid",
        reviewer,
      }),
    ).resolves.toEqual({ passed: false });
  });

  it("does not accept client scene input as a usage", async () => {
    const reviewer = vi.fn();
    await expect(
      reviewTextSafety({
        cloud: {},
        usage: 1,
        scene: 2,
        content: "用户原文",
        openId: "trusted-openid",
        reviewer,
      }),
    ).resolves.toEqual({ passed: false });
    expect(reviewer).not.toHaveBeenCalled();
  });

  it("is the only production msgSecCheck implementation used by nickname and MAP_NOTE", () => {
    const helper = readFileSync(
      "services/cloudbase/shared/text-safety-review.js",
      "utf8",
    );
    const profileRuntime = readFileSync(
      "services/cloudbase/shared/runtime.js",
      "utf8",
    );
    const mapNoteRuntime = readFileSync(
      "services/cloudbase/functions/verify-prize-tickets/index.js",
      "utf8",
    );
    expect(helper.match(/msgSecCheck/gu)).toHaveLength(1);
    expect(profileRuntime).toContain("reviewTextSafety");
    expect(mapNoteRuntime).toContain("reviewTextSafety");
    expect(profileRuntime).not.toContain("msgSecCheck");
    expect(mapNoteRuntime).not.toContain("msgSecCheck");
  });

  it.each([
    [
      "data/recognition-contract/prompt/ichi-board-vlm-r2-direct-remaining-1.0.0.txt",
      "c083066c80999722a2e3207f64654c598e418daf1c51dba35d57abf0291a3462",
    ],
    [
      "data/recognition-contract/schema/board-provider-r2-direct-remaining-1.0.0.schema.json",
      "178c3fffb9ad74257ad6fb0123509beacbd011225eae2aa7eb2d648beb690722",
    ],
    [
      "services/cloudbase/functions/recognize-board/r2-direct-remaining-resolver.js",
      "46ffebadc3094412c4beb9c8625acdf83346b496e382fe40a48083ff101411d8",
    ],
  ])("keeps frozen R2 artifact %s byte-identical", (file, expectedHash) => {
    const actualHash = createHash("sha256")
      .update(readFileSync(file))
      .digest("hex");
    expect(actualHash).toBe(expectedHash);
  });
});
