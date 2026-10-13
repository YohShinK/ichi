import { createHash } from "node:crypto";

import { readDoc } from "./db.mjs";
import { deriveTrustedCaller } from "./security.mjs";
import { currentOpportunityPolicy } from "./opportunity-policy.mjs";
import { INITIAL_OPPORTUNITY_POLICY } from "../../../src/opportunity.js";
import { OPPORTUNITY_STATUSES } from "../../../src/verification.js";

const fail = (code) => ({ ok: false, code });
const LIMITS = { query: 30, detail: 60 };

export const publicCore = (
  row,
  expectedPolicyVersion = INITIAL_OPPORTUNITY_POLICY.policyVersion,
) => {
  if (
    row?.dataOrigin !== "SYNTHETIC_REHEARSAL" ||
    row.lifecycleState !== "PUBLIC" ||
    row.visibility !== "VISIBLE" ||
    typeof row.publicLeadId !== "string" ||
    !Number.isSafeInteger(row.servedVersion) ||
    !row.opportunity ||
    "level" in row.opportunity ||
    !Array.isArray(row.opportunity.reasonCodes) ||
    row.opportunity.reasonCodes.some(
      (code) => !OPPORTUNITY_STATUSES.includes(code),
    ) ||
    row.opportunity.primaryStatus !==
      (OPPORTUNITY_STATUSES.find((code) =>
        row.opportunity.reasonCodes.includes(code),
      ) ?? null) ||
    row.opportunity.policyVersion !== expectedPolicyVersion ||
    !Number.isFinite(Date.parse(row.opportunity.evaluatedAt))
  )
    return null;
  return {
    publicLeadId: row.publicLeadId,
    servedVersion: row.servedVersion,
    projectionVersion: row.projectionVersion,
    policyVersion: row.policyVersion,
    visibility: "VISIBLE",
    publicLocation: row.publicLocation
      ? {
          coordinateSystem: row.publicLocation.coordinateSystem,
          latitude: row.publicLocation.latitude,
          longitude: row.publicLocation.longitude,
          precisionMode: row.publicLocation.precisionMode,
          areaLabel: row.publicLocation.areaLabel,
          locationPolicyVersion: row.publicLocation.locationPolicyVersion,
          projectionRuleId: row.publicLocation.projectionRuleId,
        }
      : null,
    boardShortLabel: row.boardShortLabel,
    board: row.board,
    recordType: row.recordType,
    opportunity: row.opportunity,
    observedAt: row.observedAt,
    freshnessPolicyVersion: row.freshnessPolicyVersion,
    venueNote: row.venueNote,
    contributor: row.contributor,
    contributors: Array.isArray(row.contributors) ? row.contributors : [],
    sourceLabel: row.sourceLabel,
    disclosures: row.disclosures,
    retiredAt: row.retiredAt,
  };
};

export const currentPublicRow = async (db, publicLeadId) => {
  const result = await db
    .collection("v2ShadowPublicMapLeads")
    .where({ publicLeadId })
    .orderBy("servedVersion", "desc")
    .limit(1)
    .get();
  return result?.data?.[0] ?? null;
};

export const preparePublicRead = async ({ cloud, env, kind, nowMs }) => {
  if (
    env.ICHI_V2_SHADOW_BOUNDARY !== "synthetic_only" ||
    env.ICHI_V2_SHADOW_READ_ENABLED !== "true"
  )
    return fail("SHADOW_READ_DISABLED");
  const policy = currentOpportunityPolicy(env);
  if (!policy) return fail("SERVICE_UNAVAILABLE");
  const caller = deriveTrustedCaller(cloud, env);
  if (!caller.ok) return caller;
  if (
    typeof env.ICHI_V2_SHADOW_CURSOR_HMAC_KEY !== "string" ||
    Buffer.byteLength(env.ICHI_V2_SHADOW_CURSOR_HMAC_KEY) < 32
  )
    return fail("SERVICE_UNAVAILABLE");
  const db = cloud.database();
  try {
    const [readStop, epoch] = await Promise.all([
      readDoc(db.collection("v2ShadowControlState"), "global:read-stop"),
      readDoc(db.collection("v2ShadowControlState"), "global:read-epoch"),
    ]);
    if (
      readStop?.stopped !== false ||
      readStop.dataOrigin !== "SYNTHETIC_REHEARSAL" ||
      !Number.isSafeInteger(epoch?.epoch) ||
      epoch.dataOrigin !== "SYNTHETIC_REHEARSAL"
    )
      return fail("SERVICE_UNAVAILABLE");
    const windowKey = String(Math.floor(nowMs / 60_000));
    const id = `rate:${createHash("sha256")
      .update(`${kind}:${caller.digest}:${windowKey}`)
      .digest("hex")}`;
    const limited = await db.runTransaction(async (tx) => {
      const prior = await readDoc(tx.collection("v2ShadowControlState"), id);
      const count = Number(prior?.count || 0);
      if (count >= LIMITS[kind]) return true;
      await tx
        .collection("v2ShadowControlState")
        .doc(id)
        .set({
          data: {
            kind: "READ_RATE",
            subjectDigest: caller.digest,
            windowKey: `${kind}:${windowKey}`,
            count: count + 1,
            expiresAt: new Date((Number(windowKey) + 1) * 60_000).toISOString(),
            dataOrigin: "SYNTHETIC_REHEARSAL",
          },
        });
      return false;
    });
    if (limited) return fail("RATE_LIMITED");
    return {
      ok: true,
      db,
      callerDigest: caller.digest,
      epoch: epoch.epoch,
      opportunityPolicyVersion: policy.policyVersion,
    };
  } catch {
    return fail("SERVICE_UNAVAILABLE");
  }
};
