import { createHash } from "node:crypto";

/** Schema/API rehearsal only: pure plan, no SDK, no DB reader/writer or ingestion. */
export const planHistoricalVersion = (state, input) => {
  if (
    input.origin !== "AUTHORITATIVE_PLAYER" ||
    input.lifecycleState !== "CURRENT" ||
    input.verification !== "VERIFIED" ||
    input.shareIntent !== "SHARE" ||
    input.authorizationApplicable !== true ||
    input.rightsEligible !== true ||
    !["DRAW_RECORD", "UPLOAD_RECORD"].includes(input.recordType)
  )
    return {
      status: "INELIGIBLE_NO_WRITE",
      nextState: state,
      plannedWrites: [],
    };
  const hash = (v) => createHash("sha256").update(v).digest("hex");
  const lineageId = hash(`lineage\0${input.privateSourceIdentity}`);
  const observationVersionId = hash(
    `observation\0${lineageId}\0${input.exactSourceVersion}`,
  );
  const contributionId = hash(`contribution\0${lineageId}`);
  if (state.tombstones?.[lineageId])
    return {
      status: "TOMBSTONED_NO_WRITE",
      nextState: state,
      plannedWrites: [],
    };
  if (state.observations?.[observationVersionId])
    return {
      status: "IDEMPOTENT_NO_WRITE",
      nextState: state,
      plannedWrites: [],
    };
  const nextState = structuredClone(state);
  nextState.observations[observationVersionId] = {
    lineageId,
    exactSourceVersion: input.exactSourceVersion,
  };
  nextState.contributions[contributionId] = { lineageId, observationVersionId };
  return {
    status: "PLAN_ONLY",
    observationVersionId,
    lineageId,
    contributionId,
    nextState,
    plannedWrites: [
      { collection: "boardObservations", id: observationVersionId },
      { collection: "mapContributions", id: contributionId },
    ],
  };
};
