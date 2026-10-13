import { resolveBoardInstance } from "../../../src/board-instance.js";
import { fixedId, listData, positiveInteger, readDoc } from "../shared/db.mjs";
import {
  consumeShadowCapabilityNonce,
  verifyRehearsalCapability,
} from "../shared/security.mjs";
import { hashId, verifiedFromFixture } from "../shared/verified-fixture.mjs";
import { activateContribution } from "../shared/contribution-ledger.mjs";

const FUNCTION_NAME = "v2-shadow-resolve-observation";
const fail = (code) => ({ ok: false, code });
const enabled = (env) =>
  env.ICHI_V2_SHADOW_BOUNDARY === "synthetic_only" &&
  env.ICHI_V2_SHADOW_RESOLVE_ENABLED === "true";
const associationHeadId = (observationVersionId) =>
  hashId("association-head", observationVersionId);
const latestAssociation = async (db, observationVersionId) => {
  const head = await readDoc(
    db.collection("v2ShadowControlState"),
    associationHeadId(observationVersionId),
  );
  return head?.decisionId
    ? readDoc(db.collection("v2ShadowAssociationDecisions"), head.decisionId)
    : null;
};

const testPolicy = (env) => {
  const cooldown = positiveInteger(
    Number(env.ICHI_V2_SHADOW_HA_COOLDOWN_SECONDS),
  );
  const window = positiveInteger(
    Number(env.ICHI_V2_SHADOW_HA_BUDGET_WINDOW_SECONDS),
  );
  const max = positiveInteger(Number(env.ICHI_V2_SHADOW_HA_BUDGET_MAX));
  const version = env.ICHI_V2_SHADOW_HA_POLICY_VERSION;
  if (!cooldown || !window || !max || !version) return null;
  return { cooldown, window, max, version };
};

const maybeCreateAssistance = async (
  tx,
  fixture,
  upload,
  candidates,
  env,
  nowMs,
) => {
  const candidateIds = candidates.map((item) => item.boardInstanceId).sort();
  const policy = testPolicy(env);
  if (!policy || candidateIds.length < 2) return false;
  const owner = fixture.ownerSubjectDigest;
  if (typeof owner !== "string" || !/^[a-f0-9]{64}$/u.test(owner)) {
    return false;
  }
  const requestId = hashId("ha", fixture.observationVersionId);
  if (
    await readDoc(tx.collection("v2ShadowHumanAssistanceRequests"), requestId)
  ) {
    return false;
  }
  const windowKey = String(Math.floor(nowMs / (policy.window * 1000)));
  const budgetId = hashId("ha-budget", `${owner}:${windowKey}`);
  const cooldownId = hashId("ha-cooldown", owner);
  const budget = await readDoc(tx.collection("v2ShadowControlState"), budgetId);
  const cooldown = await readDoc(
    tx.collection("v2ShadowControlState"),
    cooldownId,
  );
  if (
    Number(budget?.count || 0) >= policy.max ||
    Number(cooldown?.nextAllowedAtMs || 0) > nowMs
  ) {
    return false;
  }
  const expiresAtMs = Date.parse(fixture.assistanceExpiresAt);
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= nowMs) return false;
  await tx
    .collection("v2ShadowHumanAssistanceRequests")
    .doc(requestId)
    .set({
      data: {
        requestId,
        ownerSubjectDigest: owner,
        observationVersionId: fixture.observationVersionId,
        observationVersion: fixture.verifiedBoardVersion,
        candidateRecordRef: upload.candidateRecordRef,
        fixtureId: fixture.fixtureId,
        comparisonBoardInstanceId: candidateIds[0],
        comparisonFixtureId: candidates.find(
          (item) => item.boardInstanceId === candidateIds[0],
        )?.lastFixtureId,
        comparisonInstanceVersion: candidates.find(
          (item) => item.boardInstanceId === candidateIds[0],
        )?.priorInstanceVersion,
        candidateIds,
        state: "PENDING",
        policyVersion: policy.version,
        expiresAt: new Date(expiresAtMs).toISOString(),
        dataOrigin: "SYNTHETIC_REHEARSAL",
      },
    });
  await tx
    .collection("v2ShadowControlState")
    .doc(budgetId)
    .set({
      data: {
        kind: "HA_BUDGET",
        subjectDigest: owner,
        windowKey,
        count: Number(budget?.count || 0) + 1,
        expiresAt: new Date(
          (Number(windowKey) + 1) * policy.window * 1000,
        ).toISOString(),
        dataOrigin: "SYNTHETIC_REHEARSAL",
      },
    });
  await tx
    .collection("v2ShadowControlState")
    .doc(cooldownId)
    .set({
      data: {
        kind: "HA_COOLDOWN",
        subjectDigest: owner,
        windowKey: "current",
        nextAllowedAtMs: nowMs + policy.cooldown * 1000,
        expiresAt: new Date(nowMs + policy.cooldown * 1000).toISOString(),
        dataOrigin: "SYNTHETIC_REHEARSAL",
      },
    });
  return true;
};

