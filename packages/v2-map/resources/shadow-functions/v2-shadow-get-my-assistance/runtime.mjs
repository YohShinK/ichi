import { listData, readDoc } from "../shared/db.mjs";
import { deriveTrustedCaller } from "../shared/security.mjs";

const fail = (code) => ({ ok: false, code });
const toCard = (facts) => {
  if (
    !facts ||
    typeof facts.ipName !== "string" ||
    !Array.isArray(facts.tiers)
  ) {
    return null;
  }
  return {
    ipName: facts.ipName,
    themeName: typeof facts.themeName === "string" ? facts.themeName : null,
    tiers: facts.tiers.slice(0, 20).map((tier) => ({
      tierCode: String(tier.tierCode || ""),
      displayLabel: typeof tier.rawLabel === "string" ? tier.rawLabel : null,
      remainingTickets:
        tier.remainingTickets === null ||
        (Number.isSafeInteger(tier.remainingTickets) &&
          tier.remainingTickets >= 0)
          ? tier.remainingTickets
          : null,
    })),
  };
};

export const createMain =
  ({ cloud, env, now = Date.now }) =>
  async () => {
    if (
      env.ICHI_V2_SHADOW_BOUNDARY !== "synthetic_only" ||
      env.ICHI_V2_SHADOW_HUMAN_ASSISTANCE_ENABLED !== "true"
    ) {
      return fail("SHADOW_ASSISTANCE_DISABLED");
    }
    const caller = deriveTrustedCaller(cloud, env);
    if (!caller.ok) return caller;
    const db = cloud.database();
    const pause = await readDoc(
      db.collection("v2ShadowControlState"),
      "global:ha-pause",
    );
    if (pause?.paused !== false) return fail("SHADOW_ASSISTANCE_UNAVAILABLE");
    const requests = listData(
      await db
        .collection("v2ShadowHumanAssistanceRequests")
        .where({ ownerSubjectDigest: caller.digest, state: "PENDING" })
        .limit(20)
        .get(),
    );
    const actionable = [];
    for (const request of requests) {
      if (
        request.dataOrigin !== "SYNTHETIC_REHEARSAL" ||
        Date.parse(request.expiresAt) <= now() ||
        !Array.isArray(request.candidateIds) ||
        typeof request.requestId !== "string" ||
        typeof request.observationVersionId !== "string" ||
        typeof request.candidateRecordRef !== "string" ||
        !/^candidate:[a-f0-9]{40}$/u.test(request.candidateRecordRef) ||
        typeof request.observationVersion !== "string" ||
        request.observationVersion.length === 0 ||
        request.observationVersion.length > 128
      ) {
        continue;
      }
      const current = listData(
        await db
          .collection("v2ShadowSourceFixtures")
          .where({
            observationVersionId: request.observationVersionId,
            ownerSubjectDigest: caller.digest,
            dataOrigin: "SYNTHETIC_REHEARSAL",
          })
          .limit(1)
          .get(),
      )[0];
      const upload = await readDoc(
        db.collection("v2ShadowCandidateUploads"),
        request.candidateRecordRef,
      );
      const comparison = await readDoc(
        db.collection("v2ShadowSourceFixtures"),
        `fixture:${request.comparisonFixtureId || ""}`,
      );
      if (
        current?.lifecycleState !== "CURRENT" ||
        current.currentObservationVersionId !== request.observationVersionId ||
        current.verifiedBoardVersion !== request.observationVersion ||
        upload?.ownerSubjectDigest !== caller.digest ||
        upload.observationVersionId !== request.observationVersionId ||
        upload.observationVersion !== request.observationVersion ||
        upload.lifecycle !== "ACTIVE" ||
        upload.dataOrigin !== "SYNTHETIC_REHEARSAL" ||
        comparison?.lifecycleState !== "CURRENT" ||
        comparison.dataOrigin !== "SYNTHETIC_REHEARSAL"
      ) {
        continue;
      }
      const currentCard = toCard(
        current.publication?.sourcePath === "assisted-draw"
          ? current.submission?.finalSnapshot
          : current.publication?.finalSnapshot,
      );
      const comparisonCard = toCard(
        comparison.publication?.sourcePath === "assisted-draw"
          ? comparison.submission?.finalSnapshot
          : comparison.publication?.finalSnapshot,
      );
      if (!currentCard || !comparisonCard) continue;
      actionable.push({
        requestId: request.requestId,
        candidateRecordRef: request.candidateRecordRef,
        observationVersion: request.observationVersion,
        expiresAt: request.expiresAt,
        currentCard,
        comparisonCard,
      });
    }
    return { ok: true, data: actionable };
  };
