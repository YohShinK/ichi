import { createHmac } from "node:crypto";

import { fixedId, readDoc } from "../shared/db.mjs";
import { deriveTrustedCaller } from "../shared/security.mjs";
import { verifiedFromFixture } from "../shared/verified-fixture.mjs";

const fail = (code) => ({ ok: false, code });
const validKey = (value) =>
  typeof value === "string" && /^[A-Za-z0-9:_-]{8,128}$/u.test(value);
const validFixtureId = (value) =>
  typeof value === "string" && /^[A-Za-z0-9:_-]{1,128}$/u.test(value);
const candidateRef = (secret, digest, observationVersionId) =>
  `candidate:${createHmac("sha256", secret)
    .update(`${digest}:${observationVersionId}`)
    .digest("hex")
    .slice(0, 40)}`;

export const createMain =
  ({ cloud, env, now = Date.now }) =>
  async (event = {}) => {
    if (
      env.ICHI_V2_SHADOW_BOUNDARY !== "synthetic_only" ||
      env.ICHI_V2_SHADOW_CANDIDATE_UPLOAD_ENABLED !== "true"
    )
      return fail("SHADOW_UPLOAD_DISABLED");
    const caller = deriveTrustedCaller(cloud, env);
    if (!caller.ok) return caller;
    if (
      !validKey(event.idempotencyKey) ||
      !validFixtureId(event.fixtureId) ||
      !["SHARE", "DO_NOT_SHARE"].includes(event.shareDecision)
    )
      return fail("INVALID_REQUEST");
    const secret = env.ICHI_V2_SHADOW_UPLOAD_REF_HMAC_KEY;
    if (typeof secret !== "string" || secret.length < 32)
      return fail("SHADOW_UPLOAD_UNAVAILABLE");
    const db = cloud.database();
    try {
      return await db.runTransaction(async (tx) => {
        const uploads = tx.collection("v2ShadowCandidateUploads");
        const fixture = await readDoc(
          tx.collection("v2ShadowSourceFixtures"),
          fixedId("fixture", event.fixtureId),
        );
        if (
          fixture?.dataOrigin !== "SYNTHETIC_REHEARSAL" ||
          fixture.ownerSubjectDigest !== caller.digest ||
          fixture.lifecycleState !== "CURRENT" ||
          fixture.currentObservationVersionId !== fixture.observationVersionId
        )
          return fail("UPLOAD_UNAVAILABLE");
        const ref = candidateRef(
          secret,
          caller.digest,
          fixture.observationVersionId,
        );
        const previous = await readDoc(uploads, ref);
        if (previous)
          return previous.ownerSubjectDigest === caller.digest &&
            previous.fixtureId === event.fixtureId &&
            previous.observationVersionId === fixture.observationVersionId &&
            previous.shareDecision === event.shareDecision &&
            previous.lifecycle !== "DELETED"
            ? {
                ok: true,
                duplicate: true,
                candidateRecordRef: ref,
                observationVersion: previous.observationVersion,
                validationState: previous.validationState,
              }
            : fail("UPLOAD_UNAVAILABLE");
        const verified = verifiedFromFixture(fixture);
        if (!verified.ok) return fail("VERIFICATION_FAILED");
        await uploads.doc(ref).set({
          data: {
            candidateRecordRef: ref,
            ownerSubjectDigest: caller.digest,
            fixtureId: event.fixtureId,
            observationVersionId: fixture.observationVersionId,
            observationVersion: fixture.verifiedBoardVersion,
            verifiedBoardId: verified.value.verifiedBoardId,
            verifiedBoardVersion: verified.value.verifiedBoardVersion,
            shareDecision: event.shareDecision,
            firstIdempotencyKey: event.idempotencyKey,
            validationState: "VERIFIED",
            lifecycle: "ACTIVE",
            createdAt: new Date(now()).toISOString(),
            dataOrigin: "SYNTHETIC_REHEARSAL",
          },
        });
        return {
          ok: true,
          duplicate: false,
          candidateRecordRef: ref,
          observationVersion: fixture.verifiedBoardVersion,
          validationState: "VERIFIED",
        };
      });
    } catch {
      return fail("SHADOW_UPLOAD_UNAVAILABLE");
    }
  };
