import { drawPrize } from "./draw-session.js";
import {
  type LocalDrawDraft,
  type LocalDrawDraftRepository,
  type SystemDemoEnsureResult,
} from "./local-draw-drafts.js";
import {
  SYSTEM_DEMO_BOARD_ID,
  SYSTEM_DEMO_TUTORIAL_ID,
} from "./local-board-source.js";

export const createSystemDemoDraft = (now = Date.now()): LocalDrawDraft => {
  const capacities = [
    ["SP1", 1],
    ["A", 3],
    ["B", 3],
    ["C", 1],
    ["D", 12],
    ["E", 13],
    ["F", 20],
    ["G", 11],
    ["H", 11],
    ["I", 11],
  ] as const;
  const initial: LocalDrawDraft = {
    schemaVersion: "board-record-r2-1.0.0",
    source: "SYSTEM_DEMO",
    tutorialId: SYSTEM_DEMO_TUTORIAL_ID,
    boardId: SYSTEM_DEMO_BOARD_ID,
    savedAt: now,
    ipName: "新手引导",
    themeName: "教程体验版面",
    unitPrice: 69,
    recordType: "draw",
    submissionState: "local",
    verificationStatus: "unverified",
    uploadStatus: "not-uploaded",
    targetTiers: [],
    prizeData: capacities.map(([tier, count]) => ({
      id: `${SYSTEM_DEMO_BOARD_ID}:${tier}`,
      tier,
      rawLabel: `${tier}赏`,
      initialRemainingTickets: count,
      isGrandPrize: ["SP1", "A", "B", "C"].includes(tier),
    })),
    history: [],
    cost: 0,
    undoFloor: 0,
  };
  const first = drawPrize(initial, "D", 69, now);
  const second = drawPrize(first.draft, "C", 69, now);
  if (!first.ok || !second.ok) throw new Error("SYSTEM_DEMO_TEMPLATE_INVALID");
  return second.draft;
};

export const ensureSystemDemoDraft = (
  repository: LocalDrawDraftRepository,
): SystemDemoEnsureResult =>
  repository.ensureSystemDemoDraft(createSystemDemoDraft);
