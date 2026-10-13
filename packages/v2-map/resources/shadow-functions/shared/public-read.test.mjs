import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  reconcilePublicMapLead,
  emptyProjectorState,
} from "../../../src/projector.js";
import { testPublicCandidate } from "../../../src/test-support.js";
import { createMain as queryMain } from "../v2-shadow-query-public-map-leads/runtime.mjs";
import { createMain as detailMain } from "../v2-shadow-get-public-map-lead-detail/runtime.mjs";
import { shadowDb } from "./mock-db.test-support.mjs";

const now = Date.parse("2026-09-12T03:00:00.000Z");
const principalKey = "p".repeat(48);
const env = {
  ICHI_V2_SHADOW_BOUNDARY: "synthetic_only",
  ICHI_V2_SHADOW_READ_ENABLED: "true",
  ICHI_V2_SHADOW_PRINCIPAL_HMAC_KEY: principalKey,
  ICHI_V2_SHADOW_CURSOR_HMAC_KEY: "c".repeat(48),
};
const digest = (openId) =>
  createHmac("sha256", principalKey)
    .update(`ichi:v2:shadow:principal:v1\0app\0${openId}`)
    .digest("hex");
const make = (count = 1) => {
  const { db, table } = shadowDb();
  table("v2ShadowControlState").set("global:read-stop", {
    stopped: false,
    dataOrigin: "SYNTHETIC_REHEARSAL",
  });
  table("v2ShadowControlState").set("global:read-epoch", {
    epoch: 0,
    dataOrigin: "SYNTHETIC_REHEARSAL",
  });
  for (let index = 0; index < count; index += 1) {
    const candidate = testPublicCandidate(`obs-${index}`);
    const id = String(index + 1).padStart(32, "0");
    const result = reconcilePublicMapLead(
      emptyProjectorState(),
      {
        boardInstanceId: candidate.boardInstanceId,
        eventSequence: 1,
        reconciledAt: new Date(now).toISOString(),
        eligibleCandidates: [candidate],
        projectionVersion: "projection-v1",
        policyVersion: "policy-v1",
      },
      () => id,
    );
    const core = result.state.leads[id];
    table("v2ShadowPublicMapLeads").set(`lead:${id}:1`, {
      ...core,
      lifecycleState: "PUBLIC",
      dataOrigin: "SYNTHETIC_REHEARSAL",
      privateLineageId: "never-serialize-me",
      publicLocation: {
        ...core.publicLocation,
        point: new db.Geo.Point(121.47, 31.23),
      },
    });
  }
  let openId = "owner-a";
  const cloud = {
    database: () => db,
    getWXContext: () => ({ APPID: "app", OPENID: openId }),
  };
  return {
    db,
    table,
    cloud,
    setCaller: (value) => {
      openId = value;
    },
  };
};
const request = (overrides = {}) => ({
  bbox: { west: 121.4, east: 121.5, south: 31.2, north: 31.3 },
  zoom: 12,
  mode: "MAP",
  opportunityStatuses: [],
  includeLowFreshness: true,
  limit: 1,
  cursor: null,
  asOf: null,
  requestId: "test-query",
  generation: 1,
  supportedSchemaVersions: ["public-map-v3"],
  ...overrides,
});

