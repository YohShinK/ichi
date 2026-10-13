import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const ENV_ID = "cloud1-d7gxqfwv783a1f131";
const HEX_DIGEST = /^[a-f0-9]{64}$/u;
const NONCE = /^[A-Za-z0-9_-]{16,64}$/u;
const MAX_TOKEN_LENGTH = 2048;
const MAX_CAPABILITY_AGE_MS = 300_000;

const fail = (code) => ({ ok: false, code });
const validSecret = (secret) =>
  typeof secret === "string" && Buffer.byteLength(secret, "utf8") >= 32;

export const safeEqual = (left, right) => {
  if (!Buffer.isBuffer(left) || !Buffer.isBuffer(right)) return false;
  return left.length === right.length && timingSafeEqual(left, right);
};

const decodeCanonicalBase64url = (value) => {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/u.test(value)) {
    return null;
  }
  const decoded = Buffer.from(value, "base64url");
  return decoded.toString("base64url") === value ? decoded : null;
};

export const deriveTrustedCaller = (cloud, env) => {
  if (env.ICHI_V2_SHADOW_BOUNDARY !== "synthetic_only") {
    return fail("SHADOW_BOUNDARY_DISABLED");
  }
  const secret = env.ICHI_V2_SHADOW_PRINCIPAL_HMAC_KEY;
  if (!validSecret(secret)) return fail("SHADOW_PRINCIPAL_UNAVAILABLE");
  let context;
  try {
    context = cloud.getWXContext();
  } catch {
    return fail("UNAUTHORIZED");
  }
  const appId = context?.APPID;
  const openId = context?.OPENID;
  if (
    typeof appId !== "string" ||
    typeof openId !== "string" ||
    appId.length < 1 ||
    appId.length > 128 ||
    openId.length < 1 ||
    openId.length > 256
  ) {
    return fail("UNAUTHORIZED");
  }
  const digest = createHmac("sha256", secret)
    .update("ichi:v2:shadow:principal:v1\0")
    .update(appId)
    .update("\0")
    .update(openId)
    .digest("hex");
  const allowed = String(env.ICHI_V2_SHADOW_TEST_CALLER_DIGESTS || "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => HEX_DIGEST.test(item));
  const digestBytes = Buffer.from(digest, "hex");
  if (
    !allowed.some((item) => safeEqual(digestBytes, Buffer.from(item, "hex")))
  ) {
    return fail("SHADOW_TEST_CALLER_DENIED");
  }
  return { ok: true, digest };
};

export const verifyRehearsalCapability = async (
  token,
  purpose,
  functionName,
  secret,
  consumeNonce,
  now = Date.now(),
) => {
  if (!validSecret(secret)) return fail("SHADOW_CAPABILITY_UNAVAILABLE");
  if (
    typeof token !== "string" ||
    token.length > MAX_TOKEN_LENGTH ||
    typeof purpose !== "string" ||
    typeof functionName !== "string"
  ) {
    return fail("CAPABILITY_INVALID");
  }
  const parts = token.split(".");
  if (parts.length !== 2) return fail("CAPABILITY_INVALID");
  const payloadBytes = decodeCanonicalBase64url(parts[0]);
  const tagBytes = decodeCanonicalBase64url(parts[1]);
  if (!payloadBytes || !tagBytes) return fail("CAPABILITY_INVALID");
  const expected = createHmac("sha256", secret).update(parts[0]).digest();
  if (!safeEqual(expected, tagBytes)) return fail("CAPABILITY_INVALID");
  let payload;
  try {
    payload = JSON.parse(payloadBytes.toString("utf8"));
  } catch {
    return fail("CAPABILITY_INVALID");
  }
  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    payload.version !== 1 ||
    payload.environmentId !== ENV_ID ||
    payload.purpose !== purpose ||
    payload.audience !== functionName ||
    !NONCE.test(payload.nonce) ||
    !Number.isSafeInteger(payload.issuedAtMs) ||
    !Number.isSafeInteger(payload.expiresAtMs) ||
    payload.issuedAtMs > now + 30_000 ||
    payload.expiresAtMs <= now ||
    payload.expiresAtMs - payload.issuedAtMs > MAX_CAPABILITY_AGE_MS ||
    payload.expiresAtMs <= payload.issuedAtMs
  ) {
    return fail("CAPABILITY_INVALID");
  }
  const nonceId = createHash("sha256")
    .update(
      `ichi:v2:shadow:capability:v1:${purpose}:${functionName}:${payload.nonce}`,
    )
    .digest("hex");
  try {
    if (!(await consumeNonce(nonceId, payload.expiresAtMs))) {
      return fail("CAPABILITY_REPLAYED");
    }
  } catch {
    return fail("CAPABILITY_UNAVAILABLE");
  }
  return { ok: true, payload };
};

export const consumeShadowCapabilityNonce = async (db, nonceId, expiresAtMs) =>
  db.runTransaction(async (tx) => {
    const ref = tx
      .collection("v2ShadowControlState")
      .doc(`capability:${nonceId}`);
    let existing = null;
    try {
      existing = (await ref.get())?.data ?? null;
    } catch (error) {
      if (
        !/not exist|not found|-502005/u.test(String(error?.message || error))
      ) {
        throw error;
      }
    }
    if (existing) return false;
    await ref.set({
      data: {
        kind: "CAPABILITY_NONCE",
        subjectDigest: nonceId,
        windowKey: "once",
        expiresAt: new Date(expiresAtMs).toISOString(),
        dataOrigin: "SYNTHETIC_REHEARSAL",
      },
    });
    return true;
  });

export const verifyCursorTag = (payload, tag, secret) => {
  if (!validSecret(secret)) return false;
  const received = decodeCanonicalBase64url(tag);
  if (!received) return false;
  const expected = createHmac("sha256", secret).update(payload).digest();
  return safeEqual(expected, received);
};

export const signCursorPayload = (payload, secret) => {
  if (!validSecret(secret)) return null;
  const tag = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${tag}`;
};
