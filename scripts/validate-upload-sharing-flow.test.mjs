import { describe, expect, it } from "vitest";
import {
  auditUploadSharingFlow,
  SHARING_CONTRACT,
  SHARING_CONTRACT_PATH,
  V2_ADMISSION_PROMISE,
  V1_ACCOUNT_CONSENT_PROMISE,
  validateUploadSharingFlow,
} from "./validate-upload-sharing-flow.mjs";
const baseline = () =>
  new Map([
    ...[
      "AGENTS.md",
      "README.md",
      "PRD.md",
      ...[
        "architecture",
        "design-document",
        "tech-stack",
        "implementation-plan",
        "progress",
      ].map((name) => `memory-bank/${name}.md`),
    ].map((file) => [
      file,
      `# Current\n\n${SHARING_CONTRACT} ${SHARING_CONTRACT_PATH} ${V2_ADMISSION_PROMISE} ${V1_ACCOUNT_CONSENT_PROMISE}\n\n## History\n历史曾有地图分享选择`,
    ]),
    [SHARING_CONTRACT_PATH, SHARING_CONTRACT],
  ]);
describe("approved upload sharing cannot regress to an extra publication step", () => {
  it("validates the actual worktree current sources and client", () => {
    expect(validateUploadSharingFlow()).toEqual([]);
  });
  it("allows historical citations and negative tests without making them product controls", () => {
    const files = baseline();
    files.set(
      "apps/client/miniprogram/pages/home/index.behavior.test.ts",
      "地图分享选择",
    );
    expect(auditUploadSharingFlow(files)).toEqual([]);
  });
  it.each([
    "地图分享选择",
    "我确认有权分享，并分享至地图",
    "map-source-choice",
    "onOpenMapSourceChoice",
    "onChooseMapSourceShare",
    "setInitialChoice(",
    "manage-map-player-source",
    "SET_INITIAL_CHOICE",
  ])(
    "rejects an obsolete entry reintroduced into any production client file: %s",
    (token) => {
      const files = baseline();
      files.set("apps/client/miniprogram/pages/new-page/index.wxml", token);
      expect(auditUploadSharingFlow(files)).toHaveLength(1);
    },
  );
  it("rejects a current source which only cites the rule in old history", () => {
    const files = baseline();
    files.set(
      "memory-bank/progress.md",
      `# Current\n\n## History\n${SHARING_CONTRACT} ${SHARING_CONTRACT_PATH}`,
    );
    expect(auditUploadSharingFlow(files)).toHaveLength(1);
  });
  it("rejects replacing automatic V2 display with a later review in global guidance", () => {
    const files = baseline();
    files.set(
      "AGENTS.md",
      files
        .get("AGENTS.md")
        .replace(V2_ADMISSION_PROMISE, "V2入库后等待再次批准"),
    );
    expect(auditUploadSharingFlow(files)).toHaveLength(1);
  });
  it("rejects restoring a production worker without atomic admission", () => {
    const files = baseline();
    files.set(
      "packages/v2-map/resources/production/phase2/runtime.mjs",
      "old stage worker",
    );
    expect(auditUploadSharingFlow(files)).toHaveLength(1);
  });
  it("rejects restoring a device-proof requirement for prior completed V1 uploads", () => {
    const files = baseline();
    files.set(
      "AGENTS.md",
      files
        .get("AGENTS.md")
        .replace(V1_ACCOUNT_CONSENT_PROMISE, "旧版已上传仍需原手机再次授权"),
    );
    expect(auditUploadSharingFlow(files)).toHaveLength(1);
  });
});
