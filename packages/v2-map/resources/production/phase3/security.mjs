import { createHmac, timingSafeEqual } from "node:crypto";
import { stable } from "../phase2/source.mjs";

export const networkSignedRequest = (key, payload, issuedAtMs) => ({
  ...payload,
  issuedAtMs,
  signature: createHmac("sha256", key)
    .update(stable({ ...payload, issuedAtMs }))
    .digest("hex"),
});
export const networkRequestValid = (key, event, nowMs) => {
  if (
    typeof key !== "string" ||
    key.length < 32 ||
    !event ||
    typeof event !== "object" ||
    Array.isArray(event) ||
    !Number.isFinite(event.issuedAtMs) ||
    Math.abs(nowMs - event.issuedAtMs) > 30000 ||
    !/^[a-f0-9]{64}$/u.test(event.signature ?? "")
  )
    return false;
  const { signature, ...payload } = event;
  const expected = createHmac("sha256", key)
    .update(stable(payload))
    .digest("hex");
  return timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expected, "hex"),
  );
};

export const networkSmokeReadTime = (
  env,
  event,
  control,
  caller,
  actualNowMs,
) => {
  if (!Object.hasOwn(event, "networkSmokeRead"))
    return { ok: true, nowMs: actualNowMs, target: null };
  const proof = event.networkSmokeRead,
    smoke = control.policy.network?.smoke;
  if (
    !networkRequestValid(
      env.ICHI_V2_NETWORK_OPS_HMAC_KEY,
      proof,
      actualNowMs,
    ) ||
    proof.command !== "SMOKE_READ" ||
    smoke?.viewerAccountId !== caller.accountId ||
    !(Date.parse(smoke.expiresAt) > actualNowMs) ||
    !smoke.publicLeadIds?.includes(proof.publicLeadId) ||
    !Number.isFinite(proof.nowMs) ||
    proof.nowMs < actualNowMs ||
    proof.nowMs > actualNowMs + 31 * 86400_000
  )
    return { ok: false, code: "UNAUTHORIZED" };
  return { ok: true, nowMs: proof.nowMs, target: proof.publicLeadId };
};
export const networkVisibleToCaller = (
  core,
  control,
  caller,
  actualNowMs,
  clockTarget = null,
) => {
  if (!core || (clockTarget && core.publicLeadId !== clockTarget)) return null;
  const smoke = control.policy.network?.smoke;
  if (
    smoke?.publicLeadIds?.includes(core.publicLeadId) &&
    (smoke.viewerAccountId !== caller.accountId ||
      !(Date.parse(smoke.expiresAt) > actualNowMs))
  )
    return null;
  return core;
};
