"use strict";
/* eslint-disable @typescript-eslint/no-require-imports */
const { createHash } = require("node:crypto");

const digest = (...parts) =>
  createHash("sha256").update(parts.join("\0")).digest("hex");
const lineageId = (recordId) => digest("player-source-phase2", recordId);
const stateId = (recordId) => `source:${lineageId(recordId)}`;
const get = async (tx, name, id) => {
  try {
    const r = await tx.collection(name).doc(id).get();
    const data = Array.isArray(r?.data) ? r.data[0] : r?.data;
    if (!data) return null;
    const row = { ...data };
    delete row._id;
    delete row._openid;
    return row;
  } catch (e) {
    if (/not exist|not found|-502005/u.test(String(e?.message))) return null;
    throw e;
  }
};
const put = (tx, name, id, data) => tx.collection(name).doc(id).set({ data });

// Called inside the SAME V1 transaction as the authoritative change. No raw
// snapshot, note, image, OPENID or secret is copied into the dirty event.
const enqueueSourceChange = async ({
  tx,
  env,
  recordId,
  ownerAccountId,
  reason,
  nowMs,
  force = false,
}) => {
  if (!force && env.ICHI_V2_BRIDGE_PRODUCER_ENABLED !== "true")
    return { enabled: false };
  if (!recordId || !ownerAccountId || !Number.isFinite(nowMs))
    throw new Error("BRIDGE_SOURCE_REFERENCE_INVALID");
  const control = await get(tx, "mapSourceBridgeControl", "global:bridge");
  if (control?.producerEnabled !== true)
    throw new Error("BRIDGE_PRODUCER_PAUSED");
  const id = stateId(recordId);
  const before = await get(tx, "mapSourceBridgeState", id);
  if (before && before.ownerAccountId !== ownerAccountId)
    throw new Error("BRIDGE_OWNER_CONFLICT");
  const revision = (before?.desiredRevision ?? 0) + 1;
  if (!Number.isSafeInteger(revision) || revision < 1)
    throw new Error("BRIDGE_REVISION_INVALID");
  const lineage = lineageId(recordId);
  const deletionLatch = before?.deletionLatch === true || reason === "DELETE";
  const eventId = digest("source-event-phase2", lineage, String(revision));
  const at = new Date(nowMs).toISOString();
  await put(tx, "mapSourceBridgeState", id, {
    ...before,
    kind: "SOURCE_HEAD",
    recordId,
    ownerAccountId,
    lineageId: lineage,
    desiredRevision: revision,
    appliedRevision: before?.appliedRevision ?? 0,
    deletionLatch,
    updatedAt: at,
  });
  await put(tx, "mapSourceOutbox", eventId, {
    kind: "SOURCE_EVENT",
    eventId,
    recordId,
    ownerAccountId,
    lineageId: lineage,
    revision,
    reason,
    status: "PENDING",
    stage: "SOURCE",
    attempts: 0,
    createdAt: at,
    nextAttemptAt: at,
  });
  const head = await get(tx, "boardObservations", `lineage:${lineage}`);
  if (head)
    await put(tx, "boardObservations", `lineage:${lineage}`, {
      ...head,
      lifecycleState: deletionLatch ? "DELETED" : "SUPERSEDED",
    });
  const contribution = await get(
    tx,
    "mapContributions",
    digest("contribution", lineage),
  );
  if (contribution?.boardInstanceId) {
    await put(tx, "mapContributions", contribution.contributionId, {
      ...contribution,
      publicHideIntent: true,
      ...(deletionLatch ? { lifecycle: "DELETED", noResurrection: true } : {}),
    });
    const instance = await get(
      tx,
      "boardInstances",
      contribution.boardInstanceId,
    );
    if (instance?.activePublicLeadId) {
      const leadId = `head:${instance.activePublicLeadId}`;
      const lead = await get(tx, "publicMapLeads", leadId);
      if (lead?.lifecycleState === "PUBLIC")
        await put(tx, "publicMapLeads", leadId, {
          ...lead,
          lifecycleState: "HIDDEN",
          hideReason: "SOURCE_CHANGE_PENDING",
        });
    }
  }
  const epoch = await get(tx, "mapControlState", "global:read-epoch");
  if (
    !Number.isSafeInteger(epoch?.epoch) ||
    !Number.isSafeInteger(epoch?.mutationRevision)
  )
    throw new Error("BRIDGE_REVISION_FENCE_UNAVAILABLE");
  await put(tx, "mapControlState", "global:read-epoch", {
    ...epoch,
    epoch: epoch.epoch + 1,
    mutationRevision: epoch.mutationRevision + 1,
  });
  return { enabled: true, eventId, revision };
};

