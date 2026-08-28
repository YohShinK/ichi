"use strict";
/* eslint-disable @typescript-eslint/no-require-imports */

const crypto = require("node:crypto");

const PUBLIC_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const RECORD_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const QUOTA_LIMIT = 5;

class IchiError extends Error {
  constructor(code, message = code, details) {
    super(message);
    this.name = "IchiError";
    this.code = code;
    this.details = details;
  }
}

const assert = (condition, code, details) => {
  if (!condition) throw new IchiError(code, code, details);
};

const randomToken = (
  length,
  alphabet = RECORD_ALPHABET,
  randomBytes = crypto.randomBytes,
) => {
  const bytes = randomBytes(length);
  let value = "";
  for (let index = 0; index < length; index += 1) {
    value += alphabet[bytes[index] % alphabet.length];
  }
  return value;
};

const newInternalId = (prefix, randomUUID = crypto.randomUUID) =>
  `${prefix}_${randomUUID().replaceAll("-", "")}`;

const hashIdentity = ({ appId, openId, secret }) => {
  assert(appId && openId && secret, "TRUSTED_IDENTITY_UNAVAILABLE");
  return crypto
    .createHmac("sha256", secret)
    .update(`${appId}:${openId}`)
    .digest("hex");
};

const hashIdempotencyKey = (accountId, value) => {
  assert(
    typeof value === "string" && value.length >= 8 && value.length <= 128,
    "IDEMPOTENCY_KEY_INVALID",
  );
  return crypto
    .createHash("sha256")
    .update(`${accountId}:${value}`)
    .digest("hex");
};

const normalizeIchiId = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();
const isReservedIchiId = (value) =>
  /^ICHI-(?:00[1-9]|0[1-9][0-9]|[1-9][0-9]{2})$/u.test(normalizeIchiId(value));
const newPublicIchiId = (randomBytes) =>
  `ICHI-${randomToken(5, PUBLIC_ALPHABET, randomBytes)}`;
const newRecordCode = (randomBytes) =>
  randomToken(6, RECORD_ALPHABET, randomBytes);

const newRecognitionJobToken = (randomBytes = crypto.randomBytes) =>
  randomBytes(24).toString("base64url");

const hashRecognitionJobToken = (value) => {
  assert(
    typeof value === "string" && value.length >= 24 && value.length <= 128,
    "RECOGNITION_JOB_TOKEN_INVALID",
  );
  return crypto.createHash("sha256").update(value).digest("hex");
};

const shanghaiParts = (nowMs) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(nowMs));
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
};

const quotaWindow = (nowMs = Date.now()) => {
  const { year, month, day } = shanghaiParts(nowMs);
  const dateKey = `${year}-${month}-${day}`;
  const nextUtc =
    Date.UTC(Number(year), Number(month) - 1, Number(day) + 1) -
    8 * 60 * 60 * 1000;
  return { dateKey, resetAt: new Date(nextUtc).toISOString() };
};

const quotaSummary = (quota, nowMs = Date.now()) => {
  const window = quotaWindow(nowMs);
  const limit = Number.isInteger(quota?.limit) ? quota.limit : QUOTA_LIMIT;
  const used = Number.isInteger(quota?.used) ? quota.used : 0;
  const reservations =
    quota?.reservations && typeof quota.reservations === "object"
      ? quota.reservations
      : {};
  const reserved = Object.values(reservations).filter(
    (item) => item?.status === "reserved",
  ).length;
  return {
    limit,
    used,
    reserved,
    remaining: Math.max(0, limit - used - reserved),
    ...window,
  };
};

const normalizeTierId = (value) => {
  const label = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/赏$/u, "");
  const regular = /^([A-Z])(?:[0-9]+)?$/u.exec(label);
  if (regular) return regular[1];
  if (/^SP(?:[1-9]|[12][0-9]|3[0-2])$/u.test(label)) return label;
  return "OTHER";
};

const normalizeTierCounts = (counts) => {
  assert(
    counts && typeof counts === "object" && !Array.isArray(counts),
    "TIER_COUNTS_INVALID",
  );
  const normalized = {};
  for (const [rawTier, rawCount] of Object.entries(counts)) {
    const tierId = normalizeTierId(rawTier);
    const count = Number(rawCount);
    assert(tierId !== "OTHER", "UNKNOWN_TIER", { rawTier });
    assert(Number.isSafeInteger(count) && count >= 0, "TIER_COUNT_INVALID", {
      rawTier,
    });
    normalized[tierId] = (normalized[tierId] || 0) + count;
  }
  return normalized;
};

