import { readDoc } from "./db.mjs";
import { hashId } from "./verified-fixture.mjs";

const publicSafeContributor = (fixture) => {
  const value = fixture.publicSafeContributor;
  if (
    value?.approved === true &&
    typeof value.displayName === "string" &&
    value.displayName.trim().length > 0 &&
    value.displayName.length <= 40 &&
    value.avatar?.kind === "FALLBACK_ASSET" &&
    value.avatar.path === "/assets/v1-29/ichi-avatar.png"
  )
    return { displayName: value.displayName.trim(), avatar: value.avatar };
  return {
    displayName: "ICHI 玩家",
    avatar: {
      kind: "FALLBACK_ASSET",
      path: "/assets/v1-29/ichi-avatar.png",
    },
  };
};

export const contributionSourceEligible = (fixture, upload) => {
  const gates = fixture?.publicGates;
  return (
    upload?.shareDecision === "SHARE" &&
    upload.validationState === "VERIFIED" &&
    upload.lifecycle === "ACTIVE" &&
    fixture?.dataOrigin === "SYNTHETIC_REHEARSAL" &&
    fixture.lifecycleState === "CURRENT" &&
    gates?.sourceCurrent === true &&
    gates.rightsEligible === true &&
    gates.publicEligible === true &&
    gates.moderationVisible === true &&
    gates.deleted !== true &&
    fixture.publicLocation?.coordinateSystem === "GCJ02" &&
    Number.isFinite(fixture.publicLocation.latitude) &&
    Number.isFinite(fixture.publicLocation.longitude)
  );
};

export const contributionEligible = (fixture, upload, consent, policy) =>
  contributionSourceEligible(fixture, upload) &&
  consent?.kind === "STATE" &&
  consent.ownerSubjectDigest === upload.ownerSubjectDigest &&
  consent.dataOrigin === "SYNTHETIC_REHEARSAL" &&
  consent.accepted === true &&
  consent.acceptedTermsVersion === policy?.version &&
  consent.acceptedScopeDigest === policy?.scopeDigest;

export const activateContribution = async (
  tx,
  upload,
  fixture,
  boardInstanceId,
  observedAt,
  nowMs,
) => {
  if (!contributionSourceEligible(fixture, upload))
    return { ok: true, contributionId: null, eligible: false };
  const contributionId = hashId("contribution", upload.candidateRecordRef);
  const ledger = tx.collection("v2ShadowContributionLedger");
  const previous = await readDoc(ledger, contributionId);
  if (previous?.lifecycle === "DELETED" || previous?.noResurrection === true)
    return { ok: false, code: "CONTRIBUTION_DELETED" };
  if (
    previous &&
    (previous.ownerSubjectDigest !== upload.ownerSubjectDigest ||
      previous.candidateRecordRef !== upload.candidateRecordRef ||
      previous.boardInstanceId !== boardInstanceId)
  )
    return { ok: false, code: "CONTRIBUTION_CONFLICT" };
  if (!Number.isFinite(Date.parse(observedAt)))
    return { ok: false, code: "OBSERVED_AT_INVALID" };
  const at = new Date(nowMs).toISOString();
  await ledger.doc(contributionId).set({
    data: {
      kind: "STATE",
      contributionId,
      candidateRecordRef: upload.candidateRecordRef,
      fixtureId: upload.fixtureId,
      ownerSubjectDigest: upload.ownerSubjectDigest,
      boardInstanceId,
      observationVersionId: upload.observationVersionId,
      observationVersion: upload.observationVersion,
      shareDecision: "SHARE",
      validationState: upload.validationState,
      eligible: true,
      lifecycle: "ACTIVE",
      observedAt,
      publicSafeNote:
        fixture.publicSafeNoteApproved === true &&
        typeof fixture.publicSafeNote === "string" &&
        fixture.publicSafeNote.length <= 500
          ? fixture.publicSafeNote
          : null,
      contributor: publicSafeContributor(fixture),
      sourceType: fixture.publication?.sourcePath || "SYNTHETIC_UPLOAD",
      createdAt: previous?.createdAt || at,
      updatedAt: at,
      dataOrigin: "SYNTHETIC_REHEARSAL",
    },
  });
  if (!previous) {
    await ledger
      .doc(
        hashId("contribution-audit", `${upload.candidateRecordRef}:activate`),
      )
      .set({
        data: {
          kind: "ACTIVATE_EVENT",
          auditVersion: 1,
          contributionId,
          candidateRecordRef: upload.candidateRecordRef,
          ownerSubjectDigest: upload.ownerSubjectDigest,
          boardInstanceId,
          at,
          dataOrigin: "SYNTHETIC_REHEARSAL",
        },
      });
  }
  await tx
    .collection("v2ShadowCandidateUploads")
    .doc(upload.candidateRecordRef)
    .set({
      data: {
        ...upload,
        boardInstanceId,
        contributionId,
        projectionState: "PENDING",
      },
    });
  return { ok: true, contributionId, eligible: true };
};
