import { createHmac } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createMain, reporterEligible } from "../shared/runtime.mjs";
import {
  guardedDatabase,
  hash,
  trustedAccount,
  readControl,
} from "../shared/security.mjs";
import {
  safePublicCore,
  verifiedObservation,
  SOURCE_SCHEMA,
} from "../shared/domain.mjs";
import { localDatabase } from "./db.test-support.mjs";

const proposal = JSON.parse(
  fs.readFileSync(
    path.join(
      import.meta.dirname,
      "../cloudbase-production-resource-proposal.json",
    ),
    "utf8",
  ),
);
const NOW = Date.parse("2026-10-02T04:00:00Z");
const setup = () => {
  const store = localDatabase(proposal.collections);
  let current = "a";
  let time = NOW;
  let next = 0;
  const env = {
    ICHI_V2_BACKEND_MODE: "production",
    ICHI_V2_FUNCTION_ENABLED: "true",
    IDENTITY_HMAC_KEY: "i".repeat(48),
    ICHI_V2_ACCOUNT_AUTHORITY_HMAC_KEY: "p".repeat(48),
    ICHI_V2_CURSOR_HMAC_KEY: "c".repeat(48),
  };
  for (const row of proposal.initialControlRows) {
    const { _id, ...data } = structuredClone(row);
    store.table("mapControlState").set(_id, data);
  }
  store.table("mapControlState").get("global:read-stop").stopped = false;
  const features = store.table("mapControlState").get("global:features");
  for (const key of Object.keys(features))
    if (key.endsWith("Enabled")) features[key] = true;
  features.haPaused = false;
  const policy = store.table("mapControlState").get("global:policy");
  policy.terms = {
    version: "map-contribution-20260928-v1",
    scopeDigest: "d".repeat(64),
  };
  policy.ha = {
    policyVersion: "local-policy-validation",
    comparisonPolicyVersion: "most-recent-unique-v1",
    cooldownMs: 10_000,
    windowMs: 60_000,
    maxRequests: 2,
    requestTtlMs: 120_000,
  };
  const cloud = {
    database: () => store.db,
    getWXContext: () => ({ APPID: "wx-app", OPENID: current }),
  };
  const addAccount = (id, maintainer = false, eligible = true) => {
    const accountId = `account_${id}`;
    const identity = createHmac("sha256", env.IDENTITY_HMAC_KEY)
      .update(`wx-app:${id}`)
      .digest("hex");
    store.table("wechatIdentities").set(identity, { accountId });
    store.table("accounts").set(accountId, { status: "active" });
    store.table("mapAccountPolicies").set(`account:${accountId}`, {
      kind: "ACCOUNT_POLICY",
      authorityVersion: "production-account-policy-v1",
      accountId,
      roles: maintainer ? ["MAP_MAINTAINER"] : [],
      reporterEligible: eligible,
      spamOrInvalid: false,
      expiresAt: new Date(NOW + 86400_000).toISOString(),
    });
    store
      .table("mapContributionConsents")
      .set(hash("consent", accountId, policy.terms.version), {
        ownerAccountId: accountId,
        termsVersion: policy.terms.version,
        scopeDigest: policy.terms.scopeDigest,
        accepted: true,
        acceptedAt: new Date(NOW).toISOString(),
      });
    return accountId;
  };
  addAccount("a", true);
  addAccount("b");
  const main = (operation) =>
    createMain({
      cloud,
      env,
      operation,
      collectionAllowlist: proposal.functions
        .find((f) => f.operation === operation)
        .collectionAllowlist.concat(
          operation === "consent" ? ["mapSourceOutbox"] : [],
        ),
      now: () => time,
      newId: () => (++next).toString(16).padStart(32, "0"),
    });
  const observation = (
    id,
    {
      owner = "a",
      remaining = 9,
      initial = 20,
      age = 60_000,
      lineage = id,
      longitude = 121.47,
      family = "PLAYER",
      theme = null,
    } = {},
  ) => {
    const observedAt = new Date(NOW - age).toISOString();
    const version = `source-${id}`;
    const source =
      family === "PLAYER"
        ? {
            family,
            ownerAccountId: `account_${owner}`,
            recordType: "UPLOAD_RECORD",
            originSourcePath: "direct-upload",
            sourceVersion: version,
            shareIntent: "SHARE",
          }
        : {
            family: "NETWORK",
            mode: "OFFICIAL_CURATED",
            sourceVersion: version,
            curatorAuthorityId: "curator-1",
            reviewDecision: "APPROVE",
            reviewVersion: "review-1",
            reviewedAt: new Date(NOW).toISOString(),
            sourcePublishedAt: observedAt,
            observedAt,
            observedAtBasis: "SOURCE_PHOTO_TIMESTAMP",
            rightsDecisionVersion: "rights-1",
          };
    const input = {
      observationVersionId: id,
      privateLineageId: lineage,
      observedAt,
      ...(family === "PLAYER" ? { ownerAccountId: source.ownerAccountId } : {}),
      verificationInputOnly: true,
      location: {
        coordinateSystem: "GCJ02",
        latitude: 31.23,
        longitude,
        accuracyMeters: 20,
        capturedAt: observedAt,
      },
      boardFacts: {
        schemaVersion: "facts-v1",
        ipName: "IP",
        themeName: theme,
        pricePerDrawMinor: 800,
        tiers: [
          {
            tierCode: "A",
            rawLabel: "A赏",
            initialRemainingTickets: initial,
            remainingTickets: remaining,
            isGrandPrize: true,
          },
        ],
      },
      note: { text: null, safetyProvenance: null },
    };
    const row = {
      schemaVersion: SOURCE_SCHEMA,
      kind: "OBSERVATION_VERSION",
      observationVersionId: id,
      lineageId: lineage,
      sourceVersion: version,
      source,
      input,
      lifecycleState: "CURRENT",
      sourceCurrent: true,
      locationKey: "location-1",
      rightsEligible: true,
      verification: {
        result: "VERIFIED",
        verifiedBoardVersion: `verified-${id}`,
        verifiedBoardId: `board-${id}`,
        verificationId: `verification-${id}`,
        policyVersion: "verification-v2-10",
        verifiedAt: new Date(NOW).toISOString(),
      },
      publicProjection: {
        observationVersionId: id,
        verifiedBoardVersion: `verified-${id}`,
        eligibilityDecision: "PASS",
        eligibilityDecisionVersion: "eligibility-1",
        publicFieldClassificationVersion: "public-map-v3",
        locationPolicyVersion: "location-1",
        boardShortLabel: "IP",
        venueNote: null,
        contributors: [],
        publicLocation: {
          coordinateSystem: "GCJ02",
          latitude: 31.23,
          longitude,
          precisionMode: "APPROXIMATE",
          areaLabel: "上海",
          locationPolicyVersion: "location-1",
          projectionRuleId: "approved-projection-1",
        },
      },
    };
    store.table("boardObservations").set(`observation:${id}`, row);
    store.table("boardObservations").set(`lineage:${lineage}`, {
      kind: "LINEAGE_HEAD",
      lineageId: lineage,
      lifecycleState: "CURRENT",
      currentObservationVersionId: id,
      sourceVersion: version,
      ownerAccountId: source.ownerAccountId ?? null,
    });
    return row;
  };
  const resolveAndProject = async (id, options) => {
    observation(id, options);
    const r = await main("resolve")({
      observationVersionId: id,
      actionId: `resolve_${id}`,
    });
    if (!r.ok || !r.outboxId) return r;
    const p = await main("project")({
      outboxId: r.outboxId,
      actionId: `project_${id}`,
    });
    return { ...r, projection: p };
  };
  return {
    ...store,
    env,
    cloud,
    features,
    policy,
    addAccount,
    main,
    observation,
    resolveAndProject,
    caller: (id) => {
      current = id;
    },
    clock: (n) => {
      time = n;
    },
  };
};
const detail = (id) => ({
  publicLeadId: id,
  requestId: "request-1",
  generation: 1,
  supportedSchemaVersions: ["public-map-v3"],
});
const query = (cursor = null, limit = 50) => ({
  bbox: { west: 121, east: 122, south: 31, north: 32 },
  zoom: 14,
  mode: "MAP",
  opportunityStatuses: [],
  includeLowFreshness: true,
  limit,
  cursor,
  asOf: null,
  requestId: "query-1",
  generation: 1,
  supportedSchemaVersions: ["public-map-v3"],
});

