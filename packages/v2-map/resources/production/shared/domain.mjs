import {
  verifyBoard,
  OPPORTUNITY_STATUSES,
} from "../../../src/verification.js";
import {
  evaluateOpportunity,
  validOpportunityPolicy,
} from "../../../src/opportunity.js";
import { buildPublicCandidate } from "../../../src/projector.js";
import { hash, read } from "./security.mjs";

import {
  NETWORK_SOURCE_SCHEMA,
  networkObservationShapeValid,
  networkApprovalValid,
  networkTime,
  NETWORK_POLICY_VERSION,
  networkPolicyValid,
  networkVenueProjectionValid,
} from "../phase3/network.mjs";

export const SOURCE_SCHEMA = "map-source-boundary-phase1-v1";
const string = (v, max = 200) =>
  typeof v === "string" && v.trim() && v.length <= max;
const instant = (v) => typeof v === "string" && Number.isFinite(Date.parse(v));
const count = (v) => v === null || (Number.isSafeInteger(v) && v >= 0);
const projectKeys = (value, keys) =>
  Object.fromEntries(keys.map((key) => [key, value[key]]));

export const sourceShapeValid = (o) => {
  const keys = [
    "schemaVersion",
    "kind",
    "observationVersionId",
    "lineageId",
    "sourceVersion",
    "source",
    "input",
    "lifecycleState",
    "sourceCurrent",
    "locationKey",
    "rightsEligible",
    "verification",
    "publicProjection",
  ];
  if (
    !o ||
    typeof o !== "object" ||
    Object.keys(o).some((key) => !keys.includes(key))
  )
    return false;
  if (
    ![SOURCE_SCHEMA, NETWORK_SOURCE_SCHEMA].includes(o?.schemaVersion) ||
    o.kind !== "OBSERVATION_VERSION" ||
    o.lifecycleState !== "CURRENT" ||
    o.sourceCurrent !== true ||
    !string(o.observationVersionId) ||
    !string(o.lineageId) ||
    !string(o.sourceVersion) ||
    !instant(o.input?.observedAt) ||
    o.input.verificationInputOnly !== true ||
    o.input.observationVersionId !== o.observationVersionId ||
    o.input.privateLineageId !== o.lineageId ||
    o.input.location?.coordinateSystem !== "GCJ02" ||
    !Number.isFinite(o.input.location.latitude) ||
    !Number.isFinite(o.input.location.longitude) ||
    Math.abs(o.input.location.latitude) > 90 ||
    Math.abs(o.input.location.longitude) > 180 ||
    !(o.source?.family === "NETWORK" && o.input.location.accuracyMeters === null
      ? networkObservationShapeValid(o)
      : Number.isFinite(o.input.location.accuracyMeters) &&
        o.input.location.accuracyMeters >= 0) ||
    !string(o.verification?.verifiedBoardVersion) ||
    !string(o.verification?.verifiedBoardId) ||
    !string(o.verification?.verificationId) ||
    !instant(o.verification?.verifiedAt) ||
    !string(o.verification?.policyVersion) ||
    o.verification.result !== "VERIFIED" ||
    !string(o.locationKey)
  )
    return false;
  const facts = o.input.boardFacts;
  if (
    !string(facts?.schemaVersion) ||
    !string(facts.ipName) ||
    !(facts.themeName === null || string(facts.themeName)) ||
    !count(facts.pricePerDrawMinor) ||
    !Array.isArray(facts.tiers) ||
    facts.tiers.some(
      (t) =>
        typeof t.isGrandPrize !== "boolean" ||
        !(t.rawLabel === null || string(t.rawLabel)),
    )
  )
    return false;
  const source = o.source;
  if (source?.family === "PLAYER")
    return (
      o.schemaVersion === SOURCE_SCHEMA &&
      string(source.ownerAccountId) &&
      ["DRAW_RECORD", "UPLOAD_RECORD"].includes(source.recordType) &&
      ["direct-upload", "assisted-draw"].includes(source.originSourcePath) &&
      (source.recordType === "DRAW_RECORD") ===
        (source.originSourcePath === "assisted-draw") &&
      source.shareIntent === "SHARE" &&
      source.sourceVersion === o.sourceVersion &&
      o.input.ownerAccountId === source.ownerAccountId
    );
  return (
    networkObservationShapeValid(o) &&
    source?.family === "NETWORK" &&
    source.mode === "OFFICIAL_CURATED" &&
    !("ownerAccountId" in source) &&
    !("ownerAccountId" in o.input) &&
    string(source.curatorAuthorityId) &&
    string(source.reviewVersion) &&
    ["APPROVE", "FIX_AND_APPROVE"].includes(source.reviewDecision) &&
    (source.record.note.text === null ||
      (source.noteSafety?.decision === "NOTE_PASSED" &&
        source.noteSafety.contentHash === hash(source.record.note.text) &&
        source.noteSafety.decisionVersion ===
          source.record.note.safetyProvenance?.decisionVersion)) &&
    instant(source.reviewedAt) &&
    instant(source.sourcePublishedAt) &&
    instant(source.observedAt) &&
    source.observedAt === o.input.observedAt &&
    string(source.observedAtBasis) &&
    string(source.rightsDecisionVersion) &&
    source.sourceVersion === o.sourceVersion
  );
};

