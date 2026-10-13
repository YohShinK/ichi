import { createHash } from "node:crypto";

export const consentDocumentId = (ownerSubjectDigest) =>
  `consent:${ownerSubjectDigest}`;

export const currentConsentPolicy = (env) => {
  const version = env.ICHI_V2_SHADOW_MAP_CONTRIBUTION_TERMS_VERSION;
  const scopeDigest = env.ICHI_V2_SHADOW_MAP_CONTRIBUTION_SCOPE_DIGEST;
  if (
    typeof version !== "string" ||
    !/^candidate-map-contribution-v[0-9]+$/u.test(version) ||
    typeof scopeDigest !== "string" ||
    !/^[a-f0-9]{64}$/u.test(scopeDigest)
  )
    return null;
  return { version, scopeDigest };
};

export const consentIsCurrent = (row, ownerSubjectDigest, policy) =>
  Boolean(
    policy &&
    row?.kind === "STATE" &&
    row.ownerSubjectDigest === ownerSubjectDigest &&
    row.dataOrigin === "SYNTHETIC_REHEARSAL" &&
    row.accepted === true &&
    row.acceptedTermsVersion === policy.version &&
    row.acceptedScopeDigest === policy.scopeDigest,
  );

export const consentEventId = (ownerSubjectDigest, commandId) =>
  `consent-event:${createHash("sha256")
    .update(`${ownerSubjectDigest}:${commandId}`)
    .digest("hex")
    .slice(0, 40)}`;
