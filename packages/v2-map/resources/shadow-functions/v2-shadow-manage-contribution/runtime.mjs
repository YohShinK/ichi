import { listData, readDoc } from "../shared/db.mjs";
import { deriveTrustedCaller } from "../shared/security.mjs";
import { hashId } from "../shared/verified-fixture.mjs";
import { contributionEligible } from "../shared/contribution-ledger.mjs";
import {
  consentDocumentId,
  consentEventId,
  consentIsCurrent,
  currentConsentPolicy,
} from "../shared/map-contribution-consent.mjs";

const fail = (code) => ({ ok: false, code });
const validRef = (value) =>
  typeof value === "string" && /^candidate:[a-f0-9]{40}$/u.test(value);

const listOwn = async (db, ownerSubjectDigest) => {
  const rows = listData(
    await db
      .collection("v2ShadowCandidateUploads")
      .where({ ownerSubjectDigest, dataOrigin: "SYNTHETIC_REHEARSAL" })
      .limit(50)
      .get(),
  );
  if (rows.length >= 50) return fail("RESULT_LIMIT_REACHED");
  return {
    ok: true,
    uploads: rows.map((row) => ({
      candidateRecordRef: row.candidateRecordRef,
      observationVersion: row.observationVersion,
      validationState: row.validationState,
      shareDecision: row.shareDecision,
      lifecycle: row.lifecycle,
      boardInstanceId: row.boardInstanceId || null,
    })),
  };
};

const getConsent = async (db, ownerSubjectDigest, policy) => {
  const row = await readDoc(
    db.collection("v2ShadowMapContributionConsent"),
    consentDocumentId(ownerSubjectDigest),
  );
  const accepted = consentIsCurrent(row, ownerSubjectDigest, policy);
  return {
    ok: true,
    termsVersion: policy.version,
    scopeDigest: policy.scopeDigest,
    accepted,
    acceptedAt: row?.acceptedAt || null,
    status: accepted ? "ACCEPTED" : "NOT_ACCEPTED",
  };
};

const acceptConsent = async (db, ownerSubjectDigest, event, policy, now) => {
  if (
    typeof event.commandId !== "string" ||
    !/^[A-Za-z0-9:_-]{8,128}$/u.test(event.commandId) ||
    event.termsVersion !== policy.version ||
    event.scopeDigest !== policy.scopeDigest
  )
    return fail("INVALID_OR_STALE_CONSENT");
  return db.runTransaction(async (tx) => {
    const collection = tx.collection("v2ShadowMapContributionConsent");
    const id = consentDocumentId(ownerSubjectDigest);
    const before = await readDoc(collection, id);
    const auditId = consentEventId(ownerSubjectDigest, event.commandId);
    const audit = await readDoc(collection, auditId);
    if (audit)
      return audit.ownerSubjectDigest === ownerSubjectDigest &&
        audit.kind === "ACCEPT_EVENT"
        ? { ok: true, duplicate: true, accepted: true }
        : fail("COMMAND_CONFLICT");
    if (before?.accepted === true)
      return { ok: true, duplicate: true, accepted: true };
    const rows = listData(
      await tx
        .collection("v2ShadowContributionLedger")
        .where({
          ownerSubjectDigest,
          kind: "STATE",
          dataOrigin: "SYNTHETIC_REHEARSAL",
        })
        .limit(51)
        .get(),
    );
    if (rows.length >= 51) return fail("CONTRIBUTION_SET_TRUNCATED");
    const at = new Date(now()).toISOString();
    const affected = new Set(
      rows
        .filter((row) => row.lifecycle === "ACTIVE" && row.boardInstanceId)
        .map((row) => row.boardInstanceId),
    );
    for (const boardInstanceId of affected) {
      const instance = await readDoc(
        tx.collection("v2ShadowBoardInstances"),
        boardInstanceId,
      );
      if (instance?.dataOrigin !== "SYNTHETIC_REHEARSAL")
        throw new Error("INSTANCE_UNAVAILABLE");
      const row = rows.find((item) => item.boardInstanceId === boardInstanceId);
      const sequence = Number(instance.lastEventSequence || 0) + 1;
      await tx
        .collection("v2ShadowBoardInstances")
        .doc(boardInstanceId)
        .set({ data: { ...instance, lastEventSequence: sequence } });
      await tx
        .collection("v2ShadowProjectionOutbox")
        .doc(hashId("outbox", `${boardInstanceId}:${sequence}`))
        .set({
          data: {
            boardInstanceId,
            eventSequence: sequence,
            observationVersionId: row.observationVersionId,
            fixtureId: row.fixtureId,
            status: "PENDING",
            nextAttemptAt: at,
            attempts: 0,
            dataOrigin: "SYNTHETIC_REHEARSAL",
          },
        });
    }
    await collection.doc(id).set({
      data: {
        kind: "STATE",
        ownerSubjectDigest,
        accepted: true,
        acceptedTermsVersion: policy.version,
        acceptedScopeDigest: policy.scopeDigest,
        acceptedAt: at,
        firstActionId: event.commandId,
        auditVersion: 1,
        dataOrigin: "SYNTHETIC_REHEARSAL",
      },
    });
    await collection.doc(auditId).set({
      data: {
        kind: "ACCEPT_EVENT",
        ownerSubjectDigest,
        termsVersion: policy.version,
        scopeDigest: policy.scopeDigest,
        commandId: event.commandId,
        at,
        dataOrigin: "SYNTHETIC_REHEARSAL",
      },
    });
    return { ok: true, duplicate: false, accepted: true };
  });
};