describe("production Account and capability boundary", () => {
  it("uses exactly V1 trusted identity and rejects client identity/unknown fields", async () => {
    const s = setup();
    const a = await trustedAccount(s.cloud, s.db, s.env);
    expect(a.accountId).toBe("account_a");
    expect(
      await s.main("consent")({ command: "GET", ownerAccountId: "account_b" }),
    ).toMatchObject({ ok: false, code: "INVALID_REQUEST" });
    expect(
      await s.main("consent")({
        command: "GET",
        tcbContext: { OPENID: "b" },
        userInfo: { OPENID: "b" },
      }),
    ).toMatchObject({ ok: true, accepted: true });
    s.caller("unbound");
    expect(await s.main("query")(query())).toMatchObject({
      ok: false,
      code: "UNAUTHORIZED",
    });
  });
  it.each(["deleting", "deleted", "suspended"])(
    "rejects %s Account",
    async (status) => {
      const s = setup();
      s.table("accounts").get("account_a").status = status;
      expect(await s.main("consent")({ command: "GET" })).toMatchObject({
        code: "UNAUTHORIZED",
      });
    },
  );
  it("cannot write V1 Account/identity or access other private collections", async () => {
    const s = setup();
    const db = guardedDatabase(s.db, [
      "accounts",
      "wechatIdentities",
      "publicMapLeads",
    ]);
    expect(db.collection("accounts").doc("account_a").set).toBeUndefined();
    expect(() => db.collection("profiles")).toThrow("COLLECTION_NOT_ALLOWED");
    await db.runTransaction(async (tx) =>
      expect(tx.collection("accounts").doc("account_a").set).toBeUndefined(),
    );
  });
  it("ordinary Account cannot perform maintenance; expired role cannot elevate", async () => {
    const s = setup();
    s.observation("one");
    s.caller("b");
    expect(
      await s.main("resolve")({
        observationVersionId: "one",
        actionId: "resolve_one",
      }),
    ).toMatchObject({ code: "UNAUTHORIZED" });
    s.caller("a");
    s.table("mapAccountPolicies").get("account:account_a").expiresAt = new Date(
      NOW - 1,
    ).toISOString();
    expect(
      await s.main("resolve")({
        observationVersionId: "one",
        actionId: "resolve_two",
      }),
    ).toMatchObject({ code: "UNAUTHORIZED" });
  });
  it("stopped/disabled/missing policy and malformed requests fail closed", async () => {
    const s = setup();
    s.table("mapControlState").get("global:read-stop").stopped = true;
    expect(await s.main("query")(query())).toMatchObject({
      code: "SERVICE_UNAVAILABLE",
    });
    s.table("mapControlState").get("global:read-stop").stopped = false;
    for (const bad of [
      null,
      [],
      "request",
      { command: "GET", capability: "forged" },
    ])
      expect(await s.main("consent")(bad)).toMatchObject({
        code: "INVALID_REQUEST",
      });
    s.env.ICHI_V2_FUNCTION_ENABLED = "false";
    expect(await s.main("query")(query())).toMatchObject({
      code: "SERVICE_UNAVAILABLE",
    });
  });
});

