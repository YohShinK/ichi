import { validateBoardFacts } from "../../../src/source-adapters.js";
import { hash } from "../shared/security.mjs";
import { stable } from "../phase2/source.mjs";

export const NETWORK_SOURCE_SCHEMA = "map-network-source-phase3-v1";
export const NETWORK_POLICY_VERSION = "network-visibility-30d-v1";
export const NETWORK_SERVING_SCHEMA = "public-map-v4";
export const SHARED_BOARD_FACTS_SCHEMA = "player-board-facts-phase2-v1";
export const networkObservationSourceVersion = (r, approval, rights) =>
  hash(
    "network-version",
    r.sourceVersion,
    networkContentDigest(r),
    approval.reviewVersion,
    rights.decisionVersion,
  );
export const NETWORK_PUBLIC_MAX_AGE_MS = 30 * 86400_000;
export const NETWORK_VENUE_LOCATION_VERSION =
  "network-batch10-venue-approximation-v1";
export const NETWORK_VENUE_LOCATION_RULE =
  "NETWORK_BATCH10_VENUE_APPROXIMATION_V1";
export const NETWORK_COLLECTION50_LOCATION_VERSION =
  "network-collection50-venue-approximation-v1";
export const NETWORK_COLLECTION50_LOCATION_RULE =
  "NETWORK_COLLECTION50_VENUE_APPROXIMATION_V1";
export const NETWORK_REVIEW_DELEGATION_VERSION =
  "network-user-review-delegation-50-v1";
export const NETWORK_WORKFLOW_LOCATION_VERSION =
  "network-workflow-venue-approximation-v1";
export const NETWORK_WORKFLOW_LOCATION_RULE =
  "NETWORK_WORKFLOW_VENUE_APPROXIMATION_V1";
export const NETWORK_WORKFLOW_DELEGATION_VERSION =
  "network-auto-clear-review-delegation-v1";
const text = (v, max = 200) =>
  typeof v === "string" && v.trim().length > 0 && v.length <= max;
const instant = (v) =>
  typeof v === "string" &&
  /^\d{4}-\d\d-\d\dT/u.test(v) &&
  Number.isFinite(Date.parse(v)) &&
  new Date(v).toISOString() === v;
const exactKeys = (v, keys) =>
  v &&
  typeof v === "object" &&
  !Array.isArray(v) &&
  Object.keys(v).every((k) => keys.includes(k));
export const networkSourceId = (sourceUrl, boardEvidenceKey) =>
  boardEvidenceKey === undefined
    ? hash("network-source-url", sourceUrl)
    : hash("network-source-url-board", sourceUrl, boardEvidenceKey);
export const networkContentDigest = (record) => hash(stable(record));
export const networkLocationDigest = (location) => hash(stable(location));
const venuePolicyValid = (
  p,
  version = NETWORK_VENUE_LOCATION_VERSION,
  ruleId = NETWORK_VENUE_LOCATION_RULE,
  maxSources = 10,
) =>
  p === undefined ||
  (exactKeys(p, ["version", "ruleId", "approvedSources"]) &&
    p.version === version &&
    p.ruleId === ruleId &&
    Array.isArray(p.approvedSources) &&
    p.approvedSources.length > 0 &&
    p.approvedSources.length <= maxSources &&
    new Set(p.approvedSources.map((s) => s.sourceId)).size ===
      p.approvedSources.length &&
    p.approvedSources.every(
      (s) =>
        exactKeys(s, ["sourceId", "sourceVersion", "locationDigest"]) &&
        /^[a-f0-9]{64}$/u.test(s.sourceId) &&
        text(s.sourceVersion) &&
        /^[a-f0-9]{64}$/u.test(s.locationDigest),
    ));
const venuePolicies = (p) =>
  [
    p?.venueApproximation,
    p?.collection50VenueApproximation,
    p?.workflowVenueApproximation,
  ].filter((v) => v !== undefined);
