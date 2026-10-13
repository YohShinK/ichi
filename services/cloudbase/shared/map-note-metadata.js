"use strict";
/* eslint-disable @typescript-eslint/no-require-imports */
const { createHash } = require("node:crypto");
const producer = require("./source-bridge-producer");
const digest = (...parts) =>
  createHash("sha256").update(parts.join("\0")).digest("hex");
// Original V1 identity storage contains a hash, never raw OpenID. Legacy note
// auditing uses this real caller's transient OpenID and stores only exact proof.
const syncOwnedMapNotes = async ({
  db,
  cloud,
  env,
  accountId,
  openId,
  nowMs,
}) => {
  if (env.ICHI_V2_BRIDGE_PRODUCER_ENABLED !== "true")
    return { hasMore: false, deferred: true };
  const policy = await producer.get(db, "mapControlState", "global:policy"),
    terms = policy?.terms;
  const consent = terms
    ? await producer.get(
        db,
        "mapContributionConsents",
        digest("consent", accountId, terms.version),
      )
    : null;
  if (
    terms?.uploadSharingScope !== "UPLOADED_V1_RECORDS" ||
    terms.rightsAttestationIncluded !== true ||
    consent?.accepted !== true ||
    consent.ownerAccountId !== accountId ||
    consent.termsVersion !== terms.version ||
    consent.scopeDigest !== terms.scopeDigest ||
    consent.uploadSharingScope !== terms.uploadSharingScope ||
    consent.rightsAttested !== true ||
    !Number.isFinite(Date.parse(consent.acceptedAt)) ||
    Date.parse(consent.acceptedAt) > nowMs
  )
    return { hasMore: false, deferred: false };
  const sweepId =
    "owner-notes:" + digest(accountId, terms.version, terms.scopeDigest);
  const prior = await producer.get(db, "mapSourceBridgeState", sweepId);
  if (prior?.completed === true) return { hasMore: false, deferred: false };
  const records =
    (
      await db
        .collection("observationCandidates")
        .where({
          ownerAccountId: accountId,
          recordId: db.command.gt(prior?.cursor ?? ""),
        })
        .orderBy("recordId", "asc")
        .limit(2)
        .get()
    ).data ?? [];
  let reviewed = 0;
  for (const r of records) {
    if (
      r.sourcePath !== "direct-upload" ||
      r.status !== "clue_submitted" ||
      !r.recognitionJobId ||
      !r.correctionSummary ||
      !r.finalSnapshot ||
      typeof r.locationNote !== "string" ||
      !r.locationNote.trim() ||
      r.locationNote.length > 200
    )
      continue;
    const h = digest(r.locationNote),
      id = "note:" + digest(r.recordId),
      cached = await producer.get(db, "mapSourceBridgeState", id);
    if (
      (r.directNoteReview?.contentHash === h &&
        r.directNoteReview.status === "NOTE_PASSED") ||
      (cached?.ownerDigest === digest(accountId) &&
        cached.contentHash === h &&
        ["NOTE_PASSED", "NOTE_REJECTED"].includes(cached.status))
    )
      continue;
    let result;
    try {
      result = await cloud.openapi.security.msgSecCheck({
        content: r.locationNote,
        version: 2,
        scene: 2,
        openid: openId,
      });
    } catch (error) {
      const code = String(error?.errCode ?? error?.code ?? "UNKNOWN");
      return {
        hasMore: true,
        deferred: true,
        reviewed,
        deferredReason: /^[A-Za-z0-9_-]{1,40}$/u.test(code)
          ? code
          : "OPENAPI_UNAVAILABLE",
      };
    }
    const suggest = result?.result?.suggest ?? result?.suggest;
    if (!["pass", "review", "risky"].includes(suggest))
      return { hasMore: true, deferred: true, reviewed };
    const changed = await db.runTransaction(async (tx) => {
      const fresh = await producer.get(tx, "observationCandidates", r.recordId),
        account = await producer.get(tx, "accounts", accountId),
        current = await producer.get(
          tx,
          "mapContributionConsents",
          digest("consent", accountId, terms.version),
        );
      if (
        account?.status !== "active" ||
        fresh?.ownerAccountId !== accountId ||
        fresh.status !== "clue_submitted" ||
        digest(fresh.locationNote ?? "") !== h ||
        current?.accepted !== true ||
        current.scopeDigest !== terms.scopeDigest ||
        (await producer.get(tx, "deletionJobs", "record:" + r.recordId)) ||
        (await producer.get(tx, "deletionJobs", "account:" + accountId))
      )
        throw new Error("METADATA_SOURCE_CHANGED");
      const proof = await producer.get(tx, "mapSourceBridgeState", id);
      if (
        proof?.ownerDigest === digest(accountId) &&
        proof.contentHash === h &&
        ["NOTE_PASSED", "NOTE_REJECTED"].includes(proof.status)
      )
        return false;
      await tx
        .collection("mapSourceBridgeState")
        .doc(id)
        .set({
          data: {
            kind: "NOTE_METADATA",
            ownerDigest: digest(accountId),
            contentHash: h,
            status: suggest === "pass" ? "NOTE_PASSED" : "NOTE_REJECTED",
            reviewedAt: new Date(nowMs).toISOString(),
          },
        });
      await producer.enqueueSourceChange({
        tx,
        env,
        recordId: r.recordId,
        ownerAccountId: accountId,
        reason: "LEGACY_NOTE_AUDITED",
        nowMs,
      });
      return true;
    });
    if (changed) reviewed++;
  }
  await db.runTransaction(async (tx) => {
    const current = await producer.get(tx, "mapSourceBridgeState", sweepId);
    if ((current?.cursor ?? "") !== (prior?.cursor ?? "")) return;
    await tx
      .collection("mapSourceBridgeState")
      .doc(sweepId)
      .set({
        data: {
          kind: "OWNER_NOTE_SWEEP",
          ownerDigest: digest(accountId),
          cursor: records[records.length - 1]?.recordId ?? prior?.cursor ?? "",
          completed: records.length < 2,
        },
      });
  });
  return { hasMore: records.length === 2, deferred: false, reviewed };
};
module.exports = { syncOwnedMapNotes };