describe("shadow durable public read adapter", () => {
  it("ignores forged caller, pages with HMAC cursor, and emits only public fields", async () => {
    const state = make(2);
    const config = {
      ...env,
      ICHI_V2_SHADOW_TEST_CALLER_DIGESTS: digest("owner-a"),
    };
    const query = queryMain({
      cloud: state.cloud,
      env: config,
      now: () => now,
      newId: () => "a".repeat(32),
    });
    const first = await query(
      request({ callerDigest: digest("owner-b"), accountId: "owner-b" }),
    );
    expect(first.ok).toBe(true);
    expect(first.items).toHaveLength(1);
    expect(first.nextCursor).toMatch(/^a{32}\.1\./u);
    expect(JSON.stringify(first)).not.toMatch(
      /never-serialize-me|privateLineageId|projectionRuleId/u,
    );
    const second = await query(
      request({ cursor: first.nextCursor, asOf: first.asOf }),
    );
    expect(second.ok).toBe(true);
    expect(second.items).toHaveLength(1);
    expect(
      await query(
        request({ cursor: `${first.nextCursor}x`, asOf: first.asOf }),
      ),
    ).toMatchObject({ ok: false, code: "CURSOR_INVALID" });
    state.setCaller("owner-b");
    expect(
      await query(request({ cursor: first.nextCursor, asOf: first.asOf })),
    ).toMatchObject({ ok: false, code: "SHADOW_TEST_CALLER_DENIED" });
  });

  it("requires read-stop control, rechecks hidden rows, and limits durable budget", async () => {
    const state = make();
    const config = {
      ...env,
      ICHI_V2_SHADOW_TEST_CALLER_DIGESTS: digest("owner-a"),
    };
    const detail = detailMain({
      cloud: state.cloud,
      env: config,
      now: () => now,
    });
    const leadId = "1".padStart(32, "0");
    const detailRequest = {
      publicLeadId: leadId,
      requestId: "detail",
      generation: 1,
      supportedSchemaVersions: ["public-map-v3"],
    };
    const first = await detail(detailRequest);
    expect(first.ok).toBe(true);
    expect(JSON.stringify(first)).not.toMatch(
      /never-serialize-me|privateLineageId|projectionRuleId/u,
    );
    state
      .table("v2ShadowPublicMapLeads")
      .get(`lead:${leadId}:1`).lifecycleState = "HIDDEN";
    expect(await detail(detailRequest)).toMatchObject({
      ok: false,
      code: "LEAD_UNAVAILABLE",
    });
    state.table("v2ShadowControlState").get("global:read-stop").stopped = true;
    expect(await detail(detailRequest)).toMatchObject({
      ok: false,
      code: "SERVICE_UNAVAILABLE",
    });
    state.table("v2ShadowControlState").get("global:read-stop").stopped = false;
    for (let n = 0; n < 58; n += 1) await detail(detailRequest);
    expect(await detail(detailRequest)).toMatchObject({
      ok: false,
      code: "RATE_LIMITED",
    });
  });

  it("caps snapshots at 500, expires them after 120 seconds and invalidates on epoch change", async () => {
    const state = make(501);
    const config = {
      ...env,
      ICHI_V2_SHADOW_TEST_CALLER_DIGESTS: digest("owner-a"),
    };
    let clock = now;
    const query = queryMain({
      cloud: state.cloud,
      env: config,
      now: () => clock,
      newId: () => "b".repeat(32),
    });
    const first = await query(request({ limit: 50 }));
    expect(first).toMatchObject({ ok: true, truncated: true });
    expect(
      state
        .table("v2ShadowPublicMapQuerySnapshots")
        .get(`snapshot:${"b".repeat(32)}`).refs,
    ).toHaveLength(500);
    state.table("v2ShadowControlState").get("global:read-epoch").epoch = 1;
    expect(
      await query(
        request({ limit: 50, cursor: first.nextCursor, asOf: first.asOf }),
      ),
    ).toMatchObject({ ok: false, code: "CURSOR_INVALID" });
    state.table("v2ShadowControlState").get("global:read-epoch").epoch = 0;
    clock += 120_001;
    expect(
      await query(
        request({ limit: 50, cursor: first.nextCursor, asOf: first.asOf }),
      ),
    ).toMatchObject({ ok: false, code: "CURSOR_EXPIRED" });
  });
});

describe("TASK21 serving policy migration", () => {
  it("hides rows from a superseded policy from query and detail", async () => {
    const state = make();
    const row = [...state.table("v2ShadowPublicMapLeads").values()][0];
    row.opportunity.policyVersion = "superseded-opportunity-policy";
    const config = {
      ...env,
      ICHI_V2_SHADOW_TEST_CALLER_DIGESTS: digest("owner-a"),
    };
    const query = queryMain({
      cloud: state.cloud,
      env: config,
      now: () => now,
      newId: () => "b".repeat(32),
    });
    expect(await query(request())).toMatchObject({
      ok: true,
      schemaVersion: "public-map-v3",
      items: [],
    });
    const detail = detailMain({
      cloud: state.cloud,
      env: config,
      now: () => now,
    });
    expect(
      await detail({
        publicLeadId: row.publicLeadId,
        requestId: "policy-detail",
        generation: 1,
        supportedSchemaVersions: ["public-map-v3"],
      }),
    ).toMatchObject({ ok: false, code: "LEAD_UNAVAILABLE" });
  });
  it("fails closed on malformed configured policy", async () => {
    const state = make();
    const config = {
      ...env,
      ICHI_V2_SHADOW_TEST_CALLER_DIGESTS: digest("owner-a"),
      ICHI_V2_SHADOW_OPPORTUNITY_POLICY: "invalid-json",
    };
    expect(
      await queryMain({ cloud: state.cloud, env: config, now: () => now })(
        request(),
      ),
    ).toMatchObject({ ok: false, code: "SERVICE_UNAVAILABLE" });
  });
});