const venuePoliciesValid = (p) => {
  if (
    !venuePolicyValid(p?.venueApproximation) ||
    !venuePolicyValid(
      p?.collection50VenueApproximation,
      NETWORK_COLLECTION50_LOCATION_VERSION,
      NETWORK_COLLECTION50_LOCATION_RULE,
      50,
    ) ||
    !venuePolicyValid(
      p?.workflowVenueApproximation,
      NETWORK_WORKFLOW_LOCATION_VERSION,
      NETWORK_WORKFLOW_LOCATION_RULE,
      1000,
    )
  )
    return false;
  const legacy = [p?.venueApproximation, p?.collection50VenueApproximation]
    .filter(Boolean)
    .flatMap((v) => v.approvedSources);
  const entries = venuePolicies(p).flatMap((v) => v.approvedSources);
  return (
    legacy.length <= 50 &&
    new Set(entries.map((s) => s.sourceId)).size === entries.length
  );
};
const reviewDelegationValid = (
  p,
  version = NETWORK_REVIEW_DELEGATION_VERSION,
  maxSources = 50,
) =>
  p === undefined ||
  (exactKeys(p, [
    "version",
    "authorizationRef",
    "authorizedAt",
    "approvedSources",
  ]) &&
    p.version === version &&
    text(p.authorizationRef) &&
    instant(p.authorizedAt) &&
    Array.isArray(p.approvedSources) &&
    p.approvedSources.length > 0 &&
    p.approvedSources.length <= maxSources &&
    new Set(p.approvedSources.map((s) => s.sourceId)).size ===
      p.approvedSources.length &&
    p.approvedSources.every(
      (s) =>
        exactKeys(s, ["sourceId", "sourceVersion", "contentDigest"]) &&
        /^[a-f0-9]{64}$/u.test(s.sourceId) &&
        text(s.sourceVersion) &&
        /^[a-f0-9]{64}$/u.test(s.contentDigest),
    ));
export const networkPolicyValid = (p) =>
  p?.policyVersion === NETWORK_POLICY_VERSION &&
  p.servingSchemaVersion === NETWORK_SERVING_SCHEMA &&
  p.publicMaxAgeMs === NETWORK_PUBLIC_MAX_AGE_MS &&
  Array.isArray(p.curatorAuthorityIds) &&
  p.curatorAuthorityIds.length > 0 &&
  p.curatorAuthorityIds.every((v) => text(v)) &&
  venuePoliciesValid(p) &&
  reviewDelegationValid(p.reviewDelegation) &&
  reviewDelegationValid(
    p.workflowReviewDelegation,
    NETWORK_WORKFLOW_DELEGATION_VERSION,
    1000,
  );

const venueReferenceValid = (l, sourceUrl) => {
  const e = l?.venueReference;
  if (
    !exactKeys(e, [
      "kind",
      "sourceUrl",
      "venueName",
      "scope",
      "poiId",
      "providerUrl",
      "evidenceRef",
    ]) ||
    e.kind !== "PUBLIC_VENUE_REFERENCE" ||
    e.sourceUrl !== sourceUrl ||
    !text(e.venueName, 80) ||
    !["STORE", "MALL"].includes(e.scope) ||
    !/^B[A-Za-z0-9]{9}$/u.test(e.poiId ?? "") ||
    !text(e.evidenceRef)
  )
    return false;
  try {
    const u = new URL(e.providerUrl);
    const point = u.searchParams.get("p")?.split(",");
    return (
      u.protocol === "https:" &&
      u.hostname === "www.amap.com" &&
      !u.username &&
      !u.password &&
      !u.port &&
      !u.hash &&
      u.pathname === "/" &&
      u.searchParams.size === 1 &&
      u.searchParams.has("p") &&
      point[0] === e.poiId &&
      Number(point[1]) === l.latitude &&
      Number(point[2]) === l.longitude
    );
  } catch {
    return false;
  }
};
export const networkVenuePublicLocation = (r, policy) => {
  if (!venuePoliciesValid(policy)) return null;
  const p = venuePolicies(policy).find((v) =>
    v?.approvedSources?.some(
      (s) =>
        s.sourceId === r?.sourceId &&
        s.sourceVersion === r?.sourceVersion &&
        s.locationDigest === networkLocationDigest(r?.location),
    ),
  );
  if (
    r?.location?.accuracyMeters !== null ||
    !venueReferenceValid(r.location, r.sourceUrl) ||
    !venuePoliciesValid(policy) ||
    !p?.approvedSources.some(
      (s) =>
        s.sourceId === r.sourceId &&
        s.sourceVersion === r.sourceVersion &&
        s.locationDigest === networkLocationDigest(r.location),
    )
  )
    return null;
  const e = r.location.venueReference;
  return {
    coordinateSystem: "GCJ02",
    latitude: Number(
      (Math.round(r.location.latitude / 0.001) * 0.001).toFixed(6),
    ),
    longitude: Number(
      (Math.round(r.location.longitude / 0.001) * 0.001).toFixed(6),
    ),
    precisionMode: e.scope === "MALL" ? "AREA" : "APPROXIMATE",
    areaLabel: `大致位置 · 位置误差未知 · ${e.venueName}`,
    locationPolicyVersion: p.version,
    projectionRuleId: p.ruleId,
  };
};
export const networkVenueProjectionValid = (r, policy, projection) =>
  r.location.accuracyMeters !== null ||
  stable(projection) === stable(networkVenuePublicLocation(r, policy));