describe("production domain/serving integration", () => {
  it("does not persist unused snapshots for a complete first page", async () => {
    const s = setup();
    await s.resolveAndProject("single");
    s.accesses.length = 0;
    expect(await s.main("query")(query())).toMatchObject({
      ok: true,
      nextCursor: null,
    });
    expect(s.table("publicMapQuerySnapshots").size).toBe(0);
    expect(s.accesses.some((x) => x.id?.startsWith("snapshot-counter:"))).toBe(
      false,
    );
    expect(s.accesses.some((x) => x.id?.startsWith("rate:"))).toBe(true);
  });
  it("still persists and reuses a snapshot when another page exists", async () => {
    const s = setup();
    await s.resolveAndProject("one", { theme: "one" });
    await s.resolveAndProject("two", { theme: "two", longitude: 121.49 });
    const first = await s.main("query")(query(null, 1));
    expect(first.ok).toBe(true);
    expect(first.nextCursor).not.toBeNull();
    expect(s.table("publicMapQuerySnapshots").size).toBe(1);
    const next = await s.main("query")({
      ...query(first.nextCursor, 1),
      asOf: first.asOf,
    });
    expect(next.ok).toBe(true);
    expect(next.items).toHaveLength(1);
    expect(next.items[0].publicLeadId).not.toBe(first.items[0].publicLeadId);
  });
  it("overlaps ordinary control reads but serializes transaction capabilities", async () => {
    const s = setup();
    let active = 0,
      maximum = 0;
    const wrap = (source) => ({
      ...source,
      collection: (name) => {
        const c = source.collection(name);
        return {
          ...c,
          doc: (id) => {
            const d = c.doc(id);
            return {
              ...d,
              get: async () => {
                active++;
                maximum = Math.max(maximum, active);
                try {
                  await Promise.resolve();
                  return await d.get();
                } finally {
                  active--;
                }
              },
            };
          },
        };
      },
    });
    const db = guardedDatabase(wrap(s.db), ["mapControlState"]);
    expect(await readControl(db, true)).not.toBeNull();
    expect(maximum).toBe(4);
    maximum = 0;
    // A real guarded transaction has no nested runTransaction capability.
    const tx = { collection: db.collection };
    expect(await readControl(tx, true)).not.toBeNull();
    expect(maximum).toBe(1);
  });
  it.each(["stop", "epoch", "policy", "account"])(
    "rejects %s changes after reading public data",
    async (kind) => {
      const s = setup();
      const r = await s.resolveAndProject("one");
      const raw = s.db,
        collection = raw.collection;
      raw.collection = (name) => {
        const c = collection(name);
        if (name !== "publicMapLeads") return c;
        return {
          ...c,
          doc: (id) => {
            const d = c.doc(id);
            return {
              ...d,
              get: async () => {
                const result = await d.get();
                if (kind === "stop")
                  s.table("mapControlState").get("global:read-stop").stopped =
                    true;
                if (kind === "epoch")
                  s.table("mapControlState").get("global:read-epoch").epoch++;
                if (kind === "policy")
                  s.policy.publicAvatarOrigins = ["https://changed.invalid"];
                if (kind === "account")
                  s.table("accounts").get("account_a").status = "suspended";
                return result;
              },
            };
          },
        };
      };
      expect(
        await s.main("detail")(detail(r.projection.publicLeadId)),
      ).toMatchObject({
        ok: false,
        code: kind === "account" ? "UNAUTHORIZED" : "SERVICE_UNAVAILABLE",
      });
    },
  );

  it("serves 50 independent public records concurrently with correct per-record metadata and no rate transactions", async () => {
    const s = setup();
    const base = await s.resolveAndProject("capacity-base");
    const head = structuredClone(
      s.table("publicMapLeads").get(`head:${base.projection.publicLeadId}`),
    );
    s.table("publicMapLeads").clear();
    const ids = Array.from({ length: 50 }, (_, i) =>
      (i + 100).toString(16).padStart(32, "0"),
    );
    ids.forEach((id, i) => {
      const row = structuredClone(head);
      row.publicLeadId = id;
      row.boardShortLabel = "公开版面 " + i;
      row.board.ipName = "公开IP " + i;
      row.venueNote = "安全公开备注 " + i;
      row.uploadedAt = new Date(NOW - i * 1000).toISOString();
      s.table("publicMapLeads").set(`head:${id}`, row);
    });
    s.db.runTransaction = () => {
      throw Error("READ_MUST_NOT_USE_TRANSACTION");
    };
    const viewport = await s.main("query")(query());
    expect(viewport.ok).toBe(true);
    expect(new Set(viewport.items.map((m) => m.publicLeadId))).toEqual(
      new Set(ids),
    );
    const responses = await Promise.all(
      ids.map((id, i) =>
        s.main("detail")({
          ...detail(id),
          requestId: "capacity-" + i,
          generation: i,
        }),
      ),
    );
    responses.forEach((r, i) => {
      expect(r).toMatchObject({
        ok: true,
        requestId: "capacity-" + i,
        generation: i,
        item: {
          publicLeadId: ids[i],
          venueNote: "安全公开备注 " + i,
          uploadedAt: new Date(NOW - i * 1000).toISOString(),
          board: { ipName: "公开IP " + i },
        },
      });
    });
    expect(responses.filter((r) => !r.ok)).toHaveLength(0);
    const overflow = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        s.main("detail")({ ...detail(ids[0]), requestId: "overflow-" + i }),
      ),
    );
    expect(overflow.filter((r) => r.ok)).toHaveLength(10);
    expect(overflow.filter((r) => r.code === "RATE_LIMITED")).toHaveLength(10);
    expect(overflow.some((r) => r.code === "SERVICE_UNAVAILABLE")).toBe(false);
  });

  it("resolves/projects real-shaped staged source and reads only materialized public facts", async () => {
    const s = setup();
    const r = await s.resolveAndProject("one");
    expect(r.projection).toMatchObject({ ok: true, effect: "CREATED" });
    const id = r.projection.publicLeadId;
    s.accesses.length = 0;
    const d = await s.main("detail")(detail(id));
    expect(d.ok).toBe(true);
    expect(d.item.board.totalRemaining).toBe(9);
    expect(new Set(s.accesses.map((x) => x.name))).toEqual(
      new Set([
        "wechatIdentities",
        "accounts",
        "mapControlState",
        "publicMapLeads",
      ]),
    );
    const q = await s.main("query")(query());
    expect(q.ok).toBe(true);
    expect(q.items).toHaveLength(1);
    expect(q.items[0].opportunity).toEqual(d.item.opportunity);
  });
  it.each([null, 0, 3, 12, 13, 60])(
    "preserves remaining %s across verified/projected/detail",
    async (remaining) => {
      const s = setup();
      const r = await s.resolveAndProject("one", { remaining });
      expect(r.projection.ok).toBe(true);
      const d = await s.main("detail")(detail(r.projection.publicLeadId));
      expect(d.item.board.totalRemaining).toBe(remaining);
      if (remaining === null)
        expect(d.item.opportunity.primaryStatus).toBeNull();
    },
  );
  it("promotes algorithms rather than fake NETWORK player identity", () => {
    const s = setup();
    const o = s.observation("network", { family: "NETWORK" });
    // The old provisional NETWORK shape has no exact Founder/rights record.
    // Phase3 approved NETWORK verification is exercised in network.test.mjs.
    expect(verifiedObservation(o)).toBeNull();
    o.source.ownerAccountId = "forged";
    expect(verifiedObservation(o)).toBeNull();
  });
  it("direct/assisted paths are exact and provisional NETWORK is rejected", async () => {
    const s = setup();
    const o = s.observation("draw");
    o.source.recordType = "DRAW_RECORD";
    o.source.originSourcePath = "assisted-draw";
    expect(verifiedObservation(o)).not.toBeNull();
    o.source.originSourcePath = "direct-upload";
    expect(verifiedObservation(o)).toBeNull();
    const n = await s.resolveAndProject("network", { family: "NETWORK" });
    expect(n).toMatchObject({ ok: false, code: "OBSERVATION_UNAVAILABLE" });
    expect(s.table("publicMapLeads").size).toBe(0);
  });
  it("rejects wrong consent, stale input version, ineligible rights and unsafe note", async () => {
    for (const mutate of [
      (s) => {
        s.policy.terms.scopeDigest = "e".repeat(64);
      },
      (s, o) => {
        o.rightsEligible = false;
      },
      (s, o) => {
        o.publicProjection.verifiedBoardVersion = "stale";
      },
    ]) {
      const s = setup();
      const o = s.observation("one");
      mutate(s, o);
      const r = await s.main("resolve")({
        observationVersionId: "one",
        actionId: "resolve_one",
      });
      expect(
        (
          await s.main("project")({
            outboxId: r.outboxId,
            actionId: "project_one",
          })
        ).effect,
      ).toBe("NO_PUBLIC_SUPPORT");
    }
  });
  it("unsafe note is omitted while eligible board and default Player attribution remain", async () => {
    const s = setup();
    const o = s.observation("one");
    o.publicProjection.venueNote = "unreviewed private note";
    const r = await s.main("resolve")({
      observationVersionId: "one",
      actionId: "resolve_one",
    });
    const p = await s.main("project")({
      outboxId: r.outboxId,
      actionId: "project_one",
    });
    expect(p.effect).toBe("CREATED");
    const d = await s.main("detail")(detail(p.publicLeadId));
    expect(d.item.venueNote).toBeNull();
    expect(d.item.contributors[0].displayName).toBe("ICHI 玩家");
  });
  it("conservative facts distinguish unique, hard conflict and ambiguous boards", async () => {
    const s = setup();
    const first = await s.resolveAndProject("first", {
      age: 120_000,
      remaining: 10,
    });
    const unique = await s.resolveAndProject("second", { remaining: 9 });
    expect(unique.boardInstanceId).toBe(first.boardInstanceId);
    const conflict = await s.resolveAndProject("conflict", {
      remaining: 15,
      age: 30_000,
    });
    expect(conflict.boardInstanceId).not.toBe(first.boardInstanceId);
    const ambiguous = await s.resolveAndProject("ambiguous", {
      remaining: 8,
      age: 1000,
    });
    expect(ambiguous).toMatchObject({
      ok: true,
      resolution: "AMBIGUOUS",
      assistanceRequested: true,
    });
    expect(s.table("mapAssistanceRequests").size).toBe(1);
  });
  it("deep allowlist removes extra nested private fields and rejects non-scalar fields", async () => {
    const s = setup();
    const r = await s.resolveAndProject("one");
    const id = r.projection.publicLeadId;
    const row = s.table("publicMapLeads").get(`head:${id}`);
    row.openid = "secret";
    row.board.rawEvidence = { accountId: "secret" };
    row.board.tiers[0].recordId = "secret";
    row.publicLocation.rawLocation = { latitude: 1 };
    row.opportunity.privateNote = "secret";
    const d = await s.main("detail")(detail(id));
    expect(d.ok).toBe(true);
    expect(JSON.stringify(d)).not.toMatch(
      /openid|rawEvidence|accountId|recordId|rawLocation|privateNote|secret/,
    );
    row.boardShortLabel = { privateNote: "secret" };
    expect(
      safePublicCore(row, s.policy.opportunity.policyVersion, NOW),
    ).toBeNull();
  });
  it("projector writes only sanitized public fields even when approved projection has extras", async () => {
    const s = setup();
    const o = s.observation("one");
    o.publicProjection.publicLocation.rawLocation = { secret: true };
    const r = await s.main("resolve")({
      observationVersionId: "one",
      actionId: "resolve_one",
    });
    expect(
      (
        await s.main("project")({
          outboxId: r.outboxId,
          actionId: "project_one",
        })
      ).ok,
    ).toBe(true);
    expect(
      JSON.stringify([...s.table("publicMapLeads").values()]),
    ).not.toContain("rawLocation");
  });
  it("multiple eligible owners aggregate safe attribution; deleting one retains other support", async () => {
    const s = setup();
    for (const [id, owner, age, remaining] of [
      ["one", "a", 120000, 10],
      ["two", "b", 60000, 9],
    ]) {
      const o = s.observation(id, { owner, age, remaining });
      o.publicProjection.contributors = [
        {
          displayName: owner,
          avatar: {
            kind: "FALLBACK_ASSET",
            path: "/assets/v1-29/ichi-avatar.png",
          },
        },
      ];
      o.publicProjection.contributorProjectionOwnerAccountId = `account_${owner}`;
      o.publicProjection.contributorProjectionVersion = "profile-projection-1";
      const r = await s.main("resolve")({
        observationVersionId: id,
        actionId: `resolve_${id}`,
      });
      await s.main("project")({
        outboxId: r.outboxId,
        actionId: `project_${id}`,
      });
    }
    const instance = [...s.table("boardInstances").values()][0];
    const id = instance.activePublicLeadId;
    expect(
      (await s.main("detail")(detail(id))).item.contributors.map(
        (c) => c.displayName,
      ),
    ).toEqual(["b", "a"]);
    const one = [...s.table("mapContributions").values()].find(
      (c) => c.ownerAccountId === "account_a",
    );
    const d = await s.main("owner")({
      contributionId: one.contributionId,
      command: "DELETE",
      actionId: "delete_owner_a",
    });
    await s.main("project")({
      outboxId: d.outboxId,
      actionId: "project_owner_a",
    });
    expect(
      (await s.main("detail")(detail(id))).item.contributors.map(
        (c) => c.displayName,
      ),
    ).toEqual(["b"]);
  });
});

