import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { createMain as getMyAssistanceMain } from "../v2-shadow-get-my-assistance/runtime.mjs";
import {
  deriveTrustedCaller,
  signCursorPayload,
  verifyCursorTag,
  verifyRehearsalCapability,
} from "./security.mjs";

const principalKey = "p".repeat(48);
const rehearsalKey = "r".repeat(48);
const envId = "cloud1-d7gxqfwv783a1f131";
const digest = (appId, openId) =>
  createHmac("sha256", principalKey)
    .update(`ichi:v2:shadow:principal:v1\0${appId}\0${openId}`)
    .digest("hex");
const signed = (payload, key = rehearsalKey) => {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const tag = createHmac("sha256", key).update(body).digest("base64url");
  return `${body}.${tag}`;
};
const now = Date.parse("2026-09-27T00:00:00.000Z");
const capability = (overrides = {}) => ({
  version: 1,
  environmentId: envId,
  purpose: "resolve-observation",
  audience: "v2-shadow-resolve-observation",
  nonce: "nonce-test-0000001",
  issuedAtMs: now - 1_000,
  expiresAtMs: now + 60_000,
  ...overrides,
});

describe("shadow trusted identity and signed capability", () => {
  it("keeps the retired enrollment action closed without touching the database", async () => {
    let databaseCalls = 0;
    const cloud = {
      database: () => {
        databaseCalls += 1;
        throw new Error("unexpected database access");
      },
      getWXContext: () => ({ APPID: "app-a", OPENID: "caller-a" }),
    };
    const main = getMyAssistanceMain({
      cloud,
      env: {
        ICHI_V2_SHADOW_BOUNDARY: "synthetic_only",
        ICHI_V2_SHADOW_HUMAN_ASSISTANCE_ENABLED: "false",
        ICHI_V2_SHADOW_CALLER_ENROLL_ENABLED: "true",
        ICHI_V2_SHADOW_CALLER_ENROLL_EXPIRES_AT: "2099-01-01T00:00:00.000Z",
      },
    });
    expect(await main({ action: "ENROLL_TEST_CALLER" })).toEqual({
      ok: false,
      code: "SHADOW_ASSISTANCE_DISABLED",
    });
    expect(databaseCalls).toBe(0);
  });

  it("derives the caller only from CloudBase context and ignores forged event fields", () => {
    const env = {
      ICHI_V2_SHADOW_BOUNDARY: "synthetic_only",
      ICHI_V2_SHADOW_PRINCIPAL_HMAC_KEY: principalKey,
      ICHI_V2_SHADOW_TEST_CALLER_DIGESTS: digest("app-a", "caller-a"),
    };
    const cloud = {
      getWXContext: () => ({ APPID: "app-a", OPENID: "caller-a" }),
    };
    expect(
      deriveTrustedCaller(cloud, env, {
        callerDigest: digest("app-b", "caller-b"),
        accountId: "account-b",
        ownerSubjectDigest: digest("app-b", "caller-b"),
      }),
    ).toEqual({ ok: true, digest: digest("app-a", "caller-a") });
    expect(
      deriveTrustedCaller(
        { getWXContext: () => ({ APPID: "app-a", OPENID: "caller-b" }) },
        env,
        { callerDigest: digest("app-a", "caller-a") },
      ),
    ).toEqual({ ok: false, code: "SHADOW_TEST_CALLER_DENIED" });
  });

  it("fails closed for missing context, secret, allowlist or boundary", () => {
    const base = {
      ICHI_V2_SHADOW_BOUNDARY: "synthetic_only",
      ICHI_V2_SHADOW_PRINCIPAL_HMAC_KEY: principalKey,
      ICHI_V2_SHADOW_TEST_CALLER_DIGESTS: digest("app-a", "caller-a"),
    };
    expect(deriveTrustedCaller({ getWXContext: () => ({}) }, base, {})).toEqual(
      {
        ok: false,
        code: "UNAUTHORIZED",
      },
    );
    expect(
      deriveTrustedCaller(
        { getWXContext: () => ({ APPID: "app-a", OPENID: "caller-a" }) },
        { ...base, ICHI_V2_SHADOW_PRINCIPAL_HMAC_KEY: "" },
        {},
      ),
    ).toEqual({ ok: false, code: "SHADOW_PRINCIPAL_UNAVAILABLE" });
    expect(
      deriveTrustedCaller(
        { getWXContext: () => ({ APPID: "app-a", OPENID: "caller-a" }) },
        { ...base, ICHI_V2_SHADOW_TEST_CALLER_DIGESTS: "" },
        {},
      ),
    ).toEqual({ ok: false, code: "SHADOW_TEST_CALLER_DENIED" });
  });

  it("rejects invalid, replayed, expired and wrong-purpose capabilities", async () => {
    const seen = new Set();
    const consume = async (id) => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    };
    const verify = (token, key = rehearsalKey) =>
      verifyRehearsalCapability(
        token,
        "resolve-observation",
        "v2-shadow-resolve-observation",
        key,
        consume,
        now,
      );
    expect((await verify(signed(capability()))).ok).toBe(true);
    expect(await verify(signed(capability()))).toEqual({
      ok: false,
      code: "CAPABILITY_REPLAYED",
    });
    expect((await verify(signed(capability()), "x".repeat(48))).ok).toBe(false);
    expect((await verify(signed(capability({ purpose: "project" })))).ok).toBe(
      false,
    );
    expect((await verify(signed(capability({ expiresAtMs: now })))).ok).toBe(
      false,
    );
    expect((await verify(signed(capability({ audience: "other" })))).ok).toBe(
      false,
    );
    expect((await verify(signed(capability()), "")).ok).toBe(false);
  });

  it("authenticates cursor bytes with a timing-safe HMAC comparison", () => {
    const cursor = signCursorPayload("snapshot.50", "c".repeat(48));
    expect(cursor).not.toBeNull();
    const [snapshot, offset, tag] = cursor.split(".");
    expect(verifyCursorTag(`${snapshot}.${offset}`, tag, "c".repeat(48))).toBe(
      true,
    );
    expect(verifyCursorTag(`${snapshot}.51`, tag, "c".repeat(48))).toBe(false);
    expect(verifyCursorTag(`${snapshot}.${offset}`, tag, "")).toBe(false);
  });
});