export const createMain =
  ({ cloud, env, now = Date.now }) =>
  async (event = {}) => {
    if (!enabled(env)) return fail("SHADOW_RESOLVE_DISABLED");
    const db = cloud.database();
    const capability = await verifyRehearsalCapability(
      event.capability,
      "resolve-observation",
      FUNCTION_NAME,
      env.ICHI_V2_SHADOW_REHEARSAL_HMAC_KEY,
      (id, expiry) => consumeShadowCapabilityNonce(db, id, expiry),
      now(),
    );
    if (!capability.ok) return capability;
    const fixtureId = fixedId("fixture", event.fixtureId);
    if (!fixtureId || capability.payload.fixtureId !== event.fixtureId) {
      return fail("SYNTHETIC_FIXTURE_REQUIRED");
    }
    const fixture = await readDoc(
      db.collection("v2ShadowSourceFixtures"),
      fixtureId,
    );
    const current = verifiedFromFixture(fixture);
    if (!current.ok) return current;
    const uploads = listData(
      await db
        .collection("v2ShadowCandidateUploads")
        .where({
          observationVersionId: fixture.observationVersionId,
          ownerSubjectDigest: fixture.ownerSubjectDigest,
          lifecycle: "ACTIVE",
          dataOrigin: "SYNTHETIC_REHEARSAL",
        })
        .limit(2)
        .get(),
    );
    if (
      uploads.length !== 1 ||
      uploads[0].observationVersion !== fixture.verifiedBoardVersion
    )
      return fail("CANDIDATE_UPLOAD_REQUIRED");
    const upload = uploads[0];
    const location = fixture.publication.location;
    if (
      location?.coordinateSystem !== "GCJ02" ||
      !Number.isFinite(location.latitude) ||
      !Number.isFinite(location.longitude)
    ) {
      return fail("LOCATION_INVALID");
    }
    const nearby = listData(
      await db
        .collection("v2ShadowBoardInstances")
        .where({
          lifecycleState: "ACTIVE",
          candidatePoint: db.command.geoNear({
            geometry: new db.Geo.Point(location.longitude, location.latitude),
            maxDistance: 250,
          }),
        })
        .limit(50)
        .get(),
    );
    if (nearby.length >= 50) return fail("CANDIDATE_SET_TRUNCATED");
    const candidates = [];
    for (const instance of nearby) {
      if (instance.dataOrigin !== "SYNTHETIC_REHEARSAL") {
        return fail("CANDIDATE_INVALID");
      }
      const priorFixture = await readDoc(
        db.collection("v2ShadowSourceFixtures"),
        fixedId("fixture", instance.lastFixtureId),
      );
      const verified = verifiedFromFixture(priorFixture);
      if (!verified.ok) return fail("CANDIDATE_INVALID");
      candidates.push({
        boardInstanceId: instance.boardInstanceId,
        lastVerifiedBoard: verified.value,
        lastFixtureId: instance.lastFixtureId,
        priorInstanceVersion: instance.instanceVersion,
      });
    }
    const priorDecision = await latestAssociation(
      db,
      fixture.observationVersionId,
    );
    if (priorDecision?.action === "LINK") {
      return {
        ok: true,
        resolution: priorDecision.resolution,
        boardInstanceId: priorDecision.boardInstanceId,
        duplicate: true,
      };
    }
    const eligibleCandidates = candidates.filter(
      (item) => item.boardInstanceId !== priorDecision?.negativeBoardInstanceId,
    );
    const resolution = resolveBoardInstance(
      current.value,
      fixture.verifiedBoardVersion,
      eligibleCandidates,
    );
    if (resolution.kind.startsWith("REJECTED_")) return fail(resolution.kind);
    return db.runTransaction(async (tx) => {
      const freshFixture = await readDoc(
        tx.collection("v2ShadowSourceFixtures"),
        fixtureId,
      );
      if (
        freshFixture?.currentObservationVersionId !==
          fixture.currentObservationVersionId ||
        freshFixture?.lifecycleState !== "CURRENT"
      ) {
        return fail("STALE_FIXTURE");
      }
      const freshUpload = await readDoc(
        tx.collection("v2ShadowCandidateUploads"),
        upload.candidateRecordRef,
      );
      if (
        freshUpload?.ownerSubjectDigest !== fixture.ownerSubjectDigest ||
        freshUpload.observationVersionId !== fixture.observationVersionId ||
        freshUpload.observationVersion !== fixture.verifiedBoardVersion ||
        freshUpload.lifecycle !== "ACTIVE" ||
        freshUpload.dataOrigin !== "SYNTHETIC_REHEARSAL"
      )
        return fail("CANDIDATE_UPLOAD_STALE");
      const existing = await latestAssociation(
        tx,
        fixture.observationVersionId,
      );
      if (
        Number(existing?.decisionVersion || 0) !==
        Number(priorDecision?.decisionVersion || 0)
      )
        return fail("STALE_DECISION");
      if (existing?.action === "LINK") {
        return {
          ok: true,
          resolution: existing.resolution,
          boardInstanceId: existing.boardInstanceId,
          duplicate: true,
        };
      }
      if (resolution.kind === "AMBIGUOUS") {
        const requested = await maybeCreateAssistance(
          tx,
          fixture,
          freshUpload,
          eligibleCandidates.filter((item) =>
            resolution.candidateIds.includes(item.boardInstanceId),
          ),
          env,
          now(),
        );
        return {
          ok: true,
          resolution: "AMBIGUOUS",
          assistanceRequested: requested,
        };
      }
      const boardInstanceId =
        resolution.kind === "UNIQUE_MATCH"
          ? resolution.boardInstanceId
          : hashId("instance", fixture.observationVersionId);
      const prior = await readDoc(
        tx.collection("v2ShadowBoardInstances"),
        boardInstanceId,
      );
      if (
        (resolution.kind === "UNIQUE_MATCH" &&
          (!prior ||
            prior.lifecycleState !== "ACTIVE" ||
            prior.instanceVersion !==
              eligibleCandidates.find(
                (item) => item.boardInstanceId === boardInstanceId,
              )?.priorInstanceVersion)) ||
        (resolution.kind === "NO_MATCH" && prior)
      ) {
        return fail("STALE_CANDIDATE");
      }
      const eventSequence = Number(prior?.lastEventSequence || 0) + 1;
      await tx
        .collection("v2ShadowBoardInstances")
        .doc(boardInstanceId)
        .set({
          data: {
            boardInstanceId,
            lifecycleState: "ACTIVE",
            instanceVersion: Number(prior?.instanceVersion || 0) + 1,
            lastFixtureId: event.fixtureId,
            lastObservationVersionId: fixture.observationVersionId,
            lastObservedAt: current.value.observedAt,
            candidatePoint: new db.Geo.Point(
              location.longitude,
              location.latitude,
            ),
            lastEventSequence: eventSequence,
            lastAppliedEventSequence: Number(
              prior?.lastAppliedEventSequence || 0,
            ),
            activePublicLeadId: prior?.activePublicLeadId || null,
            activeServedVersion: Number(prior?.activeServedVersion || 0),
            dataOrigin: "SYNTHETIC_REHEARSAL",
          },
        });
      const decisionVersion = Number(existing?.decisionVersion || 0) + 1;
      const decisionId = `${hashId("association", fixture.observationVersionId)}:v${decisionVersion}`;
      await tx
        .collection("v2ShadowAssociationDecisions")
        .doc(decisionId)
        .set({
          data: {
            observationVersionId: fixture.observationVersionId,
            decisionVersion,
            boardInstanceId,
            action: "LINK",
            resolution: resolution.kind,
            resolverVersion: "v2-19-shadow-r1",
            supersedesDecisionVersion: existing?.decisionVersion ?? null,
            dataOrigin: "SYNTHETIC_REHEARSAL",
          },
        });
      await tx
        .collection("v2ShadowControlState")
        .doc(associationHeadId(fixture.observationVersionId))
        .set({
          data: {
            kind: "ASSOCIATION_HEAD",
            subjectDigest: hashId(
              "association-subject",
              fixture.observationVersionId,
            ),
            windowKey: "current",
            decisionId,
            decisionVersion,
            dataOrigin: "SYNTHETIC_REHEARSAL",
          },
        });
      await tx
        .collection("v2ShadowProjectionOutbox")
        .doc(hashId("outbox", `${boardInstanceId}:${eventSequence}`))
        .set({
          data: {
            boardInstanceId,
            eventSequence,
            observationVersionId: fixture.observationVersionId,
            fixtureId: event.fixtureId,
            status: "PENDING",
            nextAttemptAt: new Date(now()).toISOString(),
            attempts: 0,
            dataOrigin: "SYNTHETIC_REHEARSAL",
          },
        });
      const activated = await activateContribution(
        tx,
        freshUpload,
        freshFixture,
        boardInstanceId,
        current.value.observedAt,
        now(),
      );
      if (!activated.ok) throw new Error(activated.code);
      return { ok: true, resolution: resolution.kind, boardInstanceId };
    });
  };