// Account deletion can exceed a single transaction's document budget. A global
// read barrier is committed before V1 deletion; a bounded sweep later retires
// every owner's support. Operators explicitly lift the barrier after read-back.
const enqueueAccountDeletion = async ({ tx, env, ownerAccountId, nowMs }) => {
  if (env.ICHI_V2_BRIDGE_PRODUCER_ENABLED !== "true") return { enabled: false };
  const control = await get(tx, "mapSourceBridgeControl", "global:bridge");
  if (control?.producerEnabled !== true)
    throw new Error("BRIDGE_PRODUCER_PAUSED");
  const id = digest("account-delete-phase2", ownerAccountId);
  await put(tx, "mapSourceBridgeState", `account:${digest(ownerAccountId)}`, {
    kind: "ACCOUNT_TOMBSTONE",
    ownerAccountId,
    deletionLatch: true,
    createdAt: new Date(nowMs).toISOString(),
  });
  await put(tx, "mapSourceOutbox", id, {
    kind: "ACCOUNT_EVENT",
    eventId: id,
    ownerAccountId,
    status: "PENDING",
    stage: "ACCOUNT_SWEEP",
    attempts: 0,
    createdAt: new Date(nowMs).toISOString(),
    nextAttemptAt: new Date(nowMs).toISOString(),
  });
  await put(tx, "mapControlState", "global:read-stop", {
    kind: "READ_STOP",
    stopped: true,
  });
  const epoch = await get(tx, "mapControlState", "global:read-epoch");
  if (
    !Number.isSafeInteger(epoch?.epoch) ||
    !Number.isSafeInteger(epoch?.mutationRevision)
  )
    throw new Error("BRIDGE_REVISION_FENCE_UNAVAILABLE");
  await put(tx, "mapControlState", "global:read-epoch", {
    ...epoch,
    epoch: epoch.epoch + 1,
    mutationRevision: epoch.mutationRevision + 1,
  });
  return { enabled: true, eventId: id };
};
// A delayed device intent must wake a previously skipped source. A repeated ACK
// of the same trusted confirmation never creates another revision.
const enqueueUploadIntent = async ({
  tx,
  env = {},
  recordId,
  ownerAccountId,
  confirmedAt,
  nowMs,
}) => {
  if (env.ICHI_V2_BRIDGE_PRODUCER_ENABLED !== "true") return { enabled: false };
  const control = await get(tx, "mapSourceBridgeControl", "global:bridge");
  if (control?.producerEnabled !== true) return { enabled: false };
  const before = await get(tx, "mapSourceBridgeState", stateId(recordId));
  if (before?.uploadSharingConfirmedAt === confirmedAt)
    return { enabled: true, duplicate: true };
  const result = await enqueueSourceChange({
    tx,
    env,
    recordId,
    ownerAccountId,
    reason: "UPLOAD_INTENT",
    nowMs,
  });
  const state = await get(tx, "mapSourceBridgeState", stateId(recordId));
  await put(tx, "mapSourceBridgeState", stateId(recordId), {
    ...state,
    uploadSharingConfirmedAt: confirmedAt,
  });
  return result;
};
// A profile update refreshes every previously/currently uploaded own source.
// It never accepts terms, creates a per-record choice, or grants admin roles.
const enqueueProfileChange = async ({ tx, env, ownerAccountId, nowMs }) => {
  if (env.ICHI_V2_BRIDGE_PRODUCER_ENABLED !== "true") return { enabled: false };
  const policy = await get(tx, "mapControlState", "global:policy");
  const terms = policy?.terms;
  if (
    terms?.uploadSharingScope !== "UPLOADED_V1_RECORDS" ||
    terms.rightsAttestationIncluded !== true
  )
    return { enabled: false };
  const consent = await get(
    tx,
    "mapContributionConsents",
    digest("consent", ownerAccountId, terms.version),
  );
  if (
    consent?.ownerAccountId !== ownerAccountId ||
    consent.accepted !== true ||
    consent.termsVersion !== terms.version ||
    consent.scopeDigest !== terms.scopeDigest ||
    consent.uploadSharingScope !== terms.uploadSharingScope ||
    consent.rightsAttested !== true ||
    !Number.isFinite(Date.parse(consent.acceptedAt)) ||
    Date.parse(consent.acceptedAt) > nowMs
  )
    return { enabled: false };
  const eventId = digest(
    "consent-source-wake-v1",
    ownerAccountId,
    terms.version,
    terms.scopeDigest,
  );
  const at = new Date(nowMs).toISOString();
  await put(tx, "mapSourceOutbox", eventId, {
    kind: "CONSENT_EVENT",
    eventId,
    ownerAccountId,
    termsVersion: terms.version,
    scopeDigest: terms.scopeDigest,
    cursor: "",
    status: "PENDING",
    stage: "CONSENT_SWEEP",
    attempts: 0,
    createdAt: at,
    nextAttemptAt: at,
  });
  const epoch = await get(tx, "mapControlState", "global:read-epoch");
  if (
    !Number.isSafeInteger(epoch?.epoch) ||
    !Number.isSafeInteger(epoch.mutationRevision)
  )
    throw new Error("BRIDGE_REVISION_FENCE_UNAVAILABLE");
  await put(tx, "mapControlState", "global:read-epoch", {
    ...epoch,
    epoch: epoch.epoch + 1,
    mutationRevision: epoch.mutationRevision + 1,
  });
  return { enabled: true, eventId };
};

module.exports = {
  enqueueProfileChange,
  digest,
  lineageId,
  stateId,
  get,
  put,
  enqueueSourceChange,
  enqueueAccountDeletion,
  enqueueUploadIntent,
};