const deleteOwn = async (db, ownerSubjectDigest, event, now, policy) => {
  if (!validRef(event.candidateRecordRef)) return fail("INVALID_REQUEST");
  if (
    typeof event.commandId !== "string" ||
    !/^[A-Za-z0-9:_-]{8,128}$/u.test(event.commandId)
  )
    return fail("INVALID_REQUEST");
  return db.runTransaction(async (tx) => {
    const upload = await readDoc(
      tx.collection("v2ShadowCandidateUploads"),
      event.candidateRecordRef,
    );
    if (
      upload?.ownerSubjectDigest !== ownerSubjectDigest ||
      upload.dataOrigin !== "SYNTHETIC_REHEARSAL"
    )
      return fail("UPLOAD_UNAVAILABLE");
    if (upload.lifecycle === "DELETED")
      return upload.lastCommandId === event.commandId
        ? { ok: true, duplicate: true, lifecycle: "DELETED" }
        : fail("UPLOAD_UNAVAILABLE");
    const contributionId = hashId("contribution", event.candidateRecordRef);
    const contribution = await readDoc(
      tx.collection("v2ShadowContributionLedger"),
      contributionId,
    );
    if (
      contribution &&
      (contribution.ownerSubjectDigest !== ownerSubjectDigest ||
        contribution.candidateRecordRef !== event.candidateRecordRef ||
        contribution.dataOrigin !== "SYNTHETIC_REHEARSAL")
    )
      return fail("CONTRIBUTION_UNAVAILABLE");
    const deletedAt = new Date(now()).toISOString();
    await tx
      .collection("v2ShadowCandidateUploads")
      .doc(event.candidateRecordRef)
      .set({
        data: {
          ...upload,
          lifecycle: "DELETED",
          lastCommandId: event.commandId,
          deletedAt,
          noResurrection: true,
        },
      });
    if (contribution) {
      await tx
        .collection("v2ShadowContributionLedger")
        .doc(contributionId)
        .set({
          data: {
            ...contribution,
            lifecycle: "DELETED",
            eligible: false,
            lastCommandId: event.commandId,
            deletedAt,
            noResurrection: true,
          },
        });
      const instance = await readDoc(
        tx.collection("v2ShadowBoardInstances"),
        contribution.boardInstanceId,
      );
      if (
        instance?.dataOrigin !== "SYNTHETIC_REHEARSAL" ||
        instance.lifecycleState !== "ACTIVE"
      )
        throw new Error("INSTANCE_UNAVAILABLE");
      const remaining = listData(
        await tx
          .collection("v2ShadowContributionLedger")
          .where({
            boardInstanceId: contribution.boardInstanceId,
            kind: "STATE",
            dataOrigin: "SYNTHETIC_REHEARSAL",
          })
          .limit(51)
          .get(),
      );
      if (remaining.length >= 51) throw new Error("SERVICE_UNAVAILABLE");
      const activeRemaining = [];
      for (const row of remaining) {
        if (
          row.contributionId === contributionId ||
          row.lifecycle !== "ACTIVE" ||
          row.eligible !== true ||
          row.shareDecision !== "SHARE"
        )
          continue;
        const source = await readDoc(
          tx.collection("v2ShadowSourceFixtures"),
          `fixture:${row.fixtureId}`,
        );
        const sourceUpload = await readDoc(
          tx.collection("v2ShadowCandidateUploads"),
          row.candidateRecordRef,
        );
        if (
          source?.ownerSubjectDigest === row.ownerSubjectDigest &&
          source.currentObservationVersionId === row.observationVersionId &&
          sourceUpload?.ownerSubjectDigest === row.ownerSubjectDigest &&
          sourceUpload.observationVersionId === row.observationVersionId &&
          contributionEligible(
            source,
            sourceUpload,
            await readDoc(
              tx.collection("v2ShadowMapContributionConsent"),
              consentDocumentId(row.ownerSubjectDigest),
            ),
            policy,
          )
        )
          activeRemaining.push(row);
      }
      if (activeRemaining.length === 0 && instance.activePublicLeadId) {
        const leads = listData(
          await tx
            .collection("v2ShadowPublicMapLeads")
            .where({ publicLeadId: instance.activePublicLeadId })
            .limit(50)
            .get(),
        );
        if (leads.length >= 50) throw new Error("SERVICE_UNAVAILABLE");
        for (const lead of leads) {
          if (lead.dataOrigin !== "SYNTHETIC_REHEARSAL")
            throw new Error("LEAD_UNAVAILABLE");
          await tx
            .collection("v2ShadowPublicMapLeads")
            .doc(lead._id)
            .set({
              data: { ...lead, lifecycleState: "HIDDEN", visibility: "HIDDEN" },
            });
        }
        const epoch = await readDoc(
          tx.collection("v2ShadowControlState"),
          "global:read-epoch",
        );
        await tx
          .collection("v2ShadowControlState")
          .doc("global:read-epoch")
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
      const sequence = Number(instance.lastEventSequence || 0) + 1;
      await tx
        .collection("v2ShadowBoardInstances")
        .doc(contribution.boardInstanceId)
        .set({ data: { ...instance, lastEventSequence: sequence } });
      await tx
        .collection("v2ShadowProjectionOutbox")
        .doc(hashId("outbox", `${contribution.boardInstanceId}:${sequence}`))
        .set({
          data: {
            boardInstanceId: contribution.boardInstanceId,
            eventSequence: sequence,
            observationVersionId: contribution.observationVersionId,
            fixtureId: contribution.fixtureId,
            status: "PENDING",
            nextAttemptAt: deletedAt,
            attempts: 0,
            dataOrigin: "SYNTHETIC_REHEARSAL",
          },
        });
    }
    await tx
      .collection("v2ShadowContributionLedger")
      .doc(
        hashId(
          "contribution-audit",
          `${event.candidateRecordRef}:${event.commandId}`,
        ),
      )
      .set({
        data: {
          kind: "DELETE_EVENT",
          auditVersion: 1,
          candidateRecordRef: event.candidateRecordRef,
          contributionId,
          ownerSubjectDigest,
          commandId: event.commandId,
          at: deletedAt,
          dataOrigin: "SYNTHETIC_REHEARSAL",
        },
      });
    return { ok: true, duplicate: false, lifecycle: "DELETED" };
  });
};

export const createMain =
  ({ cloud, env, now = Date.now }) =>
  async (event = {}) => {
    if (
      env.ICHI_V2_SHADOW_BOUNDARY !== "synthetic_only" ||
      env.ICHI_V2_SHADOW_CONTRIBUTION_ENABLED !== "true"
    )
      return fail("SERVICE_UNAVAILABLE");
    const caller = deriveTrustedCaller(cloud, env);
    if (!caller.ok) return caller;
    const db = cloud.database();
    try {
      const policy = currentConsentPolicy(env);
      if (
        (event.operation === "GET_MAP_CONTRIBUTION_CONSENT" ||
          event.operation === "ACCEPT_MAP_CONTRIBUTION_TERMS" ||
          event.operation === "DELETE_MY_UPLOAD") &&
        (env.ICHI_V2_SHADOW_CONSENT_ENABLED !== "true" || !policy)
      )
        return fail("SERVICE_UNAVAILABLE");
      if (event.operation === "GET_MAP_CONTRIBUTION_CONSENT")
        return await getConsent(db, caller.digest, policy);
      if (event.operation === "ACCEPT_MAP_CONTRIBUTION_TERMS")
        return await acceptConsent(db, caller.digest, event, policy, now);
      if (event.operation === "LIST_MY_UPLOADS")
        return await listOwn(db, caller.digest);
      if (event.operation === "DELETE_MY_UPLOAD")
        return await deleteOwn(db, caller.digest, event, now, policy);
      return fail("INVALID_REQUEST");
    } catch {
      return fail("SERVICE_UNAVAILABLE");
    }
  };