// Reuses the frozen verification artifact factory and facts validator. NETWORK
// provenance has no player owner/path; no fake player is inserted at this boundary.
export const verifiedObservation = (o) => {
  if (!sourceShapeValid(o)) return null;
  const input = {
    ...o.input,
    provenance: {
      sourceType:
        o.source.family === "NETWORK" ? "NETWORK_SOURCE" : "V1_HISTORY",
      sourceVersion: o.sourceVersion,
      ...(o.source.family === "PLAYER"
        ? {
            ownerAccountId: o.source.ownerAccountId,
            originSourcePath: o.source.originSourcePath,
            recordType: o.source.recordType,
          }
        : {
            recordType: null,
            sourceMode: "OFFICIAL_CURATED",
            sourcePlatform: "XHS",
          }),
    },
  };
  try {
    const v = verifyBoard(input, {
      ...o.verification,
      expectedObservationVersionId: o.observationVersionId,
      currentObservationVersionId: o.observationVersionId,
    });
    return v.ok ? v.value : null;
  } catch {
    return null;
  }
};

export const currentObservation = async (db, id) => {
  const c = db.collection("boardObservations");
  const o = await read(c, `observation:${id}`);
  if (!sourceShapeValid(o)) return null;
  const head = await read(c, `lineage:${o.lineageId}`);
  return head?.kind === "LINEAGE_HEAD" &&
    head.lineageId === o.lineageId &&
    head.lifecycleState === "CURRENT" &&
    head.currentObservationVersionId === id &&
    head.sourceVersion === o.sourceVersion &&
    head.ownerAccountId === (o.source.ownerAccountId ?? null)
    ? o
    : null;
};

