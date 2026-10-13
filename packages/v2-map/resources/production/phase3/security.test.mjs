import { describe, it, expect } from "vitest";
import {
  networkSignedRequest,
  networkRequestValid,
  networkSmokeReadTime,
  networkVisibleToCaller,
} from "./security.mjs";
import { createNetworkMain } from "./runtime.mjs";
import { setup as playerSetup, NOW } from "../phase2/fixtures.test-support.mjs";
import { createMain } from "../shared/runtime.mjs";
import fs from "node:fs";
import { localDatabase } from "../tests/db.test-support.mjs";

const key = "fixture-network-key-".repeat(3),
  now = Date.parse("2026-10-06T14:00:00Z"),
  id = "a".repeat(32);
const control = {
  policy: {
    network: {
      smoke: {
        viewerAccountId: "existing-viewer",
        publicLeadIds: [id],
        expiresAt: new Date(now + 3600000).toISOString(),
      },
    },
  },
};
const caller = { accountId: "existing-viewer" },
  env = { ICHI_V2_NETWORK_OPS_HMAC_KEY: key };
describe("official network production capability", () => {
  it("binds the complete payload and a 30-second real-clock window", () => {
    const event = networkSignedRequest(
      key,
      { command: "ADMIT", record: { sourceId: "fixture" } },
      now,
    );
    expect(networkRequestValid(key, event, now)).toBe(true);
    for (const bad of [
      { ...event, command: "TAKEDOWN" },
      { ...event, record: { sourceId: "another" } },
      { ...event, signature: "0".repeat(64) },
    ])
      expect(networkRequestValid(key, bad, now)).toBe(false);
    expect(networkRequestValid(key, event, now + 30001)).toBe(false);
  });
  it("only allows a signed, scoped smoke clock for the exact viewer and lead", () => {
    const proof = networkSignedRequest(
      key,
      { command: "SMOKE_READ", publicLeadId: id, nowMs: now + 30 * 86400000 },
      now,
    );
    expect(
      networkSmokeReadTime(
        env,
        { networkSmokeRead: proof },
        control,
        caller,
        now,
      ),
    ).toMatchObject({ ok: true, target: id });
    expect(
      networkSmokeReadTime(
        env,
        { networkSmokeRead: proof },
        control,
        { accountId: "other" },
        now,
      ),
    ).toMatchObject({ ok: false });
    expect(
      networkSmokeReadTime(
        env,
        { networkSmokeRead: { ...proof, nowMs: now + 1 } },
        control,
        caller,
        now,
      ),
    ).toMatchObject({ ok: false });
    expect(networkSmokeReadTime(env, {}, control, caller, now)).toEqual({
      ok: true,
      nowMs: now,
      target: null,
    });
  });
  it("hides fixture IDs from every other account, including cached/cursor reads", () => {
    const core = { publicLeadId: id };
    expect(networkVisibleToCaller(core, control, caller, now)).toBe(core);
    expect(
      networkVisibleToCaller(core, control, { accountId: "other" }, now),
    ).toBeNull();
    expect(
      networkVisibleToCaller(core, control, caller, now + 3600000),
    ).toBeNull();
    expect(
      networkVisibleToCaller(
        { publicLeadId: "b".repeat(32) },
        control,
        caller,
        now,
        id,
      ),
    ).toBeNull();
    expect(
      networkVisibleToCaller(
        { publicLeadId: "b".repeat(32) },
        control,
        { accountId: "other" },
        now,
      ),
    ).not.toBeNull();
  });
  it("keeps admission and real timers closed without changing PLAYER switches", async () => {
    const s = localDatabase();
    s.table("mapControlState").set("global:network", {
      kind: "NETWORK_CONTROL",
      contract: "official-network-production-v1",
      curatorAuthorityId: "ichi-official-founder",
      admissionEnabled: false,
      maintenanceEnabled: false,
      smokeEnabled: false,
    });
    const deps = {
      cloud: { database: () => s.db, getWXContext: () => ({}) },
      env: {
        ...env,
        ICHI_V2_BACKEND_MODE: "production",
        TRIGGER_SRC: "timer",
        ICHI_V2_NETWORK_MAINTENANCE_ENABLED: "false",
      },
      now: () => now,
    };
    const maintenance = createNetworkMain({
      ...deps,
      operation: "maintenance",
    });
    expect(
      await maintenance({ TriggerName: "spoof", Type: "Timer" }),
    ).toMatchObject({ code: "UNAUTHORIZED" });
    expect(
      await maintenance({}, { environment: { TRIGGER_SRC: "timer" } }),
    ).toEqual({ ok: true, disabled: true, processed: 0 });
    const admission = createNetworkMain({ ...deps, operation: "admission" });
    expect(
      await admission(
        networkSignedRequest(
          key,
          { command: "ADMIT", record: { sourceId: "unapproved" } },
          now,
        ),
      ),
    ).toMatchObject({ code: "NETWORK_SERVICE_DISABLED" });
    expect(
      await admission(networkSignedRequest(key, { command: "STATUS" }, now)),
    ).toMatchObject({
      ok: true,
      admissionEnabled: false,
      maintenanceEnabled: false,
    });
    expect(s.accesses.every((a) => a.operation !== "set")).toBe(true);
  });
});

const proposal = JSON.parse(
  fs.readFileSync(
    new URL("../cloudbase-production-resource-proposal.json", import.meta.url),
  ),
);
describe("production public entry smoke capability", () => {
  it("passes the entry allowlist before signed smoke clock validation", async () => {
    const s = playerSetup();
    s.policy.network = {
      ...control.policy.network,
      smoke: {
        ...control.policy.network.smoke,
        viewerAccountId: "account_a",
        expiresAt: new Date(NOW + 3600000).toISOString(),
      },
    };
    const proof = networkSignedRequest(
      key,
      { command: "SMOKE_READ", publicLeadId: id, nowMs: NOW + 30 * 86400000 },
      NOW,
    );
    const run = (operation) =>
      createMain({
        cloud: s.cloud,
        env: { ...s.env, ...env },
        operation,
        collectionAllowlist: proposal.functions.find(
          (f) => f.operation === operation,
        ).collectionAllowlist,
        now: () => NOW,
      });
    const detail = {
      publicLeadId: id,
      requestId: "smoke-entry-detail",
      generation: 1,
      supportedSchemaVersions: ["public-map-v3", "public-map-v4"],
      networkSmokeRead: proof,
    };
    expect(await run("detail")(detail)).toMatchObject({
      code: "LEAD_UNAVAILABLE",
    });
    const query = {
      bbox: { west: 121.38, south: 31.14, east: 121.58, north: 31.3 },
      zoom: 12,
      mode: "MAP",
      opportunityStatuses: [],
      includeLowFreshness: true,
      limit: 50,
      cursor: null,
      asOf: null,
      requestId: "smoke-entry-query",
      generation: 1,
      supportedSchemaVersions: ["public-map-v3", "public-map-v4"],
      networkSmokeRead: proof,
    };
    expect(await run("query")(query)).toMatchObject({ ok: true, items: [] });
    expect(
      await run("detail")({
        ...detail,
        networkSmokeRead: { ...proof, nowMs: NOW + 1 },
      }),
    ).toMatchObject({ code: "UNAUTHORIZED" });
  });
});
