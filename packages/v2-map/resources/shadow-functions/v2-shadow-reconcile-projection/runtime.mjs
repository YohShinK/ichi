import { randomBytes } from "node:crypto";

import {
  buildPublicCandidate,
  reconcilePublicMapLead,
} from "../../../src/projector.js";
import { evaluateOpportunity } from "../../../src/opportunity.js";
import { currentOpportunityPolicy } from "../shared/opportunity-policy.mjs";
import { projectContributions } from "../../../src/contribution-projection.js";
import { fixedId, listData, readDoc } from "../shared/db.mjs";
import {
  consumeShadowCapabilityNonce,
  verifyRehearsalCapability,
} from "../shared/security.mjs";
import { hashId, verifiedFromFixture } from "../shared/verified-fixture.mjs";
import { contributionEligible } from "../shared/contribution-ledger.mjs";
import {
  consentDocumentId,
  currentConsentPolicy,
} from "../shared/map-contribution-consent.mjs";

const FUNCTION_NAME = "v2-shadow-reconcile-projection";
const fail = (code) => ({ ok: false, code });
const leadDocId = (id, version) => `lead:${id}:${version}`;

const publicLocation = (value) => {
  if (value === null) return null;
  if (
    value?.coordinateSystem !== "GCJ02" ||
    !Number.isFinite(value.latitude) ||
    !Number.isFinite(value.longitude) ||
    !["EXACT", "APPROXIMATE", "AREA"].includes(value.precisionMode)
  ) {
    return null;
  }
  return {
    coordinateSystem: "GCJ02",
    latitude: value.latitude,
    longitude: value.longitude,
    precisionMode: value.precisionMode,
    areaLabel: typeof value.areaLabel === "string" ? value.areaLabel : null,
    locationPolicyVersion: String(value.locationPolicyVersion || ""),
    projectionRuleId: String(value.projectionRuleId || ""),
  };
};

const candidateFromFixture = (
  fixture,
  boardInstanceId,
  contributionView,
  policy,
  now,
) => {
  const verified = verifiedFromFixture(fixture);
  if (!verified.ok || !fixture.publicGates) return null;
  const evaluation = evaluateOpportunity(
    verified.value,
    {
      currentVerifiedBoardVersion: fixture.verifiedBoardVersion,
      evaluationId: hashId(
        "opportunity",
        `${fixture.observationVersionId}:${policy.policyVersion}`,
      ),
      evaluationVersion: `${fixture.verifiedBoardVersion}:${policy.policyVersion}`,
      evaluatedAt: new Date(now).toISOString(),
    },
    policy,
  );
  if (!evaluation.ok) return null;
  const gates = fixture.publicGates;
  const built = buildPublicCandidate({
    candidateId: hashId("candidate", fixture.observationVersionId),
    boardInstanceId,
    currentVerifiedBoardVersion: fixture.verifiedBoardVersion,
    verifiedBoard: verified.value,
    opportunityEvaluation: evaluation.value,
    boardShortLabel: String(fixture.publicBoardShortLabel || "").slice(0, 64),
    freshnessPolicyVersion: String(fixture.freshnessPolicyVersion || ""),
    publicLocation: publicLocation(fixture.publicLocation),
    contributor: null,
    contributors: contributionView.contributors,
    venueNote: contributionView.venueNote,
    gates: {
      sourceCurrent: gates.sourceCurrent === true,
      authorizationApplicable: contributionView.support.length > 0,
      rightsEligible: gates.rightsEligible === true,
      publicEligible: gates.publicEligible === true,
      moderationVisible: gates.moderationVisible === true,
      deleted: gates.deleted === true,
    },
  });
  return built.ok ? built.value : null;
};

const publicSafeRow = (core, db, lifecycleState) => ({
  publicLeadId: core.publicLeadId,
  servedVersion: core.servedVersion,
  projectionVersion: core.projectionVersion,
  policyVersion: core.policyVersion,
  lifecycleState,
  visibility: core.visibility,
  publicLocation: core.publicLocation
    ? {
        coordinateSystem: "GCJ02",
        latitude: core.publicLocation.latitude,
        longitude: core.publicLocation.longitude,
        precisionMode: core.publicLocation.precisionMode,
        areaLabel: core.publicLocation.areaLabel,
        locationPolicyVersion: core.publicLocation.locationPolicyVersion,
        projectionRuleId: core.publicLocation.projectionRuleId,
        point: new db.Geo.Point(
          core.publicLocation.longitude,
          core.publicLocation.latitude,
        ),
      }
    : null,
  boardShortLabel: core.boardShortLabel,
  board: core.board,
  recordType: core.recordType,
  opportunity: core.opportunity,
  observedAt: core.observedAt,
  freshnessPolicyVersion: core.freshnessPolicyVersion,
  venueNote: core.venueNote,
  contributor: core.contributor,
  contributors: core.contributors ?? [],
  sourceLabel: core.sourceLabel,
  disclosures: core.disclosures,
  retiredAt: core.retiredAt,
  dataOrigin: "SYNTHETIC_REHEARSAL",
});

