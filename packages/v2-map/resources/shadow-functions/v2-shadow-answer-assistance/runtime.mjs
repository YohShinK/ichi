import { resolveBoardInstance } from "../../../src/board-instance.js";
import { fixedId, readDoc } from "../shared/db.mjs";
import { deriveTrustedCaller } from "../shared/security.mjs";
import { hashId, verifiedFromFixture } from "../shared/verified-fixture.mjs";
import { activateContribution } from "../shared/contribution-ledger.mjs";

const ANSWERS = new Set([
  "SAME_BOARD",
  "DIFFERENT_BOARD",
  "CANNOT_TELL",
  "SKIP",
]);
const fail = (code) => ({ ok: false, code });

export const createMain =
  ({ cloud, env, now = Date.now }) =>
  async (event = {}) => {
    if (
      env.ICHI_V2_SHADOW_BOUNDARY !== "synthetic_only" ||
      env.ICHI_V2_SHADOW_HUMAN_ASSISTANCE_ENABLED !== "true"
    ) {
      return fail("SHADOW_ASSISTANCE_DISABLED");
    }
    if (!ANSWERS.has(event.answer)) return fail("INVALID_ANSWER");
    const caller = deriveTrustedCaller(cloud, env);
    if (!caller.ok) return caller;
    if (
      typeof event.requestId !== "string" ||
      !/^ha:[a-f0-9]{40}$/u.test(event.requestId)
    ) {
      return fail("REQUEST_UNAVAILABLE");
    }
    const db = cloud.database();
    const pause = await readDoc(
      db.collection("v2ShadowControlState"),
      "global:ha-pause",
    );
    if (pause?.paused !== false) return fail("SHADOW_ASSISTANCE_UNAVAILABLE");
    return db.runTransaction(async (tx) => {
      const request = await readDoc(
        tx.collection("v2ShadowHumanAssistanceRequests"),
        event.requestId,
      );
      if (
        request?.ownerSubjectDigest !== caller.digest ||
        request.dataOrigin !== "SYNTHETIC_REHEARSAL"
      ) {
        return fail("REQUEST_UNAVAILABLE");
      }
      if (
        event.candidateRecordRef !== request.candidateRecordRef ||
        event.submissionVersion !== request.observationVersion
      )
        return fail("REQUEST_STALE");
      const actionId = hashId("ha-action", event.requestId);
      const priorEvidence = await readDoc(
        tx.collection("v2ShadowHumanAssistanceEvidence"),
        actionId,
      );
      if (request.state !== "PENDING") {
        return request.answer === event.answer &&
          (event.answer === "SKIP" || priorEvidence?.answer === event.answer)
          ? { ok: true, accepted: event.answer, duplicate: true }
          : fail("REQUEST_UNAVAILABLE");
      }
      if (Date.parse(request.expiresAt) <= now()) {
        return fail("REQUEST_EXPIRED");
      }
      const upload = await readDoc(
        tx.collection("v2ShadowCandidateUploads"),
        request.candidateRecordRef,
      );
      if (
        upload?.ownerSubjectDigest !== caller.digest ||
        upload.observationVersionId !== request.observationVersionId ||
        upload.observationVersion !== request.observationVersion ||
        upload.lifecycle !== "ACTIVE" ||
        upload.dataOrigin !== "SYNTHETIC_REHEARSAL"
      )
        return fail("REQUEST_STALE");
      const fixture = await readDoc(
        tx.collection("v2ShadowSourceFixtures"),
        fixedId("fixture", request.fixtureId),
      );
      if (
        fixture?.ownerSubjectDigest !== caller.digest ||
        fixture.lifecycleState !== "CURRENT" ||
        fixture.currentObservationVersionId !== request.observationVersionId ||
        fixture.verifiedBoardVersion !== request.observationVersion
      ) {
        return fail("REQUEST_STALE");
      }
      const instance = await readDoc(
        tx.collection("v2ShadowBoardInstances"),
        request.comparisonBoardInstanceId,
      );
      if (
        instance?.lifecycleState !== "ACTIVE" ||
        instance.instanceVersion !== request.comparisonInstanceVersion
      ) {
        return fail("REQUEST_STALE");
      }
      const decisionId = hashId("association", request.observationVersionId);
      const headId = hashId("association-head", request.observationVersionId);
      if (await readDoc(tx.collection("v2ShadowControlState"), headId)) {
        return fail("REQUEST_STALE");
      }
      if (event.answer === "SAME_BOARD") {
        const priorFixture = await readDoc(
          tx.collection("v2ShadowSourceFixtures"),
          fixedId("fixture", instance.lastFixtureId),
        );
        const currentVerified = verifiedFromFixture(fixture);
        const priorVerified = verifiedFromFixture(priorFixture);
        if (!currentVerified.ok || !priorVerified.ok) {
          return fail("REQUEST_STALE");
        }
        const resolution = resolveBoardInstance(
          currentVerified.value,
          fixture.verifiedBoardVersion,
          [
            {
              boardInstanceId: instance.boardInstanceId,
              lastVerifiedBoard: priorVerified.value,
            },
          ],
        );
        if (resolution.kind !== "UNIQUE_MATCH") return fail("HARD_CONFLICT");
        const eventSequence = Number(instance.lastEventSequence || 0) + 1;
        await tx
          .collection("v2ShadowBoardInstances")
          .doc(instance.boardInstanceId)
          .set({
            data: {
              ...instance,
              instanceVersion: instance.instanceVersion + 1,
              lastFixtureId: request.fixtureId,
              lastObservationVersionId: request.observationVersionId,
              lastObservedAt: currentVerified.value.observedAt,
              lastEventSequence: eventSequence,
            },
          });
        await tx
          .collection("v2ShadowProjectionOutbox")
          .doc(hashId("outbox", `${instance.boardInstanceId}:${eventSequence}`))
          .set({
            data: {
              boardInstanceId: instance.boardInstanceId,
              eventSequence,
              observationVersionId: request.observationVersionId,
              fixtureId: request.fixtureId,
              status: "PENDING",
              nextAttemptAt: new Date(now()).toISOString(),
              attempts: 0,
              dataOrigin: "SYNTHETIC_REHEARSAL",
            },
          });
        const activated = await activateContribution(
          tx,
          upload,
          fixture,
          instance.boardInstanceId,
          currentVerified.value.observedAt,
          now(),
        );
        if (!activated.ok) throw new Error(activated.code);
      }
      if (event.answer === "SAME_BOARD" || event.answer === "DIFFERENT_BOARD") {
        await tx
          .collection("v2ShadowAssociationDecisions")
          .doc(`${decisionId}:v1`)
          .set({
            data: {
              observationVersionId: request.observationVersionId,
              decisionVersion: 1,
              boardInstanceId:
                event.answer === "SAME_BOARD"
                  ? request.comparisonBoardInstanceId
                  : null,
              negativeBoardInstanceId:
                event.answer === "DIFFERENT_BOARD"
                  ? request.comparisonBoardInstanceId
                  : null,
              action: event.answer === "SAME_BOARD" ? "LINK" : "UNLINK",
              resolution: "HUMAN_EVIDENCE",
              resolverVersion: "v2-19-shadow-r1",
              supersedesDecisionVersion: null,
              dataOrigin: "SYNTHETIC_REHEARSAL",
            },
          });
        await tx
          .collection("v2ShadowControlState")
          .doc(headId)
          .set({
            data: {
              kind: "ASSOCIATION_HEAD",
              subjectDigest: hashId(
                "association-subject",
                request.observationVersionId,
              ),
              windowKey: "current",
              decisionId: `${decisionId}:v1`,
              decisionVersion: 1,
              dataOrigin: "SYNTHETIC_REHEARSAL",
            },
          });
      }
      if (event.answer !== "SKIP") {
        await tx
          .collection("v2ShadowHumanAssistanceEvidence")
          .doc(actionId)
          .set({
            data: {
              actionId,
              requestId: event.requestId,
              ownerSubjectDigest: caller.digest,
              observationVersionId: request.observationVersionId,
              comparisonBoardInstanceId: request.comparisonBoardInstanceId,
              answer: event.answer,
              resolverContextVersion: request.observationVersion,
              createdAt: new Date(now()).toISOString(),
              dataOrigin: "SYNTHETIC_REHEARSAL",
            },
          });
      }
      await tx
        .collection("v2ShadowHumanAssistanceRequests")
        .doc(event.requestId)
        .set({
          data: {
            ...request,
            state: event.answer === "SKIP" ? "SKIPPED" : "ANSWERED",
            answer: event.answer,
            actionId,
            answeredAt: new Date(now()).toISOString(),
          },
        });
      return { ok: true, accepted: event.answer, duplicate: false };
    });
  };
