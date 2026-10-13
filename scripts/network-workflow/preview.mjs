import fs from "node:fs";
import { verifyBoard } from "../../packages/v2-map/src/verification.js";
import { evaluateOpportunity } from "../../packages/v2-map/src/opportunity.js";
import { evaluateFreshness } from "../../packages/v2-map/src/projector.js";
import { networkTime } from "../../packages/v2-map/resources/production/phase3/network.mjs";
import { binding } from "./workflow.mjs";

const proposal = JSON.parse(
  fs.readFileSync(
    new URL(
      "../../packages/v2-map/resources/production/cloudbase-production-resource-proposal.json",
      import.meta.url,
    ),
  ),
);
const initial = proposal.initialControlRows.find(
  (r) => r._id === "global:policy",
);
export const preview = (c, policy = initial, nowMs = Date.now()) => {
  const time = networkTime(c.record),
    id = binding(c),
    at = new Date(nowMs).toISOString();
  if (!time) return { pending: true };
  const verified = verifyBoard(
    {
      verificationInputOnly: true,
      observationVersionId: id,
      observedAt: time.observedAt,
      boardFacts: c.record.boardFacts,
      provenance: {
        sourceType: "NETWORK_SOURCE",
        sourceMode: "OFFICIAL_CURATED",
        sourcePlatform: "XHS",
        sourceVersion: c.record.sourceVersion,
      },
    },
    {
      expectedObservationVersionId: id,
      currentObservationVersionId: id,
      verifiedBoardId: id,
      verifiedBoardVersion: id,
      verificationId: id,
      policyVersion: policy.verificationVersion,
      verifiedAt: at,
    },
  );
  if (!verified.ok) return { pending: true };
  const opportunity = evaluateOpportunity(
    verified.value,
    {
      currentVerifiedBoardVersion: id,
      evaluationId: id,
      evaluationVersion: "local-preview-only",
      evaluatedAt: at,
    },
    policy.opportunity,
  );
  return {
    previewOnly: true,
    opportunity: opportunity.ok ? opportunity.value.reasonCodes : [],
    freshness: evaluateFreshness(time.observedAt, at, policy.freshness),
    publicUntil: time.publicUntil,
  };
};