export const networkTime = (r) => {
  if (
    !instant(r?.sourcePublishedAt) ||
    !instant(r.fetchedAt) ||
    Date.parse(r.sourcePublishedAt) > Date.parse(r.fetchedAt)
  )
    return null;
  let observedAt;
  if (
    r.observedAtBasis === "SOURCE_PUBLISHED_AT_FALLBACK" &&
    r.observationEvidence === null
  )
    observedAt = r.sourcePublishedAt;
  else if (
    r.observedAtBasis === "SOURCE_PHOTO_TIMESTAMP" &&
    exactKeys(r.observationEvidence, ["observedAt", "evidenceRef"]) &&
    instant(r.observationEvidence.observedAt) &&
    text(r.observationEvidence.evidenceRef) &&
    Date.parse(r.observationEvidence.observedAt) <=
      Date.parse(r.sourcePublishedAt)
  )
    observedAt = r.observationEvidence.observedAt;
  else return null;
  return {
    observedAt,
    publicUntil: new Date(
      Date.parse(observedAt) + NETWORK_PUBLIC_MAX_AGE_MS,
    ).toISOString(),
  };
};
export const networkRecordValid = (r) => {
  if (
    !exactKeys(r, [
      "schemaVersion",
      "sourceId",
      "sourceVersion",
      "sourceType",
      "sourceMode",
      "sourcePlatform",
      "sourceUrl",
      "boardEvidenceKey",
      "sourcePublishedAt",
      "fetchedAt",
      "observedAtBasis",
      "observationEvidence",
      "takedownOwnerId",
      "boardFacts",
      "location",
      "note",
    ]) ||
    r.schemaVersion !== NETWORK_SOURCE_SCHEMA ||
    r.sourceType !== "NETWORK_SOURCE" ||
    r.sourceMode !== "OFFICIAL_CURATED" ||
    r.sourcePlatform !== "XHS" ||
    r.sourceId !== networkSourceId(r.sourceUrl, r.boardEvidenceKey) ||
    !(
      r.boardEvidenceKey === undefined ||
      /^image-[1-9]\d{0,2}:[A-Z0-9_-]{1,64}$/u.test(r.boardEvidenceKey)
    ) ||
    !text(r.sourceVersion) ||
    !text(r.takedownOwnerId) ||
    !networkTime(r)
  )
    return false;
  try {
    const u = new URL(r.sourceUrl);
    if (
      u.protocol !== "https:" ||
      u.username ||
      u.password ||
      u.search ||
      u.hash ||
      u.port ||
      u.hostname !== "www.xiaohongshu.com" ||
      !/^\/explore\/[A-Za-z0-9]+$/u.test(u.pathname) ||
      r.sourceUrl !== u.href
    )
      return false;
    const f = r.boardFacts;
    if (
      !validateBoardFacts(f) ||
      f.schemaVersion !== SHARED_BOARD_FACTS_SCHEMA ||
      f.tiers.length > 100 ||
      !text(f.ipName) ||
      !(f.themeName === null || text(f.themeName)) ||
      f.tiers.some(
        (t) =>
          typeof t.isGrandPrize !== "boolean" ||
          !(t.rawLabel === null || text(t.rawLabel)) ||
          !Number.isSafeInteger(t.remainingTickets ?? 0) ||
          !Number.isSafeInteger(t.initialRemainingTickets ?? 0),
      )
    )
      return false;
    const l = r.location;
    if (
      !exactKeys(l, [
        "coordinateSystem",
        "latitude",
        "longitude",
        "accuracyMeters",
        "capturedAt",
        "venueReference",
      ]) ||
      l.coordinateSystem !== "GCJ02" ||
      !Number.isFinite(l.latitude) ||
      Math.abs(l.latitude) > 90 ||
      !Number.isFinite(l.longitude) ||
      Math.abs(l.longitude) > 180 ||
      !(l.accuracyMeters === null
        ? venueReferenceValid(l, r.sourceUrl)
        : Number.isFinite(l.accuracyMeters) &&
          l.accuracyMeters >= 0 &&
          !Object.hasOwn(l, "venueReference")) ||
      !instant(l.capturedAt)
    )
      return false;
    const n = r.note;
    if (
      !exactKeys(n, ["text", "safetyProvenance"]) ||
      !(
        (n.text === null && n.safetyProvenance === null) ||
        (text(n.text, 200) &&
          exactKeys(n.safetyProvenance, [
            "decision",
            "contentHash",
            "decisionVersion",
          ]) &&
          n.safetyProvenance?.decision === "NOTE_PASSED" &&
          n.safetyProvenance.contentHash === hash(n.text) &&
          text(n.safetyProvenance.decisionVersion))
      )
    )
      return false;
    return true;
  } catch {
    return false;
  }
};