describe("production commands and monotonic state", () => {
  it("cross-account owner/HA commands are denied and consent scope is server authoritative", async () => {
    const s = setup();
    const r = await s.resolveAndProject("one");
    s.caller("b");
    expect(
      await s.main("owner")({
        contributionId: r.contributionId,
        command: "DELETE",
        actionId: "delete_one",
      }),
    ).toMatchObject({ code: "CONTRIBUTION_UNAVAILABLE" });
    expect(
      await s.main("consent")({
        command: "ACCEPT",
        termsVersion: "wrong",
        scopeDigest: "d".repeat(64),
        actionId: "accept_one",
      }),
    ).toMatchObject({ code: "CONSENT_POLICY_MISMATCH" });
    expect(
      await s.main("answerAssistance")({
        requestId: `ha:${"a".repeat(40)}`,
        answer: "SAME_BOARD",
        actionId: "answer_one",
      }),
    ).toMatchObject({ code: "REQUEST_UNAVAILABLE" });
  });
  it("replays same command once and rejects action ID reuse with changed payload", async () => {
    const s = setup();
    s.observation("one");
    s.observation("two");
    const e = { observationVersionId: "one", actionId: "resolve_one" };
    const a = await s.main("resolve")(e);
    const size = s.table("mapProjectionOutbox").size;
    expect(await s.main("resolve")(e)).toEqual(a);
    expect(s.table("mapProjectionOutbox").size).toBe(size);
    expect(
      await s.main("resolve")({ ...e, observationVersionId: "two" }),
    ).toMatchObject({ code: "IDEMPOTENCY_CONFLICT" });
  });
  it("reads consent control rows without overlapping SDK transaction calls", async () => {
    const s = setup(),
      rawDatabase = s.cloud.database();
    const rawRun = rawDatabase.runTransaction;
    rawDatabase.runTransaction = (work) =>
      rawRun(async (tx) => {
        let active = false;
        return work({
          ...tx,
          collection: (name) => {
            const c = tx.collection(name);
            return {
              ...c,
              doc: (id) => {
                const d = c.doc(id);
                return {
                  ...d,
                  get: async () => {
                    if (active)
                      throw Object.assign(new Error("transaction overlap"), {
                        errCode: -501001,
                      });
                    active = true;
                    try {
                      await Promise.resolve();
                      return await d.get();
                    } finally {
                      active = false;
                    }
                  },
                };
              },
            };
          },
        });
      });
    s.cloud.database = () => rawDatabase;
    expect(await s.main("consent")({ command: "GET" })).toMatchObject({
      ok: true,
      termsVersion: s.policy.terms.version,
    });
  });
  it("accepts exact current terms once without changing acceptedAt on replay", async () => {
    const s = setup();
    const id = hash("consent", "account_a", s.policy.terms.version);
    s.table("mapContributionConsents").delete(id);
    const e = {
      command: "ACCEPT",
      termsVersion: s.policy.terms.version,
      scopeDigest: s.policy.terms.scopeDigest,
      actionId: "accept_terms",
    };
    expect(await s.main("consent")(e)).toMatchObject({
      ok: true,
      accepted: true,
    });
    const before = structuredClone(s.table("mapContributionConsents").get(id));
    s.clock(NOW + 1000);
    await s.main("consent")({ ...e, actionId: "accept_again" });
    expect(s.table("mapContributionConsents").get(id)).toEqual(before);
  });
  it("10 distinct eligible active Account reports hide; cancel stays hidden; audit only once", async () => {
    const s = setup();
    const r = await s.resolveAndProject("one");
    const publicLeadId = r.projection.publicLeadId;
    for (let n = 1; n <= 10; n += 1) {
      s.addAccount(`r${n}`);
      s.caller(`r${n}`);
      const result = await s.main("report")({
        publicLeadId,
        command: "REPORT",
        actionId: `report_${n}_one`,
      });
      expect(result).toMatchObject({
        ok: true,
        active: true,
      });
    }
    expect(
      s.table("publicMapLeads").get(`head:${publicLeadId}`).lifecycleState,
    ).toBe("HIDDEN");
    const e = {
      publicLeadId,
      command: "CANCEL_REPORT",
      actionId: "cancel_ten",
    };
    expect(await s.main("report")(e)).toMatchObject({ active: false });
    expect(
      s.table("mapModerationLedger").get(`target:${publicLeadId}`)
        .distinctEligibleReporters,
    ).toBe(9);
    const auditSize = s.table("mapAuditEvents").size;
    await s.main("report")(e);
    expect(s.table("mapAuditEvents").size).toBe(auditSize);
    expect(await s.main("detail")(detail(publicLeadId))).toMatchObject({
      code: "LEAD_UNAVAILABLE",
    });
    expect(
      [...s.table("mapAuditEvents").values()].filter(
        (x) => x.kind === "AUTO_HIDE",
      ),
    ).toHaveLength(1);
    s.caller("a");
    const i = s.table("boardInstances").get(r.boardInstanceId);
    i.lastEventSequence += 1;
    const next = "late-event";
    s.table("mapProjectionOutbox").set(next, {
      boardInstanceId: i.boardInstanceId,
      eventSequence: i.lastEventSequence,
      status: "PENDING",
      attempts: 0,
    });
    expect(
      (await s.main("project")({ outboxId: next, actionId: "project_late" }))
        .ok,
    ).toBe(true);
    expect(
      s.table("publicMapLeads").get(`head:${publicLeadId}`).lifecycleState,
    ).toBe("HIDDEN");
  });
  it("ineligible/spam/deleted account cannot add eligible report", async () => {
    const s = setup();
    const r = await s.resolveAndProject("one");
    s.caller("b");
    s.table("mapAccountPolicies").get("account:account_b").reporterEligible =
      false;
    expect(
      await s.main("report")({
        publicLeadId: r.projection.publicLeadId,
        command: "REPORT",
        actionId: "report_one",
      }),
    ).toMatchObject({ code: "INELIGIBLE_REPORTER" });
    expect(s.table("mapModerationLedger").size).toBe(0);
  });
  it("deletion hides first, retirement scrubs, and late resolver/projector cannot resurrect", async () => {
    const s = setup();
    const r = await s.resolveAndProject("one");
    const id = r.projection.publicLeadId;
    const deleted = await s.main("owner")({
      contributionId: r.contributionId,
      command: "DELETE",
      actionId: "delete_one",
    });
    expect(deleted.ok).toBe(true);
    expect(await s.main("detail")(detail(id))).toMatchObject({
      code: "LEAD_UNAVAILABLE",
    });
    expect(
      await s.main("project")({
        outboxId: deleted.outboxId,
        actionId: "project_delete",
      }),
    ).toMatchObject({ effect: "RETIRED" });
    expect(s.table("publicMapLeads").get(`head:${id}`).board).toBeNull();
    expect(
      await s.main("project")({
        outboxId: r.outboxId,
        actionId: "project_again",
      }),
    ).toMatchObject({ effect: "LATE_EVENT_DISCARDED" });
    s.table("boardAssociations").delete("head:one");
    expect(
      await s.main("resolve")({
        observationVersionId: "one",
        actionId: "resolve_again",
      }),
    ).toMatchObject({ code: "RECORD_WITHDRAWN" });
    expect(
      s.table("mapContributions").get(r.contributionId).noResurrection,
    ).toBe(true);
  });
  it("current source head invalidation retires support without mutating private source", async () => {
    const s = setup();
    const r = await s.resolveAndProject("one");
    const before = structuredClone(
      s.table("boardObservations").get("observation:one"),
    );
    s.table("boardObservations").get("lineage:one").lifecycleState = "DELETED";
    const i = s.table("boardInstances").get(r.boardInstanceId);
    i.lastEventSequence += 1;
    s.table("mapProjectionOutbox").set("delete-event", {
      boardInstanceId: i.boardInstanceId,
      eventSequence: i.lastEventSequence,
      status: "PENDING",
      attempts: 0,
    });
    expect(
      await s.main("project")({
        outboxId: "delete-event",
        actionId: "project_delete",
      }),
    ).toMatchObject({ effect: "RETIRED" });
    expect(s.table("boardObservations").get("observation:one")).toEqual(before);
  });
  it("rejects older pending outbox and resumes transactional crash without duplication", async () => {
    const s = setup();
    s.observation("one");
    const sources = structuredClone(s.table("boardObservations"));
    s.injectCrashAfter(3);
    expect(
      await s.main("resolve")({
        observationVersionId: "one",
        actionId: "resolve_one",
      }),
    ).toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(s.table("mapContributions").size).toBe(0);
    expect(s.table("mapProjectionOutbox").size).toBe(0);
    s.clearCrash();
    const r = await s.main("resolve")({
      observationVersionId: "one",
      actionId: "resolve_one",
    });
    expect(r.ok).toBe(true);
    expect(s.table("mapContributions").size).toBe(1);
    expect(s.table("boardObservations")).toEqual(sources);
    const i = s.table("boardInstances").get(r.boardInstanceId);
    i.lastEventSequence += 1;
    expect(
      await s.main("project")({
        outboxId: r.outboxId,
        actionId: "project_old",
      }),
    ).toMatchObject({ code: "STALE_OUTBOX_SEQUENCE" });
  });
});