const coreFromRow = (row) => ({
  publicLeadId: row.publicLeadId,
  servedVersion: row.servedVersion,
  projectionVersion: row.projectionVersion,
  policyVersion: row.policyVersion,
  visibility: row.visibility,
  publicLocation: row.publicLocation
    ? {
        coordinateSystem: row.publicLocation.coordinateSystem,
        latitude: row.publicLocation.latitude,
        longitude: row.publicLocation.longitude,
        precisionMode: row.publicLocation.precisionMode,
        areaLabel: row.publicLocation.areaLabel,
        locationPolicyVersion: row.publicLocation.locationPolicyVersion,
        projectionRuleId: row.publicLocation.projectionRuleId,
      }
    : null,
  boardShortLabel: row.boardShortLabel,
  board: row.board,
  recordType: row.recordType,
  opportunity: row.opportunity,
  observedAt: row.observedAt,
  freshnessPolicyVersion: row.freshnessPolicyVersion,
  venueNote: row.venueNote,
  contributor: row.contributor,
  contributors: Array.isArray(row.contributors) ? row.contributors : [],
  sourceLabel: row.sourceLabel,
  disclosures: row.disclosures,
  retiredAt: row.retiredAt,
});

const scheduleRetry = async (db, outboxId, nowMs) => {
  try {
    await db.runTransaction(async (tx) => {
      const prior = await readDoc(
        tx.collection("v2ShadowProjectionOutbox"),
        outboxId,
      );
      if (
        !prior ||
        prior.status === "APPLIED" ||
        prior.status === "DISCARDED"
      ) {
        return;
      }
      const attempts = Number(prior.attempts || 0) + 1;
      await tx
        .collection("v2ShadowProjectionOutbox")
        .doc(outboxId)
        .set({
          data: {
            ...prior,
            status: "RETRY",
            attempts,
            nextAttemptAt: new Date(
              nowMs + Math.min(60_000, 1000 * 2 ** Math.min(attempts, 6)),
            ).toISOString(),
          },
        });
    });
    return { ok: false, code: "PROJECTOR_RETRY_SCHEDULED" };
  } catch {
    return fail("PROJECTOR_UNAVAILABLE");
  }
};

