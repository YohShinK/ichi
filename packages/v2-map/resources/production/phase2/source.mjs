import { hash, read } from "../shared/security.mjs";
import { verifiedObservation, SOURCE_SCHEMA } from "../shared/domain.mjs";
import { profileCacheId, noteCacheId, profileVersion } from "./metadata.mjs";
import {
  coversUploadedV1,
  uploadedV1ConsentAccepted,
} from "../shared/uploaded-v1-consent.mjs";

export const PLAYER_SCHEMA = "map-player-source-phase2-v1";
export const lineageId = (recordId) => hash("player-source-phase2", recordId);
export const stateId = (recordId) => `source:${lineageId(recordId)}`;
export const stable = (value) =>
  JSON.stringify(value, (_key, item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(
          Object.keys(item)
            .sort()
            .map((k) => [k, item[k]]),
        )
      : item,
  );
const instant = (value, nowMs) =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}T/u.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  Date.parse(value) <= nowMs;
const text = (value, max = 200) =>
  typeof value === "string" && value.trim() && value.length <= max;
const count = (v) => Number.isSafeInteger(v) && v >= 0;
const reject = (reason, fingerprint = null) => ({
  ok: false,
  reason,
  fingerprint,
});

// Only authoritative, current V1 documents enter this module. Clients provide IDs,
// never these facts, coordinates, verification status, timestamps or ownership.
export const loadSource = async (db, recordId) => {
  const record = await read(db.collection("observationCandidates"), recordId);
  const version = record?.publishedSubmissionVersion;
  const submissionId =
    record?.sourcePath === "assisted-draw" && count(version) && version > 0
      ? `prize-ticket:${recordId}:${record.boardId}:${version}`
      : null;
  return {
    recordId,
    record,
    submissionId,
    submission: submissionId
      ? await read(db.collection("drawSubmissions"), submissionId)
      : null,
    deletion: await read(db.collection("deletionJobs"), `record:${recordId}`),
    accountDeletion: record?.ownerAccountId
      ? await read(
          db.collection("deletionJobs"),
          `account:${record.ownerAccountId}`,
        )
      : null,
    account: record?.ownerAccountId
      ? await read(db.collection("accounts"), record.ownerAccountId)
      : null,
    profile: record?.ownerAccountId
      ? await read(db.collection("profiles"), record.ownerAccountId)
      : null,
    profileMetadata: record?.ownerAccountId
      ? await read(
          db.collection("mapSourceBridgeState"),
          profileCacheId(record.ownerAccountId),
        )
      : null,
    noteMetadata: await read(
      db.collection("mapSourceBridgeState"),
      noteCacheId(recordId),
    ),
    tombstone: record?.ownerAccountId
      ? await read(
          db.collection("mapSourceBridgeState"),
          `account:${hash(record.ownerAccountId)}`,
        )
      : null,
  };
};
export const sourceFingerprint = (s) =>
  hash(
    PLAYER_SCHEMA,
    stable({
      recordId: s.recordId,
      record: s.record
        ? Object.fromEntries(
            [
              "recordId",
              "ownerAccountId",
              "boardId",
              "sourcePath",
              "status",
              "publicationState",
              "publicationStatus",
              "publishedSubmissionVersion",
              "verificationStatus",
              "observedAt",
              "location",
              "initialSnapshot",
              "finalSnapshot",
              "recognitionJobId",
              "correctionSummary",
              "serverReceivedAt",
              "uploadSharingAuthorization",
              "directNoteReview",
              "locationNote",
            ].map((k) => [k, s.record[k]]),
          )
        : null,
      submissionId: s.submissionId,
      submission: s.submission
        ? Object.fromEntries(
            [
              "verificationId",
              "recordId",
              "boardId",
              "ownerAccountId",
              "submissionVersion",
              "status",
              "finalSnapshot",
              "authoritativeDrawEvents",
              "photoReview",
              "locationReview",
              "ticketLocation",
              "noteReview",
              "userNote",
              "userNoteHash",
              "approvedAt",
              "createdAt",
            ].map((k) => [k, s.submission[k]]),
          )
        : null,
      deleted: !!s.deletion || !!s.accountDeletion || !!s.tombstone,
      accountStatus: s.account?.status ?? null,
      profileVersion: profileVersion(s.profile),
      profileMetadata: s.profileMetadata,
      noteMetadata: s.noteMetadata,
    }),
  );