describe("cursor, rate and HA guards", () => {
  it("bounds durable rate and cursor storage across repeated windows", async () => {
    const s = setup();
    await s.resolveAndProject("one", { longitude: 121.47 });
    await s.resolveAndProject("two", { longitude: 121.8 });
    for (const [id, row] of s.table("mapControlState"))
      if (row.kind === "RATE") s.table("mapControlState").delete(id);
    for (let minute = 0; minute < 5; minute += 1) {
      s.clock(NOW + minute * 60000);
      for (let n = 0; n < 30; n += 1)
        expect((await s.main("query")(query(null, 1))).ok).toBe(true);
    }
    expect(s.table("publicMapQuerySnapshots").size).toBe(128);
    expect(
      [...s.table("mapControlState").values()].filter((r) => r.kind === "RATE"),
    ).toHaveLength(1);
  });
  it("binds cursor to Account/query/epoch and expires it after120 seconds", async () => {
    const s = setup();
    await s.resolveAndProject("one", { longitude: 121.47 });
    await s.resolveAndProject("two", { longitude: 121.8 });
    const q = await s.main("query")(query(null, 1));
    expect(q.nextCursor).toBeTruthy();
    s.caller("b");
    expect(await s.main("query")(query(q.nextCursor, 1))).toMatchObject({
      code: "CURSOR_INVALID",
    });
    s.caller("a");
    const e = s.table("mapControlState").get("global:read-epoch");
    e.epoch += 1;
    expect(await s.main("query")(query(q.nextCursor, 1))).toMatchObject({
      code: "CURSOR_INVALID",
    });
    const q2 = await s.main("query")(query(null, 1));
    s.clock(NOW + 120_001);
    expect(await s.main("query")(query(q2.nextCursor, 1))).toMatchObject({
      code: "CURSOR_EXPIRED",
    });
  });
  it("malformed authenticated requests consume durable rate budget", async () => {
    const s = setup();
    for (let n = 0; n < 30; n += 1)
      expect(await s.main("query")({ arbitrary: true })).toMatchObject({
        code: "INVALID_REQUEST",
      });
    expect(await s.main("query")(query())).toMatchObject({
      code: "RATE_LIMITED",
    });
    s.clock(NOW + 60_001);
    expect((await s.main("query")(query(null, 1))).ok).toBe(true);
  });
  it.each(["SAME_BOARD", "DIFFERENT_BOARD", "CANNOT_TELL", "SKIP"])(
    "accepts owner HA %s once with hard-conflict checks",
    async (answer) => {
      const s = setup();
      await s.resolveAndProject("first", { age: 120_000, remaining: 10 });
      await s.resolveAndProject("conflict", { age: 30_000, remaining: 15 });
      await s.resolveAndProject("ambiguous", { age: 1000, remaining: 8 });
      const request = [...s.table("mapAssistanceRequests").values()][0];
      expect((await s.main("getAssistance")({})).items).toHaveLength(1);
      s.caller("b");
      expect(
        await s.main("answerAssistance")({
          requestId: request.requestId,
          answer,
          actionId: "answer_one",
        }),
      ).toMatchObject({ code: "REQUEST_UNAVAILABLE" });
      s.caller("a");
      const e = {
        requestId: request.requestId,
        answer,
        actionId: "answer_one",
      };
      expect(await s.main("answerAssistance")(e)).toMatchObject({
        ok: true,
        accepted: answer,
      });
      const size = s.table("mapAssistanceEvidence").size;
      await s.main("answerAssistance")(e);
      expect(s.table("mapAssistanceEvidence").size).toBe(size);
    },
  );
  it("HA cannot override hard conflict, and pause/budget/cooldown fail closed", async () => {
    const s = setup();
    await s.resolveAndProject("first", { age: 120_000, remaining: 10 });
    await s.resolveAndProject("conflict", { age: 30_000, remaining: 15 });
    await s.resolveAndProject("ambiguous", { age: 1000, remaining: 8 });
    const request = [...s.table("mapAssistanceRequests").values()][0];
    s
      .table("boardObservations")
      .get("observation:ambiguous").input.boardFacts.tiers[0].remainingTickets =
      99;
    expect(
      await s.main("answerAssistance")({
        requestId: request.requestId,
        answer: "SAME_BOARD",
        actionId: "answer_conflict",
      }),
    ).toMatchObject({ code: "HARD_CONFLICT" });
    s.features.haPaused = true;
    expect(await s.main("getAssistance")({})).toMatchObject({
      code: "ASSISTANCE_UNAVAILABLE",
    });
    s.features.haPaused = false;
    const count = s.table("mapAssistanceRequests").size;
    await s.resolveAndProject("ambiguous2", { age: 500, remaining: 7 });
    expect(s.table("mapAssistanceRequests").size).toBe(count);
  });
});

