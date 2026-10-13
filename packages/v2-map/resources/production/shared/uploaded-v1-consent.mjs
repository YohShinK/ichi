export const UPLOADED_V1_SHARING_SCOPE = "UPLOADED_V1_RECORDS";
export const coversUploadedV1 = (terms) =>
  terms?.uploadSharingScope === UPLOADED_V1_SHARING_SCOPE &&
  terms.rightsAttestationIncluded === true;

// The server binds this explicit account acceptance to the displayed scope.
// A legacy consent, a client boolean or being present in the V1 table is not
// sufficient; the source normalizer separately requires completed uploads.
export const uploadedV1ConsentAccepted = (consent, terms, owner, nowMs) =>
  coversUploadedV1(terms) &&
  consent?.accepted === true &&
  consent.ownerAccountId === owner &&
  consent.termsVersion === terms.version &&
  consent.scopeDigest === terms.scopeDigest &&
  consent.uploadSharingScope === UPLOADED_V1_SHARING_SCOPE &&
  consent.rightsAttested === true &&
  Number.isFinite(Date.parse(consent.acceptedAt)) &&
  Date.parse(consent.acceptedAt) <= nowMs;
