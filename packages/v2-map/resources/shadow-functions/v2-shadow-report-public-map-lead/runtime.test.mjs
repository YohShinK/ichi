import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createMain as projectorMain } from "../v2-shadow-reconcile-projection/runtime.mjs";
import { createMain, REPORT_POLICY } from "./runtime.mjs";
import {
  reconcilePublicMapLead,
  emptyProjectorState,
} from "../../../src/projector.js";
import { testPublicCandidate } from "../../../src/test-support.js";
import { createMain as queryMain } from "../v2-shadow-query-public-map-leads/runtime.mjs";
import { createMain as detailMain } from "../v2-shadow-get-public-map-lead-detail/runtime.mjs";
import { publicCore } from "../shared/public-read.mjs";
import { shadowDb } from "../shared/mock-db.test-support.mjs";
const now = Date.parse("2026-09-30T09:00:00Z");
const lead = "a".repeat(32);
const principal = "p".repeat(48);
const digest = (id) =>
  createHmac("sha256", principal)
    .update(`ichi:v2:shadow:principal:v1\0app\0${id}`)
    .digest("hex");
// Replay only the observed transport keys. All contents here are synthetic.
const transportEnvelope = {
  userInfo: { openId: "user1", appId: "app" },
  tcbContext: { OPENID: "user1", APPID: "app" },
};
const setup = () => {
  const mock = shadowDb({
    v2ShadowControlState: {
      "global:read-stop": { stopped: false, dataOrigin: "SYNTHETIC_REHEARSAL" },
      "global:read-epoch": { epoch: 25, dataOrigin: "SYNTHETIC_REHEARSAL" },
    },
    v2ShadowPublicMapLeads: {
      [`lead:${lead}:1`]: {
        _id: `lead:${lead}:1`,
        publicLeadId: lead,
        servedVersion: 1,
        visibility: "VISIBLE",
        lifecycleState: "PUBLIC",
        dataOrigin: "SYNTHETIC_REHEARSAL",
      },
    },
    v2ShadowBoardInstances: {
      "instance-1": {
        _id: "instance-1",
        boardInstanceId: "instance-1",
        activePublicLeadId: lead,
        lifecycleState: "ACTIVE",
        dataOrigin: "SYNTHETIC_REHEARSAL",
      },
    },
  });
  const originalCollection = mock.db.collection;
  mock.db.collection = (name) => {
    const collection = originalCollection(name);
    return {
      ...collection,
      doc: (id) => {
        const document = collection.doc(id);
        return {
          ...document,
          set: (input) => {
            if ("_id" in input.data) throw new Error("readonly CloudBase _id");
            return document.set(input);
          },
        };
      },
    };
  };
  // Serialize test transactions and roll back all writes on errors. This is a test double, not CloudBase evidence.
  let tail = Promise.resolve();
  mock.db.runTransaction = (cb) => {
    const p = tail.then(async () => {
      const before = structuredClone(mock.tables);
      try {
        return await cb(mock.db);
      } catch (e) {
        mock.tables.clear();
        for (const [k, v] of before) mock.tables.set(k, v);
        throw e;
      }
    });
    tail = p.catch(() => {});
    return p;
  };
  const env = {
    ICHI_V2_SHADOW_BOUNDARY: "synthetic_only",
    ICHI_V2_SHADOW_REPORT_ENABLED: "true",
    ICHI_V2_SHADOW_REPORT_POLICY_VERSION: REPORT_POLICY.policyVersion,
    ICHI_V2_SHADOW_PRINCIPAL_HMAC_KEY: principal,
    ICHI_V2_SHADOW_TEST_CALLER_DIGESTS: Array.from({ length: 12 }, (_, i) =>
      digest(`user${i}`),
    ).join(","),
  };
  const main = (id = "user0", extra = {}) => {
    const d = digest(id);
    if (!mock.table("v2ShadowControlState").has(`reporter:${d}`))
      mock.table("v2ShadowControlState").set(`reporter:${d}`, {
        kind: "REPORTER_AUTHORITY",
        subjectDigest: d,
        windowKey: "current",
        accountActive: true,
        eligible: true,
        spamOrInvalid: false,
        expiresAt: new Date(now + 60000).toISOString(),
        dataOrigin: "SYNTHETIC_REHEARSAL",
      });
    return createMain({
      cloud: {
        getWXContext: () => ({ APPID: "app", OPENID: id }),
        database: () => mock.db,
      },
      env: { ...env, ...extra },
      now: () => now,
    });
  };
  const command = (fn, command = "REPORT", actionId = "action-123") =>
    fn({
      ...transportEnvelope,
      publicLeadId: lead,
      command,
      ...(command === "GET_STATE" ? {} : { actionId }),
    });
  const count = () =>
    [...mock.table("v2ShadowModerationLedger").values()].find(
      (x) => x.kind === "TARGET_POLICY_STATE",
    )?.activeDistinctEligibleReporters ?? 0;
  return { ...mock, env, main, command, count };
};
describe("TASK21 server-authoritative report/cancel candidate", () => {
  it.each(["userInfo", "tcbContext", "both"])(
    "replays observed transport keys (%s) across report/cancel/audit/idempotency without trusting their identity",
    async (shape) => {
      const s = setup();
      const fn = s.main("user0");
      const envelope =
        shape === "both"
          ? transportEnvelope
          : { [shape]: transportEnvelope[shape] };
      const call = (command, actionId) =>
        fn({
          ...envelope,
          publicLeadId: lead,
          command,
          ...(actionId ? { actionId } : {}),
        });
      const reports = () =>
        [...s.table("v2ShadowModerationLedger").values()].filter(
          (row) => row.kind === "REPORT_STATE",
        );
      const audits = () =>
        [...s.table("v2ShadowModerationLedger").values()].filter(
          (row) => row.kind === "AUDIT",
        );
      expect(await call("GET_STATE")).toMatchObject({
        ok: true,
        active: false,
      });
      expect(await call("REPORT", "report-first-001")).toMatchObject({
        ok: true,
        active: true,
      });
      expect(s.count()).toBe(1);
      expect(reports()).toHaveLength(1);
      expect(reports()[0]).toMatchObject({
        state: "ACTIVE",
        reporterSubjectDigest: digest("user0"),
      });
      expect(audits()).toHaveLength(1);
      await call("REPORT", "report-first-001");
      expect(audits()).toHaveLength(1);
      await call("REPORT", "report-repeat-002");
      expect(s.count()).toBe(1);
      expect(audits()).toHaveLength(2);
      expect(audits()[1]).toMatchObject({ command: "REPORT", duplicate: true });
      expect(await call("CANCEL_REPORT", "cancel-first-001")).toMatchObject({
        ok: true,
        active: false,
      });
      expect(s.count()).toBe(0);
      expect(reports()[0].state).toBe("CANCELLED");
      await call("REPORT", "report-first-001");
      expect(s.count()).toBe(0);
      expect(audits()).toHaveLength(3);
      expect(await call("REPORT", "report-again-003")).toMatchObject({
        ok: true,
        active: true,
      });
      expect(s.count()).toBe(1);
      expect(reports()[0].state).toBe("ACTIVE");
      expect(await call("CANCEL_REPORT", "cancel-again-004")).toMatchObject({
        ok: true,
        active: false,
      });
      await call("CANCEL_REPORT", "cancel-again-004");
      expect(s.count()).toBe(0);
      expect(reports()[0].state).toBe("CANCELLED");
      expect(audits()).toHaveLength(5);
      expect(
        audits().every((row) => row.reporterSubjectDigest === digest("user0")),
      ).toBe(true);
      expect(await s.command(s.main("user1"), "GET_STATE")).toMatchObject({
        ok: true,
        active: false,
      });
    },
  );
  it.each([
    "callerDigest",
    "reporterAccountId",
    "eligible",
    "threshold",
    "moderatorRole",
    "OPENID",
    "tcbcontext",
    "userInfoCopy",
  ])(
    "still rejects unknown or forged business field %s with both transport keys",
    async (key) => {
      const s = setup();
      const fn = s.main();
      const before = structuredClone(s.tables);
      expect(
        await fn({
          ...transportEnvelope,
          publicLeadId: lead,
          command: "REPORT",
          actionId: "forged-extra-001",
          [key]: true,
        }),
      ).toEqual({ ok: false, code: "INVALID_REQUEST" });
      expect(s.tables).toEqual(before);
    },
  );
  it.each(["not-allowlisted", "context-unavailable"])(
    "forged transport identity cannot authorize %s",
    async (mode) => {
      const s = setup();
      const fn = createMain({
        cloud: {
          getWXContext: () => {
            if (mode === "context-unavailable") throw new Error("no WXContext");
            return { APPID: "app", OPENID: "not-allowlisted" };
          },
          database: () => {
            throw new Error(
              "unauthorized requests must not access persistence",
            );
          },
        },
        env: s.env,
      });
      const before = structuredClone(s.tables);
      expect(
        await fn({
          ...transportEnvelope,
          publicLeadId: lead,
          command: "REPORT",
          actionId: "forged-authority-001",
        }),
      ).toEqual({ ok: false, code: "UNAUTHORIZED" });
      expect(s.tables).toEqual(before);
    },
  );
  it.each(["flag", "read-stop", "boundary", "policy", "allowlist"])(
    "both transport keys cannot bypass safe-stop %s or write ledger/audit/rate",
    async (gate) => {
      const s = setup();
      const env = {
        ...(gate === "flag" ? { ICHI_V2_SHADOW_REPORT_ENABLED: "false" } : {}),
        ...(gate === "boundary" ? { ICHI_V2_SHADOW_BOUNDARY: "other" } : {}),
        ...(gate === "policy"
          ? { ICHI_V2_SHADOW_REPORT_POLICY_VERSION: "wrong" }
          : {}),
        ...(gate === "allowlist"
          ? { ICHI_V2_SHADOW_TEST_CALLER_DIGESTS: "" }
          : {}),
      };
      const fn = s.main("user0", env);
      if (gate === "read-stop")
        s.table("v2ShadowControlState").get("global:read-stop").stopped = true;
      const before = structuredClone(s.tables);
      expect(await s.command(fn)).toEqual({
        ok: false,
        code: gate === "allowlist" ? "UNAUTHORIZED" : "REPORT_DISABLED",
      });
      expect(s.tables).toEqual(before);
    },
  );
  it("ignores the platform userInfo envelope and uses only trusted WXContext identity", async () => {
    const s = setup();
    const fn = s.main("user0");
    const request = {
      publicLeadId: lead,
      userInfo: { openId: "user1", appId: "forged-app" },
    };
    expect(await fn({ ...request, command: "GET_STATE" })).toMatchObject({
      ok: true,
      active: false,
    });
    expect(
      await fn({ ...request, command: "REPORT", actionId: "wx-report-123" }),
    ).toMatchObject({ ok: true, active: true });
    expect(s.count()).toBe(1);
    expect(await s.command(s.main("user1"), "GET_STATE")).toMatchObject({
      ok: true,
      active: false,
    });
    expect(
      await fn({
        ...request,
        command: "CANCEL_REPORT",
        actionId: "wx-cancel-123",
      }),
    ).toMatchObject({ ok: true, active: false });
    expect(s.count()).toBe(0);
    expect(
      await s.main("not-allowlisted")({
        ...request,
        command: "REPORT",
        actionId: "forged-report-123",
      }),
    ).toMatchObject({ ok: false, code: "UNAUTHORIZED" });
    expect(
      await fn({
        ...request,
        command: "GET_STATE",
        callerDigest: digest("user1"),
      }),
    ).toMatchObject({ ok: false, code: "INVALID_REQUEST" });
  });
  it("rejects malformed requests before resolving identity", async () => {
    const s = setup();
    const fn = s.main();
    for (const event of [null, [], "forged", {}])
      expect(await fn(event)).toMatchObject({
        ok: false,
        code: "INVALID_REQUEST",
      });
  });
  it("records only rejection structure, never request values or reporter identity", async () => {
    const s = setup();
    const diagnostics = [];
    const fn = createMain({
      cloud: {
        getWXContext: () => ({ APPID: "app", OPENID: "user0" }),
        database: () => s.db,
      },
      env: s.env,
      now: () => now,
      diagnose: (value) => diagnostics.push(value),
    });
    expect(
      await fn({
        publicLeadId: lead,
        command: "REPORT",
        actionId: "wx-report-123",
        transportMeta: "private-value-do-not-log",
        userInfo: { openId: "private-openid-do-not-log" },
        tcbContext: { OPENID: "private-tcb-openid-do-not-log" },
      }),
    ).toEqual({ ok: false, code: "INVALID_REQUEST" });
    expect(diagnostics).toEqual([
      {
        version: 1,
        stage: "BUSINESS_FIELDS",
        extraKeyCount: 1,
        extraKeys: ["transportMeta"],
        leadValid: true,
        commandValid: true,
        actionValid: true,
        leadType: "string",
        leadLength: 32,
        commandType: "string",
        actionType: "string",
        actionLength: 13,
      },
    ]);
    const text = JSON.stringify(diagnostics);
    for (const value of [
      "private-value-do-not-log",
      "private-openid-do-not-log",
      "private-tcb-openid-do-not-log",
      digest("user0"),
      lead,
      "wx-report-123",
    ])
      expect(text).not.toContain(value);
    expect(s.count()).toBe(0);
    expect(s.table("v2ShadowModerationLedger").size).toBe(0);
  });
  it("diagnostic failures cannot change the rejection result and closed flags emit nothing", async () => {
    const s = setup();
    const cloud = {
      getWXContext: () => ({ APPID: "app", OPENID: "user0" }),
      database: () => s.db,
    };
    const fn = createMain({
      cloud,
      env: s.env,
      diagnose: () => {
        throw new Error("logger-unavailable");
      },
    });
    expect(await fn(null)).toEqual({ ok: false, code: "INVALID_REQUEST" });
    let calls = 0;
    const closed = createMain({
      cloud,
      env: { ...s.env, ICHI_V2_SHADOW_REPORT_ENABLED: "false" },
      diagnose: () => calls++,
    });
    expect(await closed(null)).toEqual({ ok: false, code: "INVALID_REQUEST" });
    expect(calls).toBe(0);
  });
  it("one account/repeated/cross-device reporters contribute only one active count", async () => {
    const s = setup();
    await Promise.all([
      s.command(s.main()),
      s.command(s.main(), "REPORT", "other-action"),
      s.command(s.main()),
    ]);
    expect(s.count()).toBe(1);
    expect((await s.command(s.main(), "GET_STATE")).active).toBe(true);
  });
  it("9 remain public; 10th hides, advances epoch, cancels to9 without resurrection, retains audits", async () => {
    const s = setup();
    for (let i = 0; i < 9; i++) await s.command(s.main(`user${i}`));
    expect(s.count()).toBe(9);
    expect(
      s.table("v2ShadowPublicMapLeads").get(`lead:${lead}:1`).visibility,
    ).toBe("VISIBLE");
    expect(await s.command(s.main("user9"))).toMatchObject({
      ok: true,
      hidden: true,
    });
    expect(s.count()).toBe(10);
    expect(
      s.table("v2ShadowPublicMapLeads").get(`lead:${lead}:1`),
    ).not.toHaveProperty("_id");
    expect(
      s.table("v2ShadowBoardInstances").get("instance-1"),
    ).not.toHaveProperty("_id");
    expect(s.table("v2ShadowControlState").get("global:read-epoch").epoch).toBe(
      26,
    );
    expect(
      publicCore(s.table("v2ShadowPublicMapLeads").get(`lead:${lead}:1`)),
    ).toBe(null);
    expect(
      s.table("v2ShadowBoardInstances").get("instance-1")
        .moderationThresholdHidden,
    ).toBe(true);
    await s.command(s.main(), "CANCEL_REPORT", "cancel-action");
    expect(s.count()).toBe(9);
    expect(
      s.table("v2ShadowPublicMapLeads").get(`lead:${lead}:1`).visibility,
    ).toBe("HIDDEN");
    expect(
      [...s.table("v2ShadowModerationLedger").values()]
        .filter((x) => x.kind === "AUDIT")
        .map((x) => x.command),
    ).toEqual(expect.arrayContaining(["REPORT", "CANCEL_REPORT", "AUTO_HIDE"]));
  });
  it("immediate cancel/repeated cancel/re-report are idempotent; delayed old action cannot undo cancel", async () => {
    const s = setup();
    const fn = s.main();
    await s.command(fn);
    await s.command(fn, "CANCEL_REPORT", "cancel-action");
    await s.command(fn, "CANCEL_REPORT", "cancel-duplicate");
    expect(s.count()).toBe(0);
    await s.command(fn);
    expect(s.count()).toBe(0);
    await s.command(fn, "REPORT", "report-again");
    expect(s.count()).toBe(1);
  });
  it("rejects forged reporter/eligibility/account/threshold and unknown policy without contaminating audit", async () => {
    const s = setup();
    for (const key of [
      "reporterAccountId",
      "eligible",
      "threshold",
      "moderatorRole",
    ])
      expect(
        await s.main()({
          publicLeadId: lead,
          command: "REPORT",
          actionId: "action-123",
          [key]: true,
        }),
      ).toMatchObject({ ok: false, code: "INVALID_REQUEST" });
    expect(await s.command(s.main("forged"))).toMatchObject({
      ok: false,
      code: "UNAUTHORIZED",
    });
    expect(
      await s.command(
        s.main("user0", { ICHI_V2_SHADOW_REPORT_POLICY_VERSION: "new-policy" }),
      ),
    ).toMatchObject({ ok: false, code: "REPORT_DISABLED" });
    expect(s.count()).toBe(0);
  });
  it("ineligible authority does not count; missing/expired account fails closed", async () => {
    const s = setup();
    const fn = s.main();
    const authority = s
      .table("v2ShadowControlState")
      .get(`reporter:${digest("user0")}`);
    authority.eligible = false;
    expect(await s.command(fn)).toMatchObject({
      ok: false,
      code: "INELIGIBLE_REPORTER",
    });
    authority.eligible = true;
    authority.expiresAt = new Date(now - 1).toISOString();
    expect(await s.command(fn)).toMatchObject({ ok: false });
    expect(s.count()).toBe(0);
  });
  it.each(["RETIRED", "DELETED"])(
    "%s target cannot be reported",
    async (state) => {
      const s = setup();
      s.table("v2ShadowPublicMapLeads").get(`lead:${lead}:1`).lifecycleState =
        state;
      expect(await s.command(s.main())).toMatchObject({
        ok: false,
        code: "LEAD_UNAVAILABLE",
      });
      expect(s.count()).toBe(0);
    },
  );
  it("safe stop/rate abuse fail closed and responses contain no identity/count/audit/private source", async () => {
    const s = setup();
    const fn = s.main();
    const result = await s.command(fn);
    expect(Object.keys(result).sort()).toEqual([
      "active",
      "hidden",
      "ok",
      "policyVersion",
    ]);
    for (let i = 0; i < 29; i++) await s.command(fn, "GET_STATE");
    expect(await s.command(fn, "GET_STATE")).toMatchObject({
      ok: false,
      code: "RATE_LIMITED",
    });
    s.table("v2ShadowControlState").get("global:read-stop").stopped = true;
    expect(await s.command(fn)).toMatchObject({
      ok: false,
      code: "REPORT_DISABLED",
    });
    expect(s.count()).toBe(1);
  });
  it("threshold transaction rolls back on missing epoch, without destructive delete", async () => {
    const s = setup();
    for (let i = 0; i < 9; i++) await s.command(s.main(`user${i}`));
    s.table("v2ShadowControlState").get("global:read-epoch").epoch = null;
    expect(await s.command(s.main("user9"))).toMatchObject({
      ok: false,
      code: "SERVICE_UNAVAILABLE",
    });
    expect(s.count()).toBe(9);
    expect(
      s.table("v2ShadowPublicMapLeads").get(`lead:${lead}:1`).visibility,
    ).toBe("VISIBLE");
  });
});

