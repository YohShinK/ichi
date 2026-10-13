import { createHash } from "node:crypto";

import {
  adaptAssistedPublication,
  adaptDirectPublication,
} from "../../../src/source-adapters.js";
import { verifyBoard } from "../../../src/verification.js";

const fail = (code) => ({ ok: false, code });
export const hashId = (prefix, value) =>
  `${prefix}:${createHash("sha256").update(value).digest("hex").slice(0, 40)}`;

export const verifiedFromFixture = (fixture) => {
  if (
    fixture?.dataOrigin !== "SYNTHETIC_REHEARSAL" ||
    fixture?.lifecycleState !== "CURRENT" ||
    !fixture.publication ||
    typeof fixture.observationVersionId !== "string"
  ) {
    return fail("SYNTHETIC_FIXTURE_INVALID");
  }
  const adapted =
    fixture.publication.sourcePath === "assisted-draw"
      ? adaptAssistedPublication(fixture.publication, fixture.submission)
      : adaptDirectPublication(fixture.publication);
  if (!adapted.ok) return fail(adapted.code);
  if (adapted.value.observationVersionId !== fixture.observationVersionId) {
    return fail("OBSERVATION_VERSION_MISMATCH");
  }
  return verifyBoard(adapted.value, {
    expectedObservationVersionId: fixture.observationVersionId,
    currentObservationVersionId: fixture.currentObservationVersionId,
    verifiedBoardId: hashId("verified", fixture.observationVersionId),
    verifiedBoardVersion: fixture.verifiedBoardVersion,
    verificationId: hashId("verification", fixture.observationVersionId),
    policyVersion: "v2-19-synthetic-verification",
    verifiedAt: fixture.verifiedAt,
  });
};