export const createMain =
  ({
    cloud,
    env,
    now = Date.now,
    newLeadId = () => randomBytes(16).toString("hex"),
  }) =>
  async (event = {}) => {
    if (
      env.ICHI_V2_SHADOW_BOUNDARY !== "synthetic_only" ||
      env.ICHI_V2_SHADOW_PROJECTOR_ENABLED !== "true" ||
      env.ICHI_V2_SHADOW_CONSENT_ENABLED !== "true" ||
      !currentConsentPolicy(env)
    ) {
      return fail("SHADOW_PROJECTOR_DISABLED");
    }
    const opportunityPolicy = currentOpportunityPolicy(env);
    if (!opportunityPolicy) return fail("OPPORTUNITY_POLICY_INVALID");
    const db = cloud.database();
    const capability = await verifyRehearsalCapability(
      event.capability,
      "reconcile-projection",
      FUNCTION_NAME,
      env.ICHI_V2_SHADOW_REHEARSAL_HMAC_KEY,
      (id, expiry) => consumeShadowCapabilityNonce(db, id, expiry),
      now(),
    );
    if (!capability.ok) return capability;
    const outboxId = event.outboxId;
    if (
      typeof outboxId !== "string" ||
      !/^outbox:[a-f0-9]{40}$/u.test(outboxId) ||
      capability.payload.outboxId !== outboxId
    ) {
      return fail("OUTBOX_REQUIRED");
    }
    try {
      return await db.runTransaction(async (tx) => {
        const outbox = await readDoc(
          tx.collection("v2ShadowProjectionOutbox"),
          outboxId,
        );
        if (!outbox || outbox.dataOrigin !== "SYNTHETIC_REHEARSAL") {
          return fail("OUTBOX_UNAVAILABLE");
        }
        if (outbox.status === "APPLIED" || outbox.status === "DISCARDED") {
          return { ok: true, status: outbox.status, duplicate: true };
        }
        if (Date.parse(outbox.nextAttemptAt) > now()) {
          return fail("OUTBOX_NOT_DUE");
        }
        const instance = await readDoc(
          tx.collection("v2ShadowBoardInstances"),
          outbox.boardInstanceId,
        );
        if (!instance || instance.dataOrigin !== "SYNTHETIC_REHEARSAL") {
          return fail("INSTANCE_UNAVAILABLE");
        }
        if (
          outbox.eventSequence >
          Number(instance.lastAppliedEventSequence || 0) + 1
        ) {
          return fail("EVENT_GAP");
        }
        if (
          outbox.eventSequence <= Number(instance.lastAppliedEventSequence || 0)
        ) {
          await tx
            .collection("v2ShadowProjectionOutbox")
            .doc(outboxId)
            .set({
              data: { ...outbox, status: "DISCARDED" },
            });
          return { ok: true, status: "LATE_EVENT_DISCARDED" };
        }
        if (instance.moderationThresholdHidden === true) {
          await tx
            .collection("v2ShadowBoardInstances")
            .doc(instance.boardInstanceId)
            .set({
              data: {
                ...instance,
                lastAppliedEventSequence: outbox.eventSequence,
              },
            });
          await tx
            .collection("v2ShadowProjectionOutbox")
            .doc(outboxId)
            .set({
              data: {
                ...outbox,
                status: "APPLIED",
                appliedAt: new Date(now()).toISOString(),
              },
            });
          return { ok: true, status: "APPLIED", effect: "MODERATION_HIDDEN" };
        }
        const rows = listData(
          await tx
            .collection("v2ShadowContributionLedger")
            .where({
              boardInstanceId: instance.boardInstanceId,
              kind: "STATE",
              dataOrigin: "SYNTHETIC_REHEARSAL",
            })
            .limit(50)
            .get(),
        );
        if (rows.length >= 50) return fail("CONTRIBUTION_SET_TRUNCATED");
        const eligibleRows = [];
        for (const row of rows) {
          if (row.kind !== "STATE" || row.lifecycle !== "ACTIVE") continue;
          const source = await readDoc(
            tx.collection("v2ShadowSourceFixtures"),
            fixedId("fixture", row.fixtureId),
          );
          const upload = await readDoc(
            tx.collection("v2ShadowCandidateUploads"),
            row.candidateRecordRef,
          );
          const consent = await readDoc(
            tx.collection("v2ShadowMapContributionConsent"),
            consentDocumentId(row.ownerSubjectDigest),
          );
          if (
            source?.ownerSubjectDigest !== row.ownerSubjectDigest ||
            source.currentObservationVersionId !== row.observationVersionId ||
            upload?.ownerSubjectDigest !== row.ownerSubjectDigest ||
            upload.observationVersionId !== row.observationVersionId ||
            upload.observationVersion !== row.observationVersion ||
            upload.candidateRecordRef !== row.candidateRecordRef ||
            !contributionEligible(
              source,
              upload,
              consent,
              currentConsentPolicy(env),
            )
          )
            continue;
          eligibleRows.push(row);
        }
        const contributionView = projectContributions(
          instance.boardInstanceId,
          eligibleRows,
        );
        const currentSupport = contributionView.support[0] ?? null;
        const fixture = currentSupport
          ? await readDoc(
              tx.collection("v2ShadowSourceFixtures"),
              fixedId("fixture", currentSupport.fixtureId),
            )
          : null;
        const associationHead = await readDoc(
          tx.collection("v2ShadowControlState"),
          hashId(
            "association-head",
            currentSupport?.observationVersionId || outbox.observationVersionId,
          ),
        );
        const association = associationHead?.decisionId
          ? await readDoc(
              tx.collection("v2ShadowAssociationDecisions"),
              associationHead.decisionId,
            )
          : null;
        const supported =
          instance.moderationThresholdHidden !== true &&
          fixture?.dataOrigin === "SYNTHETIC_REHEARSAL" &&
          fixture.lifecycleState === "CURRENT" &&
          instance.lifecycleState === "ACTIVE" &&
          association?.boardInstanceId === instance.boardInstanceId &&
          fixture.currentObservationVersionId ===
            currentSupport?.observationVersionId;
        const candidate = supported
          ? candidateFromFixture(
              fixture,
              instance.boardInstanceId,
              contributionView,
              opportunityPolicy,
              now(),
            )
          : null;
        const priorLead = instance.activePublicLeadId
          ? await readDoc(
              tx.collection("v2ShadowPublicMapLeads"),
              leadDocId(
                instance.activePublicLeadId,
                instance.activeServedVersion,
              ),
            )
          : null;
        if (instance.activePublicLeadId && !priorLead) {
          return fail("ACTIVE_LEAD_MISSING");
        }
        const projectorState = {
          instances: {
            [instance.boardInstanceId]: {
              lastEventSequence: Number(instance.lastAppliedEventSequence || 0),
              activePublicLeadId: instance.activePublicLeadId || null,
              currentSupportObservationVersionId:
                instance.currentSupportObservationVersionId || null,
            },
          },
          leads: priorLead
            ? { [priorLead.publicLeadId]: coreFromRow(priorLead) }
            : {},
          retiredIds: {},
        };
        const result = reconcilePublicMapLead(
          projectorState,
          {
            boardInstanceId: instance.boardInstanceId,
            eventSequence: outbox.eventSequence,
            reconciledAt: new Date(now()).toISOString(),
            eligibleCandidates: candidate ? [candidate] : [],
            projectionVersion: "v2-19-shadow-r1",
            policyVersion: "v2-19-synthetic-projection",
          },
          newLeadId,
        );
        const nextInstance = result.state.instances[instance.boardInstanceId];
        const nextLead = result.publicLeadId
          ? result.state.leads[result.publicLeadId]
          : null;
        if (result.effect === "CREATED" && result.publicLeadId) {
          const collision = await readDoc(
            tx.collection("v2ShadowPublicMapLeads"),
            leadDocId(result.publicLeadId, 1),
          );
          if (collision) return fail("PUBLIC_LEAD_ID_COLLISION");
        }
        if (priorLead && result.effect !== "NO_PUBLIC_SUPPORT") {
          await tx
            .collection("v2ShadowPublicMapLeads")
            .doc(leadDocId(priorLead.publicLeadId, priorLead.servedVersion))
            .set({ data: { ...priorLead, lifecycleState: "HIDDEN" } });
        }
        if (nextLead && result.effect !== "NO_PUBLIC_SUPPORT") {
          await tx
            .collection("v2ShadowPublicMapLeads")
            .doc(leadDocId(nextLead.publicLeadId, nextLead.servedVersion))
            .set({
              data: publicSafeRow(
                nextLead,
                db,
                nextLead.visibility === "VISIBLE" ? "PUBLIC" : "RETIRED",
              ),
            });
        }
        if (result.effect === "RETIRED") {
          const epochId = "global:read-epoch";
          const epoch = await readDoc(
            tx.collection("v2ShadowControlState"),
            epochId,
          );
          await tx
            .collection("v2ShadowControlState")
            .doc(epochId)
            .set({
              data: {
                kind: "READ_EPOCH",
                subjectDigest: "global",
                windowKey: "current",
                epoch: Number(epoch?.epoch || 0) + 1,
                dataOrigin: "SYNTHETIC_REHEARSAL",
              },
            });
        }
        await tx
          .collection("v2ShadowBoardInstances")
          .doc(instance.boardInstanceId)
          .set({
            data: {
              ...instance,
              lastAppliedEventSequence: outbox.eventSequence,
              activePublicLeadId: nextInstance.activePublicLeadId,
              activeServedVersion:
                nextInstance.activePublicLeadId && nextLead
                  ? nextLead.servedVersion
                  : 0,
              currentSupportObservationVersionId:
                nextInstance.currentSupportObservationVersionId,
            },
          });
        await tx
          .collection("v2ShadowProjectionOutbox")
          .doc(outboxId)
          .set({
            data: {
              ...outbox,
              status: "APPLIED",
              appliedAt: new Date(now()).toISOString(),
            },
          });
        return { ok: true, status: "APPLIED", effect: result.effect };
      });
    } catch {
      return scheduleRetry(db, outboxId, now());
    }
  };