describe("TASK21 hide affects real candidate read contracts", () => {
  it("hides query/detail and invalidates old cursor without leaking ledger or private fields", async () => {
    const s = setup();
    for (const id of [lead, "b".repeat(32)]) {
      const c = testPublicCandidate(`obs-${id}`);
      const projection = reconcilePublicMapLead(
        emptyProjectorState(),
        {
          boardInstanceId: c.boardInstanceId,
          eventSequence: 1,
          reconciledAt: new Date(now).toISOString(),
          eligibleCandidates: [c],
          projectionVersion: "projection-v1",
          policyVersion: "policy-v1",
        },
        () => id,
      );
      s.table("v2ShadowPublicMapLeads").set(`lead:${id}:1`, {
        ...projection.state.leads[id],
        lifecycleState: "PUBLIC",
        dataOrigin: "SYNTHETIC_REHEARSAL",
        privateLineageId: "never-serialize",
        publicLocation: {
          ...projection.state.leads[id].publicLocation,
          point: new s.db.Geo.Point(121.47, 31.23),
        },
      });
    }
    const cloud = {
      database: () => s.db,
      getWXContext: () => ({ APPID: "app", OPENID: "user0" }),
    };
    const env = {
      ...s.env,
      ICHI_V2_SHADOW_READ_ENABLED: "true",
      ICHI_V2_SHADOW_CURSOR_HMAC_KEY: "c".repeat(48),
    };
    const query = queryMain({
      cloud,
      env,
      now: () => now,
      newId: () => "d".repeat(32),
    });
    const detail = detailMain({ cloud, env, now: () => now });
    const request = {
      bbox: { west: 121.4, east: 121.5, south: 31.2, north: 31.3 },
      zoom: 12,
      mode: "MAP",
      opportunityStatuses: [],
      includeLowFreshness: true,
      limit: 1,
      cursor: null,
      asOf: null,
      requestId: "query-1",
      generation: 1,
      supportedSchemaVersions: ["public-map-v3"],
    };
    const before = await query(request);
    expect(before.ok).toBe(true);
    expect(before.nextCursor).toBeTruthy();
    expect(
      (
        await detail({
          publicLeadId: lead,
          requestId: "detail-1",
          generation: 1,
          supportedSchemaVersions: ["public-map-v3"],
        })
      ).ok,
    ).toBe(true);
    for (let i = 0; i < 10; i++) await s.command(s.main(`user${i}`));
    const after = await query({ ...request, limit: 50 });
    expect(after.ok).toBe(true);
    expect(after.items.map((x) => x.publicLeadId)).not.toContain(lead);
    expect(
      await detail({
        publicLeadId: lead,
        requestId: "detail-2",
        generation: 1,
        supportedSchemaVersions: ["public-map-v3"],
      }),
    ).toMatchObject({ ok: false, code: "LEAD_UNAVAILABLE" });
    expect(
      await query({ ...request, cursor: before.nextCursor, asOf: before.asOf }),
    ).toMatchObject({ ok: false, code: "CURSOR_INVALID" });
    expect(JSON.stringify(after)).not.toMatch(
      /never-serialize|reporterSubjectDigest|activeDistinctEligibleReporters|privateLineageId|audit/,
    );
  });
});