const validateR2Snapshot = (snapshot) => {
  assert(snapshot && typeof snapshot === "object", "SNAPSHOT_INVALID");
  assert(
    snapshot.schemaVersion === "board-record-r2-1.0.0" &&
      snapshot.recognitionVersion === "R2",
    "SNAPSHOT_VERSION_INVALID",
  );
  assert(
    typeof snapshot.ipName === "string" && snapshot.ipName.trim(),
    "IP_REQUIRED",
  );
  assert(
    Number.isFinite(snapshot.pricePerDraw) && snapshot.pricePerDraw > 0,
    "PRICE_INVALID",
  );
  assert(
    Array.isArray(snapshot.tiers) && snapshot.tiers.length > 0,
    "TIERS_REQUIRED",
  );
  const seen = new Set();
  const tiers = snapshot.tiers.map((tier) => {
    const tierCode = normalizeTierId(tier.tierCode || tier.rawLabel);
    const remainingTickets = Number(tier.remainingTickets);
    assert(tierCode !== "OTHER" && !seen.has(tierCode), "TIER_INVALID", {
      tierCode,
    });
    seen.add(tierCode);
    assert(
      typeof tier.rawLabel === "string" && tier.rawLabel.trim(),
      "TIER_LABEL_INVALID",
      { tierCode },
    );
    assert(
      Number.isSafeInteger(remainingTickets) && remainingTickets >= 0,
      "TIER_REMAINING_INVALID",
      { tierCode },
    );
    assert(typeof tier.isGrandPrize === "boolean", "TIER_CLASS_INVALID", {
      tierCode,
    });
    return {
      tierCode,
      rawLabel: tier.rawLabel.trim(),
      remainingTickets,
      isGrandPrize: tier.isGrandPrize,
    };
  });
  return {
    schemaVersion: "board-record-r2-1.0.0",
    recognitionVersion: "R2",
    ipName: snapshot.ipName.trim(),
    ...(typeof snapshot.themeName === "string" && snapshot.themeName.trim()
      ? { themeName: snapshot.themeName.trim() }
      : {}),
    pricePerDraw: snapshot.pricePerDraw,
    currency: "CNY",
    tiers,
  };
};

const validateLegacySnapshot = (snapshot) => {
  assert(snapshot && typeof snapshot === "object", "SNAPSHOT_INVALID");
  assert(typeof snapshot.ip === "string" && snapshot.ip.trim(), "IP_REQUIRED");
  assert(
    Number.isFinite(snapshot.pricePerDraw) && snapshot.pricePerDraw > 0,
    "PRICE_INVALID",
  );
  assert(
    Array.isArray(snapshot.tiers) && snapshot.tiers.length > 0,
    "TIERS_REQUIRED",
  );
  const seen = new Set();
  let remainingTotal = 0;
  let total = 0;
  const tiers = snapshot.tiers.map((tier) => {
    const tierId = normalizeTierId(tier.tierId || tier.label);
    assert(tierId !== "OTHER" && !seen.has(tierId), "TIER_INVALID", { tierId });
    seen.add(tierId);
    const tierTotal = Number(tier.total);
    const remaining = Number(tier.remaining);
    assert(
      Number.isSafeInteger(tierTotal) && tierTotal > 0,
      "TIER_TOTAL_INVALID",
      { tierId },
    );
    assert(
      Number.isSafeInteger(remaining) &&
        remaining >= 0 &&
        remaining <= tierTotal,
      "TIER_REMAINING_INVALID",
      { tierId },
    );
    total += tierTotal;
    remainingTotal += remaining;
    return {
      ...tier,
      tierId,
      total: tierTotal,
      remaining,
      attached: tierTotal - remaining,
    };
  });
  if (snapshot.totalTickets !== undefined)
    assert(snapshot.totalTickets === total, "TOTAL_CONSERVATION_FAILED");
  if (snapshot.remainingTickets !== undefined)
    assert(
      snapshot.remainingTickets === remainingTotal,
      "REMAINING_CONSERVATION_FAILED",
    );
  return {
    ...snapshot,
    ip: snapshot.ip.trim(),
    ...(typeof snapshot.theme === "string" && snapshot.theme.trim()
      ? { theme: snapshot.theme.trim() }
      : {}),
    tiers,
    totalTickets: total,
    remainingTickets: remainingTotal,
    attachedTickets: total - remainingTotal,
  };
};