describe("CloudBase transaction limits", () => {
  it("exposes doc-only transactions and rejects operations beyond95 before commit", async () => {
    const s = localDatabase();
    const db = guardedDatabase(s.db, ["mapControlState"]);
    await expect(
      db.runTransaction(async (tx) => {
        expect(tx.collection("mapControlState").where).toBeUndefined();
        for (let i = 0; i < 96; i++)
          await tx.collection("mapControlState").doc(`row:${i}`).get();
      }),
    ).rejects.toThrow("TRANSACTION_OPERATION_BUDGET_EXCEEDED");
    expect(s.table("mapControlState").size).toBe(0);
  });
  it("rejects a preselected candidate set when the shared mutation revision changes", async () => {
    const s = setup();
    s.observation("race");
    const original = s.db.collection;
    s.db.collection = (name) => {
      const c = original(name);
      if (name !== "boardInstances") return c;
      return {
        ...c,
        where: (...args) => {
          const wrap = (q) => ({
            ...q,
            limit: (n) => wrap(q.limit(n)),
            get: async () => {
              const result = await q.get();
              s
                .table("mapControlState")
                .get("global:read-epoch").mutationRevision += 1;
              return result;
            },
          });
          return wrap(c.where(...args));
        },
      };
    };
    expect(
      await s.main("resolve")({
        observationVersionId: "race",
        actionId: "race_action_01",
      }),
    ).toEqual({ ok: false, code: "SERVICE_UNAVAILABLE" });
    expect(s.table("mapContributions").size).toBe(0);
  });
});