const facts = (snapshot, initial = snapshot) => {
  if (
    !snapshot ||
    !initial ||
    !Array.isArray(snapshot.tiers) ||
    snapshot.tiers.length < 1 ||
    snapshot.tiers.length > 100
  )
    return null;
  const r2 = snapshot.schemaVersion === "board-record-r2-1.0.0";
  if (
    r2 &&
    (snapshot.recognitionVersion !== "R2" || snapshot.currency !== "CNY")
  )
    return null;
  const ipName = r2 ? snapshot.ipName : snapshot.ip;
  const themeName = (r2 ? snapshot.themeName : snapshot.theme) || null;
  const price = snapshot.pricePerDraw;
  const priceMinor = price === null ? null : Math.round(price * 100);
  if (
    !text(ipName) ||
    !(themeName === null || text(themeName)) ||
    !(
      price === null ||
      (Number.isFinite(price) &&
        price > 0 &&
        count(priceMinor) &&
        Math.abs(price * 100 - priceMinor) < 1e-6)
    )
  )
    return null;
  const seen = new Set();
  const tiers = [];
  for (const t of snapshot.tiers) {
    const tierCode = r2 ? t.tierCode : t.tierId;
    const first = initial.tiers?.find(
      (i) => (r2 ? i.tierCode : i.tierId) === tierCode,
    );
    const remainingTickets = r2 ? t.remainingTickets : t.remaining;
    const observedStartTickets = r2
      ? first?.remainingTickets
      : first?.remaining;
    // R2 contains current remaining counts, not manufacturer initial ticket slots.
    // The private first snapshot is a subtraction baseline only, never an invented
    // public initial total or identity fact.
    const initialRemainingTickets = !r2 && count(t.total) ? t.total : null;
    // Historical legacy rows without a user-selected grand-prize classification
    // are rejected rather than assigning a prize class by tier label.
    if (
      !text(tierCode, 32) ||
      seen.has(tierCode) ||
      !count(remainingTickets) ||
      !count(observedStartTickets) ||
      remainingTickets > observedStartTickets ||
      (initialRemainingTickets !== null &&
        remainingTickets > initialRemainingTickets) ||
      typeof t.isGrandPrize !== "boolean"
    )
      return null;
    seen.add(tierCode);
    tiers.push({
      tierCode,
      rawLabel: text(t.rawLabel) ? t.rawLabel : null,
      initialRemainingTickets,
      remainingTickets,
      isGrandPrize: t.isGrandPrize,
    });
  }
  return {
    schemaVersion: "player-board-facts-phase2-v1",
    ipName,
    themeName,
    pricePerDrawMinor: priceMinor,
    tiers,
  };
};
const drawConsistent = (s, f, initial) => {
  const start = facts(initial, initial);
  if (
    !start ||
    start.ipName !== f.ipName ||
    start.themeName !== f.themeName ||
    start.pricePerDrawMinor !== f.pricePerDrawMinor ||
    start.tiers.length !== f.tiers.length ||
    f.tiers.some(
      (t) =>
        !start.tiers.some(
          (i) =>
            i.tierCode === t.tierCode &&
            i.rawLabel === t.rawLabel &&
            i.isGrandPrize === t.isGrandPrize,
        ),
    )
  )
    return false;
  if (
    !Array.isArray(s.authoritativeDrawEvents) ||
    s.authoritativeDrawEvents.length > 5000
  )
    return false;
  const ids = new Set();
  const counts = new Map();
  for (const event of s.authoritativeDrawEvents) {
    if (
      !text(event.eventId) ||
      ids.has(event.eventId) ||
      !f.tiers.some((t) => t.tierCode === event.tierCode)
    )
      return false;
    ids.add(event.eventId);
    counts.set(event.tierCode, (counts.get(event.tierCode) ?? 0) + 1);
  }
  return f.tiers.every(
    (t) =>
      start.tiers.find((i) => i.tierCode === t.tierCode).remainingTickets -
        (counts.get(t.tierCode) ?? 0) ===
      t.remainingTickets,
  );
};