export const networkApprovalValid = (r, approval, rights, policy, nowMs) => {
  const time = networkTime(r);
  const digest = networkContentDigest(r);
  return (
    networkPolicyValid(policy) &&
    networkRecordValid(r) &&
    (r.location.accuracyMeters !== null ||
      networkVenuePublicLocation(r, policy) !== null) &&
    time &&
    Date.parse(r.fetchedAt) <= nowMs &&
    Date.parse(time.publicUntil) > nowMs &&
    (approval?.reviewedBy === "FOUNDER" ||
      (approval?.reviewedBy === "AGENT_USER_DELEGATION" &&
        [policy.reviewDelegation, policy.workflowReviewDelegation]
          .filter(Boolean)
          .some(
            (delegation) =>
              approval.authorizationRef === delegation.authorizationRef &&
              Date.parse(delegation.authorizedAt) <= nowMs &&
              Date.parse(approval.reviewedAt) >=
                Date.parse(delegation.authorizedAt) &&
              delegation.approvedSources.some(
                (s) =>
                  s.sourceId === r.sourceId &&
                  s.sourceVersion === r.sourceVersion &&
                  s.contentDigest === digest,
              ),
          ))) &&
    ["APPROVE", "FIX_AND_APPROVE"].includes(approval.reviewDecision) &&
    text(approval.reviewVersion) &&
    instant(approval.reviewedAt) &&
    Date.parse(approval.reviewedAt) >= Date.parse(r.fetchedAt) &&
    Date.parse(approval.reviewedAt) <= nowMs &&
    policy.curatorAuthorityIds.includes(approval.curatorAuthorityId) &&
    approval.sourceId === r.sourceId &&
    approval.sourceVersion === r.sourceVersion &&
    approval.contentDigest === digest &&
    approval.highPrizeTiersConfirmed === true &&
    rights?.decision === "PASS" &&
    ["LICENSE", "OWNER_PERMISSION", "PERMITTED_STRUCTURED_FACTS"].includes(
      rights.basis,
    ) &&
    text(rights.evidenceRef) &&
    text(rights.decisionVersion) &&
    instant(rights.decidedAt) &&
    Date.parse(rights.decidedAt) <= nowMs &&
    rights.sourceId === r.sourceId &&
    rights.sourceVersion === r.sourceVersion &&
    rights.contentDigest === digest &&
    rights.takedownOwnerId === r.takedownOwnerId
  );
};