const avatar = (a, allowedOrigins) => {
  if (
    a?.kind === "FALLBACK_ASSET" &&
    a.path === "/assets/v1-29/ichi-avatar.png"
  )
    return { kind: a.kind, path: a.path };
  // Production public avatars are pre-projected and use a public CDN namespace.
  if (
    a?.kind === "PUBLIC_URL" &&
    typeof a.url === "string" &&
    /^https:\/\/[^/?#]+\/public-map-avatars\/[A-Za-z0-9._/-]+$/u.test(a.url)
  ) {
    const url = new URL(a.url);
    if (!url.username && !url.password && allowedOrigins.includes(url.origin))
      return { kind: a.kind, url: a.url };
  }
  return null;
};
export const safeContributor = (c, allowedOrigins = []) => {
  if (!c || typeof c !== "object") return null;
  const a = avatar(c.avatar, allowedOrigins) ?? {
    kind: "FALLBACK_ASSET",
    path: "/assets/v1-29/ichi-avatar.png",
  };
  return {
    displayName: string(c.displayName, 80) ? c.displayName : "ICHI 玩家",
    avatar: a,
  };
};
export const safePublicCore = (
  r,
  policyVersion,
  nowMs,
  allowedOrigins = [],
  networkPolicy = null,
) => {
  if (
    r?.lifecycleState !== "PUBLIC" ||
    r.visibility !== "VISIBLE" ||
    r.retiredAt !== null ||
    !/^[a-f0-9]{32}$/u.test(r.publicLeadId) ||
    !Number.isSafeInteger(r.servedVersion) ||
    r.servedVersion < 1 ||
    r.opportunity?.policyVersion !== policyVersion ||
    !Array.isArray(r.opportunity.reasonCodes) ||
    r.opportunity.reasonCodes.some((x) => !OPPORTUNITY_STATUSES.includes(x)) ||
    r.opportunity.primaryStatus !==
      (OPPORTUNITY_STATUSES.find((x) =>
        r.opportunity.reasonCodes.includes(x),
      ) ?? null) ||
    !instant(r.opportunity.evaluatedAt) ||
    !instant(r.observedAt) ||
    Date.parse(r.observedAt) > nowMs ||
    (r.publicUntil !== null &&
      (!instant(r.publicUntil) || Date.parse(r.publicUntil) <= nowMs))
  )
    return null;
  if (
    !string(r.projectionVersion) ||
    !string(r.policyVersion) ||
    !string(r.boardShortLabel) ||
    !string(r.freshnessPolicyVersion) ||
    !(
      r.recordType === null ||
      ["DRAW_RECORD", "UPLOAD_RECORD"].includes(r.recordType)
    )
  )
    return null;
  const p = r.publicLocation;
  if (
    p?.coordinateSystem !== "GCJ02" ||
    !Number.isFinite(p.latitude) ||
    !Number.isFinite(p.longitude) ||
    Math.abs(p.latitude) > 90 ||
    Math.abs(p.longitude) > 180 ||
    !["EXACT", "APPROXIMATE", "AREA"].includes(p.precisionMode) ||
    !string(p.locationPolicyVersion) ||
    !string(p.projectionRuleId) ||
    !(p.areaLabel === null || string(p.areaLabel))
  )
    return null;
  const b = r.board;
  if (
    !string(b?.ipName) ||
    !Array.isArray(b.tiers) ||
    b.tiers.length < 1 ||
    b.tiers.length > 100 ||
    !count(b.pricePerDrawMinor) ||
    !(b.themeName === null || string(b.themeName))
  )
    return null;
  const codes = new Set();
  for (const t of b.tiers) {
    if (
      !string(t.tierCode, 32) ||
      codes.has(t.tierCode) ||
      !count(t.remainingTickets) ||
      typeof t.isGrandPrize !== "boolean" ||
      !(t.displayLabel === null || string(t.displayLabel))
    )
      return null;
    codes.add(t.tierCode);
  }
  if (
    !(r.venueNote === null || string(r.venueNote, 200)) ||
    !(r.sourceLabel === null || r.sourceLabel === "网络上传") ||
    (r.sourceLabel !== null &&
      (r.contributor !== null || (r.contributors?.length ?? 0) !== 0))
  )
    return null;
  if (
    r.sourceLabel === "网络上传" &&
    (!networkPolicyValid(networkPolicy) ||
      r.recordType !== null ||
      r.servingSchemaVersion !== "public-map-v4" ||
      r.networkPolicyVersion !== NETWORK_POLICY_VERSION ||
      !instant(r.publicUntil) ||
      Date.parse(r.publicUntil) !== Date.parse(r.observedAt) + 30 * 86400_000 ||
      r.sourceIcon !== "OFFICIAL_NETWORK")
  )
    return null;
  const contributors = (r.contributors ?? []).map((c) =>
    safeContributor(c, allowedOrigins),
  );
  if (
    contributors.length > 100 ||
    contributors.some((c) => c === null) ||
    (r.contributor !== null && !safeContributor(r.contributor, allowedOrigins))
  )
    return null;
  return {
    ...projectKeys(r, [
      "publicLeadId",
      "servedVersion",
      "projectionVersion",
      "policyVersion",
      "visibility",
      "boardShortLabel",
      "recordType",
      "observedAt",
      "freshnessPolicyVersion",
      "venueNote",
      "sourceLabel",
      "retiredAt",
    ]),
    ...(r.sourceLabel === "网络上传"
      ? {
          servingSchemaVersion: "public-map-v4",
          networkPolicyVersion: r.networkPolicyVersion,
          publicUntil: r.publicUntil,
          sourceIcon: "OFFICIAL_NETWORK",
        }
      : {}),
    ...(instant(r.uploadedAt) && Date.parse(r.uploadedAt) <= nowMs
      ? { uploadedAt: r.uploadedAt }
      : {}),
    publicLocation: projectKeys(p, [
      "coordinateSystem",
      "latitude",
      "longitude",
      "precisionMode",
      "areaLabel",
      "locationPolicyVersion",
      "projectionRuleId",
    ]),
    board: {
      ...projectKeys(b, ["ipName", "themeName", "pricePerDrawMinor"]),
      tiers: b.tiers.map((t) =>
        projectKeys(t, [
          "tierCode",
          "displayLabel",
          "remainingTickets",
          "isGrandPrize",
        ]),
      ),
    },
    opportunity: {
      ...projectKeys(r.opportunity, [
        "primaryStatus",
        "policyVersion",
        "evaluatedAt",
      ]),
      reasonCodes: [...r.opportunity.reasonCodes],
    },
    contributor:
      r.contributor === null
        ? null
        : safeContributor(r.contributor, allowedOrigins),
    contributors,
    disclosures: { nonRealtime: true, nonRecommendation: true },
  };
};

export const candidateFromObservation = async (
  db,
  o,
  contribution,
  policy,
  nowMs,
) => {
  const v = verifiedObservation(o);
  if (
    !v ||
    !validOpportunityPolicy(policy.opportunity) ||
    o.verification.policyVersion !== policy.verificationVersion ||
    contribution?.lifecycle !== "ACTIVE" ||
    contribution.noResurrection === true ||
    contribution.observationVersionId !== o.observationVersionId ||
    contribution.lineageId !== o.lineageId ||
    !o.publicProjection ||
    o.publicProjection.eligibilityDecision !== "PASS" ||
    o.rightsEligible !== true ||
    o.publicProjection.observationVersionId !== o.observationVersionId ||
    o.publicProjection.verifiedBoardVersion !== v.verifiedBoardVersion ||
    !string(o.publicProjection.eligibilityDecisionVersion) ||
    o.publicProjection.publicFieldClassificationVersion !==
      (o.source.family === "NETWORK" ? "public-map-v4" : "public-map-v3") ||
    o.publicProjection.locationPolicyVersion !==
      o.publicProjection.publicLocation?.locationPolicyVersion
  )
    return null;
  let venueNote = o.publicProjection.venueNote;
  if (
    venueNote !== null &&
    (o.input.note?.safetyProvenance?.decision !== "NOTE_PASSED" ||
      o.input.note.text !== o.publicProjection.venueNote ||
      o.input.note.safetyProvenance.contentHash !==
        hash(o.publicProjection.venueNote))
  )
    venueNote = null;
  let authorized;
  if (o.source.family === "PLAYER") {
    const terms = policy.terms;
    if (!terms?.version || !/^[a-f0-9]{64}$/u.test(terms.scopeDigest ?? ""))
      return null;
    const consent = await read(
      db.collection("mapContributionConsents"),
      hash("consent", o.source.ownerAccountId, terms.version),
    );
    const account = await read(
      db.collection("accounts"),
      o.source.ownerAccountId,
    );
    authorized =
      account?.status === "active" &&
      consent?.accepted === true &&
      consent.ownerAccountId === o.source.ownerAccountId &&
      consent.termsVersion === terms.version &&
      consent.scopeDigest === terms.scopeDigest &&
      contribution.ownerAccountId === o.source.ownerAccountId;
  } else {
    const ledger = await read(
      db.collection("boardObservations"),
      `network-source:${o.source.sourceId}`,
    );
    authorized =
      networkObservationShapeValid(o) &&
      networkApprovalValid(
        o.source.record,
        o.source.approval,
        o.source.rights,
        policy.network,
        nowMs,
      ) &&
      ledger?.kind === "NETWORK_SOURCE_RECORD" &&
      ledger.state === "APPROVED" &&
      ledger.observationVersionId === o.observationVersionId &&
      ledger.contentDigest === o.source.contentDigest &&
      ledger.reviewVersion === o.source.reviewVersion &&
      ledger.rightsDecisionVersion === o.source.rightsDecisionVersion &&
      contribution.ownerAccountId === null &&
      contribution.sourceFamily === "NETWORK" &&
      o.publicProjection.servingSchemaVersion === "public-map-v4" &&
      o.publicProjection.networkPolicyVersion === NETWORK_POLICY_VERSION &&
      o.publicProjection.publicUntil ===
        networkTime(o.source.record).publicUntil &&
      networkVenueProjectionValid(
        o.source.record,
        policy.network,
        o.publicProjection.publicLocation,
      ) &&
      (o.publicProjection.contributors?.length ?? 0) === 0 &&
      !o.publicProjection.contributorProjectionOwnerAccountId;
  }
  if (!authorized) return null;
  const evaluation = evaluateOpportunity(
    v,
    {
      currentVerifiedBoardVersion: v.verifiedBoardVersion,
      evaluationId: hash(
        "opportunity",
        v.verifiedBoardId,
        policy.opportunity.policyVersion,
      ),
      evaluationVersion: policy.opportunity.policyVersion,
      evaluatedAt: new Date(nowMs).toISOString(),
    },
    policy.opportunity,
  );
  if (!evaluation.ok) return null;
  const contributors = (o.publicProjection.contributors ?? []).map((c) =>
    safeContributor(c, policy.publicAvatarOrigins ?? []),
  );
  if (
    contributors.length > 1 ||
    contributors.some((c) => !c) ||
    (contributors.length &&
      (o.publicProjection.contributorProjectionOwnerAccountId !==
        o.source.ownerAccountId ||
        !string(o.publicProjection.contributorProjectionVersion)))
  )
    return null;
  if (!contributors.length && o.source.family === "PLAYER")
    contributors.push({
      displayName: "ICHI 玩家",
      avatar: { kind: "FALLBACK_ASSET", path: "/assets/v1-29/ichi-avatar.png" },
    });
  const result = buildPublicCandidate({
    ...(o.source.family === "NETWORK"
      ? {
          publicUntil: o.publicProjection.publicUntil,
          networkPolicyVersion: NETWORK_POLICY_VERSION,
          servingSchemaVersion: "public-map-v4",
        }
      : {}),
    candidateId: hash("candidate", o.observationVersionId),
    boardInstanceId: contribution.boardInstanceId,
    currentVerifiedBoardVersion: v.verifiedBoardVersion,
    verifiedBoard: v,
    opportunityEvaluation: evaluation.value,
    boardShortLabel: o.publicProjection.boardShortLabel,
    freshnessPolicyVersion: policy.freshness.policyVersion,
    publicLocation: o.publicProjection.publicLocation,
    venueNote,
    contributor: null,
    contributors,
    gates: {
      sourceCurrent: true,
      authorizationApplicable: authorized,
      rightsEligible: true,
      publicEligible: true,
      moderationVisible: true,
      deleted: false,
    },
  });
  return result.ok ? result.value : null;
};