export const normalizeSource = (s, nowMs) => {
  const fingerprint = sourceFingerprint(s);
  const r = s.record;
  if (s.deletion || s.accountDeletion || s.tombstone)
    return reject("SOURCE_DELETED", fingerprint);
  if (
    !r ||
    r.recordId !== s.recordId ||
    !text(r.ownerAccountId) ||
    !text(r.boardId)
  )
    return reject("SOURCE_MISSING", fingerprint);
  if (
    s.deletion ||
    s.accountDeletion ||
    s.tombstone ||
    s.account?.status !== "active" ||
    ["deleting", "deleted"].includes(r.status) ||
    r.publicationStatus === "deleted"
  )
    return reject("SOURCE_DELETED", fingerprint);
  if (!["direct-upload", "assisted-draw"].includes(r.sourcePath))
    return reject("SOURCE_PATH_INVALID", fingerprint);
  if (!instant(r.observedAt, nowMs))
    return reject("OBSERVATION_TIME_INVALID", fingerprint);
  const l = r.location;
  if (
    !l ||
    !["gcj02", "GCJ02"].includes(l.coordinateSystem) ||
    l.source !== "camera" ||
    !Number.isFinite(l.latitude) ||
    Math.abs(l.latitude) > 90 ||
    !Number.isFinite(l.longitude) ||
    Math.abs(l.longitude) > 180 ||
    !Number.isFinite(l.accuracy) ||
    l.accuracy < 0 ||
    !instant(l.capturedAt, nowMs) ||
    !text(l.consentVersion)
  )
    return reject("LOCATION_EVIDENCE_INVALID", fingerprint);
  let snapshot, initial, verifiedAt, verificationId;
  let note = null;
  if (r.sourcePath === "direct-upload") {
    if (
      r.status !== "clue_submitted" ||
      !text(r.recognitionJobId) ||
      !r.correctionSummary ||
      !r.finalSnapshot
    )
      return reject("DIRECT_NOT_FINALIZED", fingerprint);
    snapshot = r.finalSnapshot;
    initial = snapshot;
    verifiedAt = r.serverReceivedAt;
    verificationId = hash(
      "direct-finalization",
      r.recognitionJobId,
      fingerprint,
    );
    const review =
      r.directNoteReview?.contentHash === hash(r.locationNote ?? "")
        ? r.directNoteReview
        : s.noteMetadata?.ownerDigest === hash(r.ownerAccountId) &&
            s.noteMetadata?.contentHash === hash(r.locationNote ?? "")
          ? s.noteMetadata
          : null;
    if (
      text(r.locationNote) &&
      review?.status === "NOTE_PASSED" &&
      instant(review.reviewedAt, nowMs)
    )
      note = {
        text: r.locationNote,
        safetyProvenance: {
          decision: "NOTE_PASSED",
          contentHash: hash(r.locationNote),
          decisionVersion: `v1-note:${hash(review.reviewedAt, review.contentHash)}`,
        },
      };
  } else {
    const d = s.submission;
    if (
      r.publicationState !== "current" ||
      r.verificationStatus !== "APPROVED" ||
      !count(r.publishedSubmissionVersion) ||
      r.publishedSubmissionVersion < 1 ||
      !d ||
      d.verificationId !== s.submissionId ||
      d.recordId !== r.recordId ||
      d.boardId !== r.boardId ||
      d.ownerAccountId !== r.ownerAccountId ||
      d.submissionVersion !== r.publishedSubmissionVersion ||
      d.status !== "APPROVED" ||
      d.photoReview?.status !== "PHOTO_PASSED" ||
      d.locationReview?.status !== "LOCATION_PASSED"
    )
      return reject("EXACT_APPROVED_SUBMISSION_REQUIRED", fingerprint);
    snapshot = d.finalSnapshot;
    initial = r.initialSnapshot;
    verifiedAt = d.approvedAt;
    verificationId = d.verificationId;
    if (
      text(d.userNote) &&
      d.userNote.length <= 200 &&
      d.noteReview?.status === "NOTE_PASSED" &&
      d.userNoteHash === hash(d.userNote) &&
      instant(d.noteReview.reviewedAt, nowMs)
    )
      note = {
        text: d.userNote,
        safetyProvenance: {
          decision: "NOTE_PASSED",
          contentHash: d.userNoteHash,
          decisionVersion: `v1-note:${hash(d.noteReview.reviewedAt, d.userNoteHash)}`,
        },
      };
  }
  const boardFacts = facts(snapshot, initial);
  if (
    !boardFacts ||
    (r.sourcePath === "assisted-draw" &&
      !drawConsistent(s.submission, boardFacts, initial))
  )
    return reject("BOARD_FACTS_INVALID", fingerprint);
  if (!instant(verifiedAt, nowMs))
    return reject("VERIFICATION_TIME_INVALID", fingerprint);
  return {
    ok: true,
    schemaVersion: PLAYER_SCHEMA,
    fingerprint,
    recordId: r.recordId,
    ownerAccountId: r.ownerAccountId,
    lineageId: lineageId(r.recordId),
    sourceVersion: `${r.sourcePath}:${fingerprint}`,
    recordType:
      r.sourcePath === "direct-upload" ? "UPLOAD_RECORD" : "DRAW_RECORD",
    originSourcePath: r.sourcePath,
    observedAt: r.observedAt,
    observedAtBasis: "V1_CURRENT_RECORD_OBSERVED_AT",
    location: {
      coordinateSystem: "GCJ02",
      latitude: l.latitude,
      longitude: l.longitude,
      accuracyMeters: l.accuracy,
      capturedAt: l.capturedAt,
    },
    boardFacts,
    verificationId,
    verifiedAt,
    uploadedAt: instant(
      r.sourcePath === "assisted-draw"
        ? s.submission?.createdAt
        : r.serverReceivedAt,
      nowMs,
    )
      ? r.sourcePath === "assisted-draw"
        ? s.submission.createdAt
        : r.serverReceivedAt
      : null,
    contributor:
      s.profile?.accountId === r.ownerAccountId &&
      s.profile.profileState === "complete" &&
      text(s.profile.nickname, 32)
        ? {
            displayName: s.profile.nickname,
            avatar:
              s.profileMetadata?.profileVersion === profileVersion(s.profile) &&
              s.profileMetadata?.ownerDigest === hash(r.ownerAccountId) &&
              s.profileMetadata?.avatar
                ? s.profileMetadata.avatar
                : {
                    kind: "FALLBACK_ASSET",
                    path: "/assets/v1-29/ichi-avatar.png",
                  },
          }
        : null,
    note: note ?? { text: null, safetyProvenance: null },
  };
};