describe("TASK21 threshold latch survives subsequent projection", () => {
  it("consumes later outbox without recreating or revealing the hidden lead", async () => {
    const s = setup();
    for (let i = 0; i < 10; i++) await s.command(s.main(`user${i}`));
    const outboxId = "outbox:" + "e".repeat(40);
    s.table("v2ShadowProjectionOutbox").set(outboxId, {
      dataOrigin: "SYNTHETIC_REHEARSAL",
      status: "PENDING",
      boardInstanceId: "instance-1",
      eventSequence: 1,
      nextAttemptAt: new Date(now).toISOString(),
    });
    const body = Buffer.from(
      JSON.stringify({
        version: 1,
        environmentId: "cloud1-d7gxqfwv783a1f131",
        purpose: "reconcile-projection",
        audience: "v2-shadow-reconcile-projection",
        nonce: "threshold_test_nonce_001",
        issuedAtMs: now - 1000,
        expiresAtMs: now + 60000,
        outboxId,
      }),
    ).toString("base64url");
    const key = "r".repeat(48);
    const capability =
      body + "." + createHmac("sha256", key).update(body).digest("base64url");
    const main = projectorMain({
      cloud: { database: () => s.db },
      env: {
        ICHI_V2_SHADOW_BOUNDARY: "synthetic_only",
        ICHI_V2_SHADOW_PROJECTOR_ENABLED: "true",
        ICHI_V2_SHADOW_CONSENT_ENABLED: "true",
        ICHI_V2_SHADOW_MAP_CONTRIBUTION_TERMS_VERSION:
          "candidate-map-contribution-v3",
        ICHI_V2_SHADOW_MAP_CONTRIBUTION_SCOPE_DIGEST: "f".repeat(64),
        ICHI_V2_SHADOW_REHEARSAL_HMAC_KEY: key,
      },
      now: () => now,
      newLeadId: () => "f".repeat(32),
    });
    expect(await main({ outboxId, capability })).toMatchObject({
      ok: true,
      effect: "MODERATION_HIDDEN",
    });
    expect(s.table("v2ShadowPublicMapLeads").size).toBe(1);
    expect(
      s.table("v2ShadowPublicMapLeads").get(`lead:${lead}:1`).visibility,
    ).toBe("HIDDEN");
    await s.command(s.main(), "CANCEL_REPORT", "after-outbox-cancel");
    expect(s.count()).toBe(9);
    expect(
      s.table("v2ShadowPublicMapLeads").get(`lead:${lead}:1`).visibility,
    ).toBe("HIDDEN");
  });
});