export const buildNetworkObservation = ({
  record: r,
  approval,
  rights,
  noteSafety,
  policy,
  locationPolicy,
  nowMs,
}) => {
  if (!networkApprovalValid(r, approval, rights, policy.network, nowMs))
    return { ok: false, code: "NETWORK_ADMISSION_DENIED" };
  if (
    r.note.text !== null &&
    (noteSafety?.decision !== "NOTE_PASSED" ||
      noteSafety.contentHash !== hash(r.note.text) ||
      noteSafety.decisionVersion !== r.note.safetyProvenance?.decisionVersion)
  )
    return { ok: false, code: "NETWORK_NOTE_SAFETY_DENIED" };
  const l = locationPolicy;
  const venueLocation =
    r.location.accuracyMeters === null
      ? networkVenuePublicLocation(r, policy.network)
      : null;
  if (
    !text(l?.version) ||
    !text(l.ruleId) ||
    l.precisionMode !== "APPROXIMATE" ||
    l.gridDegrees !== 0.001 ||
    l.maxAccuracyMeters !== 100 ||
    (r.location.accuracyMeters === null
      ? !venueLocation
      : r.location.accuracyMeters > l.maxAccuracyMeters)
  )
    return { ok: false, code: "PUBLIC_LOCATION_INELIGIBLE" };
  const digest = networkContentDigest(r),
    time = networkTime(r);
  const lineageId = hash("network-lineage", r.sourceId);
  const observationVersionId = hash(
    "network-observation",
    r.sourceId,
    r.sourceVersion,
    digest,
    approval.reviewVersion,
    rights.decisionVersion,
  );
  const verifiedBoardVersion = hash(
    "network-verified",
    observationVersionId,
    policy.verificationVersion,
  );
  const source = {
    family: "NETWORK",
    mode: "OFFICIAL_CURATED",
    sourcePlatform: "XHS",
    sourceId: r.sourceId,
    sourceVersion: networkObservationSourceVersion(r, approval, rights),
    contentDigest: digest,
    curatorAuthorityId: approval.curatorAuthorityId,
    reviewDecision: approval.reviewDecision,
    reviewVersion: approval.reviewVersion,
    reviewedAt: approval.reviewedAt,
    sourcePublishedAt: r.sourcePublishedAt,
    observedAt: time.observedAt,
    observedAtBasis: r.observedAtBasis,
    rightsDecisionVersion: rights.decisionVersion,
    record: structuredClone(r),
    approval: structuredClone(approval),
    rights: structuredClone(rights),
    noteSafety: structuredClone(noteSafety ?? null),
  };
  return {
    ok: true,
    observation: {
      schemaVersion: NETWORK_SOURCE_SCHEMA,
      kind: "OBSERVATION_VERSION",
      observationVersionId,
      lineageId,
      sourceVersion: source.sourceVersion,
      source,
      input: {
        observationVersionId,
        privateLineageId: lineageId,
        observedAt: time.observedAt,
        boardFacts: structuredClone(r.boardFacts),
        location: structuredClone(r.location),
        note: structuredClone(r.note),
        verificationInputOnly: true,
      },
      lifecycleState: "CURRENT",
      sourceCurrent: true,
      locationKey: hash(
        "network-location",
        String(r.location.latitude),
        String(r.location.longitude),
      ),
      rightsEligible: true,
      verification: {
        result: "VERIFIED",
        verifiedBoardId: hash("verified-board", observationVersionId),
        verifiedBoardVersion,
        verificationId: hash("verification", observationVersionId),
        policyVersion: policy.verificationVersion,
        verifiedAt: new Date(nowMs).toISOString(),
      },
      publicProjection: {
        observationVersionId,
        verifiedBoardVersion,
        eligibilityDecision: "PASS",
        eligibilityDecisionVersion: NETWORK_POLICY_VERSION,
        locationPolicyVersion:
          venueLocation?.locationPolicyVersion ?? l.version,
        publicFieldClassificationVersion: NETWORK_SERVING_SCHEMA,
        servingSchemaVersion: NETWORK_SERVING_SCHEMA,
        networkPolicyVersion: NETWORK_POLICY_VERSION,
        publicUntil: time.publicUntil,
        publicLocation: venueLocation ?? {
          coordinateSystem: "GCJ02",
          latitude: Number(
            (
              Math.round(r.location.latitude / l.gridDegrees) * l.gridDegrees
            ).toFixed(6),
          ),
          longitude: Number(
            (
              Math.round(r.location.longitude / l.gridDegrees) * l.gridDegrees
            ).toFixed(6),
          ),
          precisionMode: l.precisionMode,
          areaLabel: null,
          locationPolicyVersion: l.version,
          projectionRuleId: l.ruleId,
        },
        boardShortLabel: r.boardFacts.ipName,
        venueNote: r.note.text,
        contributors: [],
      },
    },
  };
};
export const networkObservationShapeValid = (o) => {
  const s = o.source,
    r = s?.record,
    time = networkTime(r);
  return (
    s?.approval &&
    s?.rights &&
    o.schemaVersion === NETWORK_SOURCE_SCHEMA &&
    networkRecordValid(r) &&
    time &&
    s.family === "NETWORK" &&
    s.mode === "OFFICIAL_CURATED" &&
    s.sourcePlatform === "XHS" &&
    s.sourceId === r.sourceId &&
    s.sourceVersion ===
      networkObservationSourceVersion(r, s.approval, s.rights) &&
    s.contentDigest === networkContentDigest(r) &&
    s.observedAt === time.observedAt &&
    s.sourcePublishedAt === r.sourcePublishedAt &&
    s.observedAtBasis === r.observedAtBasis &&
    o.input.observedAt === time.observedAt &&
    stable(o.input.boardFacts) === stable(r.boardFacts) &&
    stable(o.input.location) === stable(r.location) &&
    stable(o.input.note) === stable(r.note) &&
    !Object.hasOwn(s, "ownerAccountId") &&
    !Object.hasOwn(o.input, "ownerAccountId") &&
    s.reviewVersion === s.approval?.reviewVersion &&
    s.rightsDecisionVersion === s.rights?.decisionVersion
  );
};