export const authorizeSource = async (
  db,
  source,
  policy,
  bridge,
  nowMs = Date.now(),
) => {
  if (!source.ok) return source;
  let permission = await read(
    db.collection("mapPlayerSourcePermissions"),
    source.lineageId,
  );
  const terms = policy?.terms;
  let permissionFromUpload = false;
  const record = await read(
    db.collection("observationCandidates"),
    source.recordId,
  );
  const intent = record?.uploadSharingAuthorization;
  if (
    permission?.shareIntent !== "DO_NOT_SHARE" &&
    record?.ownerAccountId === source.ownerAccountId &&
    intent?.authorizationBasis === "EXPLICIT_UPLOAD_CONFIRMATION" &&
    intent.shareIntent === "SHARE" &&
    intent.disclosureVersion ===
      "upload-confirmation-map-sharing-20261003-v2" &&
    intent.rightsAttested === true &&
    intent.followCurrentVersion === true &&
    instant(intent.confirmedAt, nowMs) &&
    (!permission ||
      permission.termsVersion !== terms?.version ||
      permission.scopeDigest !== terms?.scopeDigest)
  ) {
    permissionFromUpload = true;
    permission = {
      recordId: source.recordId,
      lineageId: source.lineageId,
      ownerAccountId: source.ownerAccountId,
      shareIntent: "SHARE",
      rightsAttested: true,
      followCurrentVersion: true,
      termsVersion: terms?.version,
      scopeDigest: terms?.scopeDigest,
      authorizationBasis: "V1_UPLOAD_CONFIRMATION_AND_ACCOUNT_CONSENT",
      createdAt: intent.confirmedAt,
    };
  }
  const consent = terms?.version
    ? await read(
        db.collection("mapContributionConsents"),
        hash("consent", source.ownerAccountId, terms.version),
      )
    : null;
  if (
    record?.ownerAccountId === source.ownerAccountId &&
    uploadedV1ConsentAccepted(consent, terms, source.ownerAccountId, nowMs)
  ) {
    // Completed V1 uploads already express sharing. Explicit current account
    // terms cover prior/current uploads; missing legacy per-record fields are
    // not a second consent gate. Never persist a fabricated V1 upload proof.
    permissionFromUpload = true;
    permission = {
      recordId: source.recordId,
      lineageId: source.lineageId,
      ownerAccountId: source.ownerAccountId,
      shareIntent: "SHARE",
      rightsAttested: true,
      followCurrentVersion: true,
      termsVersion: terms.version,
      scopeDigest: terms.scopeDigest,
      authorizationBasis: "UPLOADED_V1_AND_EXPLICIT_ACCOUNT_CONSENT",
      createdAt: consent.acceptedAt,
    };
  }
  if (
    !terms?.version ||
    !/^[a-f0-9]{64}$/u.test(terms.scopeDigest ?? "") ||
    permission?.ownerAccountId !== source.ownerAccountId ||
    permission.recordId !== source.recordId ||
    permission.shareIntent !== "SHARE" ||
    permission.followCurrentVersion !== true ||
    permission.rightsAttested !== true ||
    permission.termsVersion !== terms.version ||
    permission.scopeDigest !== terms.scopeDigest ||
    consent?.accepted !== true ||
    consent.ownerAccountId !== source.ownerAccountId ||
    consent.termsVersion !== terms.version ||
    consent.scopeDigest !== terms.scopeDigest ||
    (coversUploadedV1(terms) &&
      !uploadedV1ConsentAccepted(consent, terms, source.ownerAccountId, nowMs))
  )
    return reject("SHARE_AUTHORIZATION_REQUIRED", source.fingerprint);
  const p = bridge?.locationPolicy;
  if (
    !text(p?.version) ||
    !text(p.ruleId) ||
    p.precisionMode !== "APPROXIMATE" ||
    !Number.isFinite(p.gridDegrees) ||
    p.gridDegrees <= 0 ||
    p.gridDegrees > 1 ||
    !Number.isFinite(p.maxAccuracyMeters) ||
    p.maxAccuracyMeters <= 0 ||
    source.location.accuracyMeters > p.maxAccuracyMeters
  )
    return reject(
      "PUBLIC_LOCATION_POLICY_UNBOUND_OR_INELIGIBLE",
      source.fingerprint,
    );
  const round = (n) =>
    Number((Math.round(n / p.gridDegrees) * p.gridDegrees).toFixed(8));
  const publicLocation = {
    coordinateSystem: "GCJ02",
    latitude: round(source.location.latitude),
    longitude: round(source.location.longitude),
    precisionMode: "APPROXIMATE",
    areaLabel: null,
    locationPolicyVersion: p.version,
    projectionRuleId: p.ruleId,
  };
  const id = hash(
    "player-observation-phase2",
    source.lineageId,
    source.sourceVersion,
    stable({ terms, location: p }),
  );
  const verifiedBoardVersion = hash(
    "player-verified-phase2",
    id,
    policy.verificationVersion,
  );
  const o = {
    schemaVersion: SOURCE_SCHEMA,
    kind: "OBSERVATION_VERSION",
    observationVersionId: id,
    lineageId: source.lineageId,
    sourceVersion: `${source.sourceVersion}:${hash(stable({ terms, location: p }))}`,
    source: {
      family: "PLAYER",
      ownerAccountId: source.ownerAccountId,
      recordType: source.recordType,
      originSourcePath: source.originSourcePath,
      sourceVersion: `${source.sourceVersion}:${hash(stable({ terms, location: p }))}`,
      shareIntent: "SHARE",
    },
    input: {
      observationVersionId: id,
      privateLineageId: source.lineageId,
      ownerAccountId: source.ownerAccountId,
      observedAt: source.observedAt,
      verificationInputOnly: true,
      location: source.location,
      boardFacts: source.boardFacts,
      note: source.note,
    },
    lifecycleState: "CURRENT",
    sourceCurrent: true,
    locationKey: hash("location", stable(publicLocation)),
    rightsEligible: true,
    verification: {
      result: "VERIFIED",
      verifiedBoardVersion,
      verifiedBoardId: hash("player-board", source.lineageId),
      verificationId: source.verificationId,
      verifiedAt: source.verifiedAt,
      policyVersion: policy.verificationVersion,
    },
    publicProjection: {
      observationVersionId: id,
      verifiedBoardVersion,
      eligibilityDecision: "PASS",
      eligibilityDecisionVersion: "player-eligibility-phase2-v1",
      publicFieldClassificationVersion: "public-map-v3",
      locationPolicyVersion: p.version,
      boardShortLabel: source.boardFacts.ipName,
      venueNote: source.note.text,
      uploadedAt: source.uploadedAt,
      contributors: source.contributor ? [source.contributor] : [],
      contributorProjectionOwnerAccountId: source.ownerAccountId,
      contributorProjectionVersion: "v1-profile-metadata-v1",
      publicLocation,
    },
  };
  return verifiedObservation(o)
    ? {
        ok: true,
        source,
        observation: o,
        ...(permissionFromUpload ? { permissionFromUpload: permission } : {}),
      }
    : reject("VERIFICATION_REJECTED", source.fingerprint);
};