describe("TASK21 signed server-only synthetic threshold rehearsal", () => {
  it("supports 10 test principals without forged WXContext and rejects unsigned/replayed grants", async () => {
    const s = setup();
    const key = "r".repeat(48);
    const main = createMain({
      cloud: {
        database: () => s.db,
        getWXContext: () => {
          throw new Error("no real account");
        },
      },
      env: {
        ...s.env,
        ICHI_V2_SHADOW_REPORT_REHEARSAL_ENABLED: "true",
        ICHI_V2_SHADOW_REHEARSAL_HMAC_KEY: key,
      },
      now: () => now,
    });
    let lastToken;
    for (let i = 0; i < 10; i++) {
      s.main(`user${i}`);
      const subjectDigest = digest(`user${i}`);
      s
        .table("v2ShadowControlState")
        .get(`reporter:${subjectDigest}`).principalClass =
        "SYNTHETIC_TEST_PRINCIPAL";
      const body = Buffer.from(
        JSON.stringify({
          version: 1,
          environmentId: "cloud1-d7gxqfwv783a1f131",
          purpose: "report-rehearsal",
          audience: "v2-shadow-report-public-map-lead",
          nonce: `signed_threshold_nonce_${i}`,
          issuedAtMs: now - 1000,
          expiresAtMs: now + 60000,
          policyVersion: REPORT_POLICY.policyVersion,
          subjectDigest,
          publicLeadId: lead,
          command: "REPORT",
          actionId: `synthetic-report-${i}`,
        }),
      ).toString("base64url");
      lastToken =
        body + "." + createHmac("sha256", key).update(body).digest("base64url");
      expect(await main({ capability: lastToken })).toMatchObject({
        ok: true,
        hidden: i === 9,
      });
    }
    expect(s.count()).toBe(10);
    expect(await main({ capability: lastToken })).toMatchObject({
      ok: false,
      code: "UNAUTHORIZED",
    });
    expect(await main({ capability: "forged" })).toMatchObject({
      ok: false,
      code: "UNAUTHORIZED",
    });
    expect(
      await main({
        publicLeadId: lead,
        command: "REPORT",
        actionId: "unsigned-principal",
        subjectDigest: digest("user10"),
      }),
    ).toMatchObject({ ok: false });
    expect(
      [...s.table("v2ShadowModerationLedger").values()]
        .filter((x) => x.command === "REPORT")
        .every((x) => x.principalClass === "SYNTHETIC_TEST_PRINCIPAL"),
    ).toBe(true);
  });
});
