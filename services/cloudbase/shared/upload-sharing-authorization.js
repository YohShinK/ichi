"use strict";
/* eslint-disable @typescript-eslint/no-require-imports */
const domain = require("./domain");
const { get, put, enqueueUploadIntent } = require("./source-bridge-producer");
const UPLOAD_SHARING_DISCLOSURE_VERSION =
  "upload-confirmation-map-sharing-20261003-v2";

// V1 receives the original upload's intent even when V2 consent/services are off.
// This is private V1 evidence; it never creates V2 data or a public marker.
const persistUploadSharing = async ({
  tx,
  recordId,
  accountId,
  intent,
  nowMs,
  env = {},
}) => {
  if (intent === undefined) return false;
  domain.assert(
    intent?.rightsAttested === true &&
      intent.disclosureVersion === UPLOAD_SHARING_DISCLOSURE_VERSION,
    "UPLOAD_SHARING_DISCLOSURE_INVALID",
  );
  const record = await get(tx, "observationCandidates", recordId);
  const account = await get(tx, "accounts", accountId);
  domain.assert(
    account?.status === "active" &&
      record?.ownerAccountId === accountId &&
      !["deleting", "deleted", "superseded"].includes(record.status),
    "RECORD_NOT_FOUND",
  );
  domain.assert(
    !(await get(tx, "deletionJobs", `record:${recordId}`)) &&
      !(await get(tx, "deletionJobs", `account:${accountId}`)),
    "RECORD_DELETED",
  );
  if (
    record.uploadSharingAuthorization?.disclosureVersion ===
      UPLOAD_SHARING_DISCLOSURE_VERSION &&
    record.uploadSharingAuthorization.rightsAttested === true
  ) {
    await enqueueUploadIntent({
      tx,
      env,
      recordId,
      ownerAccountId: accountId,
      confirmedAt: record.uploadSharingAuthorization.confirmedAt,
      nowMs,
    });
    return true;
  }
  const confirmedAt = new Date(nowMs).toISOString();
  await put(tx, "observationCandidates", recordId, {
    ...record,
    uploadSharingAuthorization: {
      shareIntent: "SHARE",
      rightsAttested: true,
      followCurrentVersion: true,
      disclosureVersion: UPLOAD_SHARING_DISCLOSURE_VERSION,
      authorizationBasis: "EXPLICIT_UPLOAD_CONFIRMATION",
      confirmedAt,
    },
  });
  await enqueueUploadIntent({
    tx,
    env,
    recordId,
    ownerAccountId: accountId,
    confirmedAt,
    nowMs,
  });
  return true;
};
const readUploadSharing = async (tx, recordId, accountId) => {
  const record = await get(tx, "observationCandidates", recordId);
  const proof = record?.uploadSharingAuthorization;
  return (
    record?.ownerAccountId === accountId &&
    proof?.shareIntent === "SHARE" &&
    proof.rightsAttested === true &&
    proof.followCurrentVersion === true &&
    proof.disclosureVersion === UPLOAD_SHARING_DISCLOSURE_VERSION
  );
};
module.exports = {
  persistUploadSharing,
  readUploadSharing,
  UPLOAD_SHARING_DISCLOSURE_VERSION,
};