const validateSnapshot = (snapshot) =>
  snapshot?.schemaVersion === "board-record-r2-1.0.0"
    ? validateR2Snapshot(snapshot)
    : validateLegacySnapshot(snapshot);

const deriveFinalSnapshot = (initialSnapshot, drawCounts) => {
  const initial = validateSnapshot(initialSnapshot);
  const counts = normalizeTierCounts(drawCounts);
  if (initial.schemaVersion === "board-record-r2-1.0.0") {
    const available = new Set(initial.tiers.map((tier) => tier.tierCode));
    for (const tierCode of Object.keys(counts))
      assert(available.has(tierCode), "UNKNOWN_TIER", { tierCode });
    return {
      ...initial,
      tiers: initial.tiers.map((tier) => {
        const drawn = counts[tier.tierCode] || 0;
        assert(drawn <= tier.remainingTickets, "DRAW_EXCEEDS_REMAINING", {
          tierCode: tier.tierCode,
        });
        return {
          ...tier,
          remainingTickets: tier.remainingTickets - drawn,
        };
      }),
    };
  }
  const available = new Set(initial.tiers.map((tier) => tier.tierId));
  for (const tierId of Object.keys(counts))
    assert(available.has(tierId), "UNKNOWN_TIER", { tierId });
  const tiers = initial.tiers.map((tier) => {
    const drawn = counts[tier.tierId] || 0;
    assert(drawn <= tier.remaining, "DRAW_EXCEEDS_REMAINING", {
      tierId: tier.tierId,
    });
    return {
      ...tier,
      remaining: tier.remaining - drawn,
      attached: tier.attached + drawn,
    };
  });
  return validateSnapshot({
    ...initial,
    tiers,
    totalTickets: initial.totalTickets,
    remainingTickets: tiers.reduce((sum, tier) => sum + tier.remaining, 0),
  });
};

const assertLocation = (location) => {
  assert(location && typeof location === "object", "LOCATION_REQUIRED");
  assert(
    Number.isFinite(location.latitude) &&
      location.latitude >= -90 &&
      location.latitude <= 90,
    "LOCATION_INVALID",
  );
  assert(
    Number.isFinite(location.longitude) &&
      location.longitude >= -180 &&
      location.longitude <= 180,
    "LOCATION_INVALID",
  );
  assert(
    Number.isFinite(location.accuracy) && location.accuracy >= 0,
    "LOCATION_INVALID",
  );
  assert(location.source === "camera", "LOCATION_SOURCE_INVALID");
  assert(
    typeof location.consentVersion === "string" && location.consentVersion,
    "LOCATION_CONSENT_REQUIRED",
  );
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    source: location.source,
    capturedAt: location.capturedAt || new Date().toISOString(),
    consentVersion: location.consentVersion,
    coordinateSystem: "gcj02",
  };
};

const assertNoImagePayload = (value, path = "$") => {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    assert(
      !/(image|photo|base64|fileid|fileurl|temporaryurl)/iu.test(key),
      "PERSISTED_IMAGE_FIELD_FORBIDDEN",
      { path: `${path}.${key}` },
    );
    if (typeof child === "string")
      assert(!/^data:image\//u.test(child), "PERSISTED_IMAGE_VALUE_FORBIDDEN", {
        path: `${path}.${key}`,
      });
    assertNoImagePayload(child, `${path}.${key}`);
  }
};

module.exports = {
  IchiError,
  QUOTA_LIMIT,
  assert,
  assertLocation,
  assertNoImagePayload,
  deriveFinalSnapshot,
  hashIdempotencyKey,
  hashIdentity,
  hashRecognitionJobToken,
  isReservedIchiId,
  newInternalId,
  newPublicIchiId,
  newRecordCode,
  newRecognitionJobToken,
  normalizeIchiId,
  normalizeTierCounts,
  normalizeTierId,
  quotaSummary,
  quotaWindow,
  validateSnapshot,
  validateR2Snapshot,
};