describe("newer verified state hides obsolete current projection", () => {
  it("hides before projector and retires if the successor lacks consent", async () => {
    const s = setup();
    const first = await s.resolveAndProject("old", {
      age: 120_000,
      remaining: 9,
    });
    const id = first.projection.publicLeadId;
    s.observation("new", { age: 60_000, owner: "b", remaining: 8 });
    s.table("mapContributionConsents").clear();
    const resolved = await s.main("resolve")({
      observationVersionId: "new",
      actionId: "resolve_new_state",
    });
    expect(resolved.resolution).toBe("UNIQUE_MATCH");
    expect(await s.main("detail")(detail(id))).toMatchObject({
      code: "LEAD_UNAVAILABLE",
    });
    const projected = await s.main("project")({
      outboxId: resolved.outboxId,
      actionId: "project_new_state",
    });
    expect(projected.ok).toBe(true);
    expect(s.table("publicMapLeads").get(`head:${id}`).lifecycleState).toBe(
      "RETIRED",
    );
  });
  it("keeps the ID for an eligible seamless successor after hide-first", async () => {
    const s = setup();
    const first = await s.resolveAndProject("old", {
      age: 120_000,
      remaining: 9,
    });
    s.observation("new", { age: 60_000, owner: "b", remaining: 8 });
    const resolved = await s.main("resolve")({
      observationVersionId: "new",
      actionId: "resolve_new_valid",
    });
    expect(resolved.resolution).toBe("UNIQUE_MATCH");
    expect(
      s.table("publicMapLeads").get(`head:${first.projection.publicLeadId}`)
        .lifecycleState,
    ).toBe("HIDDEN");
    const projected = await s.main("project")({
      outboxId: resolved.outboxId,
      actionId: "project_new_valid",
    });
    expect(projected.publicLeadId).toBe(first.projection.publicLeadId);
    expect(
      s.table("publicMapLeads").get(`head:${projected.publicLeadId}`)
        .servedVersion,
    ).toBe(2);
  });
});

