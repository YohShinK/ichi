import { hash, read, put } from "./security.mjs";

// ACCEPT atomically registers durable work. It does not create SHARE or V2
// business data, and remains pending while bridge processing is paused.
export const registerConsentSourceWake = async (
  tx,
  accountId,
  terms,
  nowMs,
  restart = false,
) => {
  const eventId = hash(
    "consent-source-wake-v1",
    accountId,
    terms.version,
    terms.scopeDigest,
  );
  const prior = await read(tx.collection("mapSourceOutbox"), eventId);
  if (prior) {
    if (
      prior.kind !== "CONSENT_EVENT" ||
      prior.ownerAccountId !== accountId ||
      prior.termsVersion !== terms.version ||
      prior.scopeDigest !== terms.scopeDigest
    )
      throw new Error("CONSENT_WAKE_CONFLICT");
    if (!restart) return { eventId, duplicate: true };
  }
  const at = new Date(nowMs).toISOString();
  await put(tx.collection("mapSourceOutbox"), eventId, {
    kind: "CONSENT_EVENT",
    eventId,
    ownerAccountId: accountId,
    termsVersion: terms.version,
    scopeDigest: terms.scopeDigest,
    cursor: "",
    status: "PENDING",
    stage: "CONSENT_SWEEP",
    attempts: 0,
    createdAt: at,
    nextAttemptAt: at,
  });
  return { eventId, duplicate: false };
};