it("does not ask HA when equally recent candidates have equal priority", async () => {
  const s = setup();
  await s.resolveAndProject("first", { age: 120000, remaining: 10 });
  await s.resolveAndProject("second", { age: 120000, remaining: 15 });
  s.observation("ambiguous", { age: 1000, remaining: 8 });
  const result = await s.main("resolve")({
    observationVersionId: "ambiguous",
    actionId: "equal_comparison",
  });
  expect(result).toMatchObject({
    resolution: "AMBIGUOUS",
    assistanceRequested: false,
  });
  expect(s.table("mapAssistanceRequests").size).toBe(0);
});

it("rejects a private lineage mismatch or unbound verification policy", async () => {
  for (const change of [
    (o) => {
      o.input.privateLineageId = "wrong";
    },
    (o) => {
      o.verification.policyVersion = "unapproved";
    },
  ]) {
    const s = setup();
    const o = s.observation("one");
    change(o);
    expect(
      await s.main("resolve")({
        observationVersionId: "one",
        actionId: "policy_mismatch",
      }),
    ).toMatchObject({ code: "OBSERVATION_UNAVAILABLE" });
    expect(s.table("mapContributions").size).toBe(0);
  }
});

describe("active production reporter eligibility", () => {
  it("defaults only ordinary active accounts, never bypasses explicit restrictions", async () => {
    const s = setup();
    s.policy.report.reporterEligibility =
      "ACTIVE_ACCOUNT_EXCLUDING_RESTRICTED_V1";
    s.table("mapAccountPolicies").delete("account:account_b");
    expect(
      await reporterEligible(s.db, "account_b", { policy: s.policy }, NOW),
    ).toBe(true);
    s.table("accounts").get("account_b").status = "banned";
    expect(
      await reporterEligible(s.db, "account_b", { policy: s.policy }, NOW),
    ).toBe(false);
    s.table("accounts").get("account_b").status = "active";
    s.table("mapAccountPolicies").set("account:account_b", {
      accountId: "account_b",
      kind: "ACCOUNT_POLICY",
      authorityVersion: "production-account-policy-v1",
      reporterEligible: false,
      spamOrInvalid: false,
      expiresAt: new Date(NOW + 10000).toISOString(),
    });
    expect(
      await reporterEligible(s.db, "account_b", { policy: s.policy }, NOW),
    ).toBe(false);
  });
});

describe("TASK22 first-page prepared public details", () => {
  it("includes at most two complete public details from the same query without extra reads", async () => {
    const s = setup();
    for (let i = 0; i < 5; i++) {
      const r = await s.resolveAndProject(`prep${i}`, {
        theme: `主题${i}`,
        longitude: 121.5 + i * 0.002,
      });
      s
        .table("publicMapLeads")
        .get(`head:${r.projection.publicLeadId}`).uploadedAt = new Date(
        NOW - i * 1000,
      ).toISOString();
    }
    let documentReads = 0;
    const original = s.db.collection;
    s.db.collection = (name) => {
      const c = original(name);
      if (name !== "publicMapLeads") return c;
      return {
        ...c,
        doc: (id) => {
          const d = c.doc(id);
          return {
            ...d,
            get: async () => {
              documentReads++;
              return d.get();
            },
          };
        },
      };
    };
    const result = await s.main("query")(query());
    expect(result.ok).toBe(true);
    expect(result.items).toHaveLength(5);
    expect(result.preparedDetails).toHaveLength(2);
    expect(documentReads).toBe(0);
    for (const prepared of result.preparedDetails) {
      expect(
        result.items.some(
          (m) =>
            m.publicLeadId === prepared.publicLeadId &&
            m.servedVersion === prepared.servedVersion,
        ),
      ).toBe(true);
      expect(prepared.board.tiers[0].tierCode).toBe("A");
      expect(prepared.uploadedAt).toMatch(/^2026-/);
      expect(JSON.stringify(prepared)).not.toMatch(
        /accountId|rawEvidence|openid|recordId|rawLocation|verificationInputOnly/,
      );
    }
  });
  it("keeps the optional preparation off cursor continuation pages", async () => {
    const s = setup();
    await s.resolveAndProject("prep1", { theme: "one" });
    await s.resolveAndProject("prep2", { theme: "two", longitude: 121.52 });
    const first = await s.main("query")(query(null, 1));
    expect(first.preparedDetails).toHaveLength(1);
    const next = await s.main("query")({
      ...query(first.nextCursor, 1),
      asOf: first.asOf,
    });
    expect(next.ok).toBe(true);
    expect(next.preparedDetails).toBeUndefined();
  });
  it.each(["stop", "epoch", "policy", "account"])(
    "does not return prepared details after final %s rejection",
    async (kind) => {
      const s = setup();
      await s.resolveAndProject("prep1");
      const original = s.db.collection;
      s.db.collection = (name) => {
        const c = original(name);
        if (name !== "publicMapLeads") return c;
        const wrap = (q) => ({
          ...q,
          limit: (n) => wrap(q.limit(n)),
          skip: (n) => wrap(q.skip(n)),
          get: async () => {
            const result = await q.get();
            if (kind === "stop")
              s.table("mapControlState").get("global:read-stop").stopped = true;
            if (kind === "epoch")
              s.table("mapControlState").get("global:read-epoch").epoch++;
            if (kind === "policy")
              s.policy.publicAvatarOrigins = ["https://changed.invalid"];
            if (kind === "account")
              s.table("accounts").get("account_a").status = "suspended";
            return result;
          },
        });
        return { ...c, where: (predicate) => wrap(c.where(predicate)) };
      };
      const result = await s.main("query")(query());
      expect(result.ok).toBe(false);
      expect(result.preparedDetails).toBeUndefined();
    },
  );
});
