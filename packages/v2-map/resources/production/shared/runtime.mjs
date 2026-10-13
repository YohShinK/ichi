import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import {
  networkSmokeReadTime,
  networkVisibleToCaller,
} from "../phase3/security.mjs";
import { registerConsentSourceWake } from "./source-wake.mjs";
import {
  coversUploadedV1,
  uploadedV1ConsentAccepted,
} from "./uploaded-v1-consent.mjs";
import { PublicMapService } from "../../../src/public-api.js";
import { resolveBoardInstance } from "../../../src/board-instance.js";
import {
  reconcilePublicMapLead,
  emptyProjectorState,
} from "../../../src/projector.js";
import { applyOwnerContributionCommand } from "../../../src/authorization.js";
import { visibilityAfterActiveReports } from "../../../src/moderation.js";
import { validOpportunityPolicy } from "../../../src/opportunity.js";
import {
  guardedDatabase,
  trustedAccount,
  hasMaintenanceAuthority,
  accountPolicy,
  read,
  put,
  rows,
  hash,
  readControl,
  consumeRate,
  invalidateEpoch,
  audit,
  secretReady,
} from "./security.mjs";
import {
  verifiedObservation,
  currentObservation,
  candidateFromObservation,
  safePublicCore,
} from "./domain.mjs";

const fail = (code) => ({ ok: false, code });
const iso = (nowMs) => new Date(nowMs).toISOString();
const actionValid = (v) =>
  typeof v === "string" && /^[A-Za-z0-9_-]{8,128}$/u.test(v);
const idValid = (v) =>
  typeof v === "string" && /^[A-Za-z0-9:_-]{1,160}$/u.test(v);
const FEATURE = {
  query: "readEnabled",
  detail: "readEnabled",
  resolve: "resolverEnabled",
  project: "projectorEnabled",
  owner: "ownerEnabled",
  consent: "consentEnabled",
  report: "reportEnabled",
  getAssistance: "haEnabled",
  answerAssistance: "haEnabled",
};
const KEYS = {
  query: [
    "bbox",
    "zoom",
    "mode",
    "opportunityStatuses",
    "includeLowFreshness",
    "limit",
    "cursor",
    "asOf",
    "requestId",
    "generation",
    "supportedSchemaVersions",
    "networkSmokeRead",
  ],
  detail: [
    "publicLeadId",
    "requestId",
    "generation",
    "supportedSchemaVersions",
    "networkSmokeRead",
  ],
  resolve: ["observationVersionId", "actionId"],
  project: ["outboxId", "actionId"],
  owner: ["contributionId", "command", "actionId"],
  consent: ["command", "termsVersion", "scopeDigest", "actionId"],
  report: ["publicLeadId", "command", "actionId"],
  getAssistance: [],
  answerAssistance: ["requestId", "answer", "actionId"],
};
const cleanEvent = (event) => {
  if (!event || typeof event !== "object" || Array.isArray(event)) return null;
  return Object.fromEntries(
    Object.entries(event).filter(
      ([key]) => key !== "userInfo" && key !== "tcbContext",
    ),
  );
};
const policyValid = (p) =>
  p?.policyVersion === "map-production-phase1-v1" &&
  validOpportunityPolicy(p.opportunity) &&
  typeof p.projectionVersion === "string" &&
  typeof p.resolverVersion === "string" &&
  p.freshness?.policyVersion &&
  Number.isSafeInteger(p.freshness.recentMaxAgeMs) &&
  Number.isSafeInteger(p.freshness.agingMaxAgeMs) &&
  p.freshness.recentMaxAgeMs >= 0 &&
  p.freshness.agingMaxAgeMs >= p.freshness.recentMaxAgeMs &&
  p.report?.policyVersion === "v2-21-report-policy-1" &&
  p.report.autoHideDistinctEligibleReports === 10;

const verifyCursor = (cursor, secret) => {
  if (typeof cursor !== "string" || cursor.length > 256) return null;
  const [id, offset, tag, extra] = cursor.split(".");
  if (
    extra ||
    !/^[a-f0-9]{32}$/u.test(id ?? "") ||
    !/^\d+$/u.test(offset ?? "") ||
    !Number.isSafeInteger(Number(offset)) ||
    Number(offset) > 500 ||
    !tag
  )
    return null;
  const expected = createHmac("sha256", secret)
    .update(`${id}.${offset}`)
    .digest();
  const received = Buffer.from(tag, "base64url");
  return received.length === expected.length &&
    timingSafeEqual(received, expected)
    ? id
    : null;
};
const currentPublic = (db, id) =>
  read(db.collection("publicMapLeads"), `head:${id}`);
const inBounds = (p, b) =>
  p &&
  p.longitude >= b.west &&
  p.longitude <= b.east &&
  p.latitude >= b.south &&
  p.latitude <= b.north;
const validBounds = (b) =>
  b &&
  [b.west, b.east, b.south, b.north].every(Number.isFinite) &&
  b.west >= -180 &&
  b.east <= 180 &&
  b.south >= -90 &&
  b.north <= 90 &&
  b.west < b.east &&
  b.south < b.north;
const geoRows = async (db, b) => {
  const polygon = new db.Geo.Polygon([
    new db.Geo.LineString([
      new db.Geo.Point(b.west, b.south),
      new db.Geo.Point(b.east, b.south),
      new db.Geo.Point(b.east, b.north),
      new db.Geo.Point(b.west, b.north),
      new db.Geo.Point(b.west, b.south),
    ]),
  ]);
  const all = [];
  for (let offset = 0; offset <= 500; offset += 100) {
    const limit = Math.min(100, 501 - offset);
    const batch = rows(
      await db
        .collection("publicMapLeads")
        .where({
          kind: "HEAD",
          lifecycleState: "PUBLIC",
          "publicLocation.point": db.command.geoWithin({ geometry: polygon }),
        })
        .skip(offset)
        .limit(limit)
        .get(),
    );
    all.push(...batch.filter((r) => inBounds(r.publicLocation, b)));
    if (batch.length < limit) break;
  }
  return all;
};

const publicRead = async (
  { db, caller, control, env, nowMs, newId, cloud },
  operation,
  event,
) => {
  if (!secretReady(env.ICHI_V2_CURSOR_HMAC_KEY))
    return fail("SERVICE_UNAVAILABLE");
  const actualNowMs = nowMs;
  const clock = networkSmokeReadTime(env, event, control, caller, actualNowMs);
  if (!clock.ok) return fail(clock.code);
  nowMs = clock.nowMs;
  const view = (core) =>
    networkVisibleToCaller(core, control, caller, actualNowMs, clock.target);

  const current = new Map();
  const versions = new Map();
  let stored = null;
  let save = null;
  if (operation === "query") {
    if (!validBounds(event.bbox)) return fail("INVALID_VIEWPORT");
    if (
      !Number.isSafeInteger(event.limit) ||
      event.limit < 1 ||
      event.limit > 50
    )
      return fail("INVALID_REQUEST");
    if (event.cursor != null) {
      const id = verifyCursor(event.cursor, env.ICHI_V2_CURSOR_HMAC_KEY);
      if (!id) return fail("CURSOR_INVALID");
      stored =
        rows(
          await db
            .collection("publicMapQuerySnapshots")
            .where({ snapshotId: id })
            .limit(1)
            .get(),
        )[0] ?? null;
      if (!stored || stored.expiresAtMs <= nowMs) return fail("CURSOR_EXPIRED");
      if (
        stored.epoch !== control.epoch ||
        !Array.isArray(stored.refs) ||
        stored.refs.length > 500
      )
        return fail("CURSOR_INVALID");
      const accountDigest = createHmac("sha256", env.ICHI_V2_CURSOR_HMAC_KEY)
        .update(caller.digest)
        .digest("hex");
      if (stored.accountDigest !== accountDigest) return fail("CURSOR_INVALID");
      const offset = Number(event.cursor.split(".")[1]);
      for (const ref of stored.refs.slice(offset, offset + event.limit)) {
        const [version, latest] = await Promise.all([
          read(
            db.collection("publicMapLeads"),
            `lead:${ref.publicLeadId}:${ref.servedVersion}`,
          ),
          currentPublic(db, ref.publicLeadId),
        ]);
        const old = view(
          safePublicCore(
            version,
            control.policy.opportunity.policyVersion,
            nowMs,
            control.policy.publicAvatarOrigins ?? [],
            control.policy.network,
          ),
        );
        const head = view(
          safePublicCore(
            latest,
            control.policy.opportunity.policyVersion,
            nowMs,
            control.policy.publicAvatarOrigins ?? [],
            control.policy.network,
          ),
        );
        if (old) versions.set(`${old.publicLeadId}:${old.servedVersion}`, old);
        if (head) current.set(head.publicLeadId, head);
      }
    } else {
      for (const row of await geoRows(db, event.bbox)) {
        const core = view(
          safePublicCore(
            row,
            control.policy.opportunity.policyVersion,
            nowMs,
            control.policy.publicAvatarOrigins ?? [],
            control.policy.network,
          ),
        );
        if (!core) continue;
        current.set(core.publicLeadId, core);
        versions.set(`${core.publicLeadId}:${core.servedVersion}`, core);
      }
    }
  } else {
    if (!/^[a-f0-9]{32}$/u.test(event.publicLeadId ?? ""))
      return fail("INVALID_REQUEST");
    const core = view(
      safePublicCore(
        await currentPublic(db, event.publicLeadId),
        control.policy.opportunity.policyVersion,
        nowMs,
        control.policy.publicAvatarOrigins ?? [],
        control.policy.network,
      ),
    );
    if (core) current.set(core.publicLeadId, core);
  }
  const service = new PublicMapService(
    {
      listVisibleWithin: () => [...current.values()],
      getCurrent: (id) => current.get(id) ?? null,
      getVersion: (id, version) => versions.get(`${id}:${version}`) ?? null,
    },
    {
      save: (s) => {
        save = s;
      },
      get: (id) => (id === stored?.snapshotId ? stored : null),
      invalidate: () => {},
    },
    control.policy.freshness,
    {
      account: { currentAccount: () => ({ accountId: caller.digest }) },
      readControl: { readState: () => "ENABLED" },
      rateLimit: { consume: () => "ALLOWED" },
      cursorSecret: { currentSecret: () => env.ICHI_V2_CURSOR_HMAC_KEY },
    },
    undefined,
    () => nowMs,
    newId,
  );
  const response =
    operation === "query"
      ? service.query({
          ...event,
          cursor: event.cursor ?? null,
          asOf: event.asOf ?? null,
        })
      : service.detail(event);
  if (!response.ok) return response;
  // A page with no continuation never uses a persisted cursor snapshot.
  if (save && response.nextCursor !== null)
    await db.runTransaction(async (tx) => {
      const fresh = await readControl(tx);
      if (
        !fresh ||
        !fresh.features.readEnabled ||
        fresh.epoch !== control.epoch
      )
        throw new Error("CONTROL_CHANGED");
      const counterId = `snapshot-counter:${caller.digest}`;
      const c = tx.collection("mapControlState");
      const prior = await read(c, counterId);
      const slot = prior?.nextSlot ?? 0;
      if (!Number.isSafeInteger(slot) || slot < 0 || slot >= 128)
        throw new Error("SNAPSHOT_COUNTER_INVALID");
      const snapshotId = `slot:${caller.digest}:${slot}`;
      const snapshots = tx.collection("publicMapQuerySnapshots");
      const old = await read(snapshots, snapshotId);
      if (old && old.expiresAtMs > nowMs)
        throw new Error("SNAPSHOT_CAPACITY_UNAVAILABLE");
      await put(snapshots, snapshotId, {
        ...save,
        epoch: control.epoch,
        expiresAt: iso(save.expiresAtMs),
      });
      await put(c, counterId, {
        kind: "SNAPSHOT_COUNTER",
        nextSlot: (slot + 1) % 128,
      });
    });
  const [after, finalCaller] = await Promise.all([
    readControl(db, true),
    trustedAccount(cloud, db, env),
  ]);
  if (
    !after ||
    !after.features.readEnabled ||
    after.epoch !== control.epoch ||
    after.policy.opportunity.policyVersion !==
      control.policy.opportunity.policyVersion ||
    JSON.stringify(after.policy) !== JSON.stringify(control.policy)
  )
    return fail("SERVICE_UNAVAILABLE");
  if (finalCaller?.accountId !== caller.accountId) return fail("UNAUTHORIZED");
  if (operation === "query" && !event.cursor) {
    // These cores were already read and passed the same public read final checks.
    // Reuse at most two; no extra DB reads, detail RPC, or private source access.
    const preparedDetails = response.items.slice(0, 2).flatMap((marker) => {
      const ready = service.detail({
        publicLeadId: marker.publicLeadId,
        requestId: event.requestId,
        generation: event.generation,
        supportedSchemaVersions: event.supportedSchemaVersions,
      });
      if (!ready.ok) return [];
      const uploadedAt = current.get(marker.publicLeadId)?.uploadedAt;
      return [{ ...ready.item, ...(uploadedAt ? { uploadedAt } : {}) }];
    });
    return { ...response, preparedDetails };
  }
  if (operation === "detail") {
    const uploadedAt = current.get(event.publicLeadId)?.uploadedAt;
    if (uploadedAt)
      return { ...response, item: { ...response.item, uploadedAt } };
  }
  return response;
};

const enqueue = async (tx, instance, nowMs) => {
  const sequence = instance.lastEventSequence + 1;
  if (!Number.isSafeInteger(sequence) || sequence < 1)
    throw new Error("SEQUENCE_INVALID");
  const outboxId = hash("outbox", instance.boardInstanceId, String(sequence));
  await put(tx.collection("mapProjectionOutbox"), outboxId, {
    boardInstanceId: instance.boardInstanceId,
    eventSequence: sequence,
    status: "PENDING",
    createdAt: iso(nowMs),
    attempts: 0,
  });
  const next = { ...instance, lastEventSequence: sequence };
  await put(tx.collection("boardInstances"), instance.boardInstanceId, next);
  return { outboxId, instance: next };
};

const link = async (tx, o, boardInstanceId, resolution, policy, nowMs) => {
  const contributionId = hash("contribution", o.lineageId);
  const old = await read(tx.collection("mapContributions"), contributionId);
  if (old?.noResurrection || ["DELETED", "WITHDRAWN"].includes(old?.lifecycle))
    return fail("RECORD_WITHDRAWN");
  if (old?.boardInstanceId && old.boardInstanceId !== boardInstanceId)
    return fail("LINEAGE_RELINK_REQUIRES_CORRECTION");
  const prior = await read(tx.collection("boardInstances"), boardInstanceId);
  const instance = {
    ...(prior ?? {}),
    boardInstanceId,
    lifecycleState: "ACTIVE",
    instanceVersion: (prior?.instanceVersion ?? 0) + 1,
    lastObservationVersionId: o.observationVersionId,
    candidatePoint: new tx.Geo.Point(
      o.input.location.longitude,
      o.input.location.latitude,
    ),
    lastEventSequence: prior?.lastEventSequence ?? 0,
    lastAppliedEventSequence: prior?.lastAppliedEventSequence ?? 0,
    activePublicLeadId: prior?.activePublicLeadId ?? null,
    activeServedVersion: prior?.activeServedVersion ?? 0,
    retiredIds: prior?.retiredIds ?? [],
  };
  const work = await enqueue(tx, instance, nowMs);
  if (
    prior?.activePublicLeadId &&
    prior.lastObservationVersionId !== o.observationVersionId
  ) {
    const lead = await currentPublic(tx, prior.activePublicLeadId);
    if (!lead || lead.retiredAt) throw new Error("PROJECTION_STATE_INVALID");
    await put(
      tx.collection("publicMapLeads"),
      `head:${prior.activePublicLeadId}`,
      {
        ...lead,
        lifecycleState: "HIDDEN",
        hideReason: "SUCCESSOR_PENDING_PROJECTION",
      },
    );
    await invalidateEpoch(tx);
  }
  const previous = await read(
    tx.collection("boardAssociations"),
    `head:${o.observationVersionId}`,
  );
  const decisionVersion = (previous?.decisionVersion ?? 0) + 1;
  const association = {
    kind: "HEAD",
    observationVersionId: o.observationVersionId,
    boardInstanceId,
    decisionVersion,
    supersedesDecisionVersion: previous?.decisionVersion ?? null,
    action: "LINK",
    resolution,
    resolverVersion: policy.resolverVersion,
    createdAt: iso(nowMs),
  };
  await put(
    tx.collection("boardAssociations"),
    `head:${o.observationVersionId}`,
    association,
  );
  await put(
    tx.collection("boardAssociations"),
    hash(o.observationVersionId, String(decisionVersion)),
    { ...association, kind: "DECISION" },
  );
  await put(tx.collection("mapContributions"), contributionId, {
    contributionId,
    lineageId: o.lineageId,
    observationVersionId: o.observationVersionId,
    ownerAccountId: o.source.ownerAccountId ?? null,
    sourceFamily: o.source.family,
    boardInstanceId,
    lifecycle: "ACTIVE",
    noResurrection: false,
    authorizationApplicable: true,
    publicHideIntent: false,
    processedCommandIds: [],
  });
  return {
    ok: true,
    boardInstanceId,
    contributionId,
    outboxId: work.outboxId,
    resolution,
  };
};

const maybeAssistance = async (tx, o, candidates, control, nowMs) => {
  const h = control.policy.ha;
  if (
    !control.features.haEnabled ||
    control.features.haPaused !== false ||
    o.source.family !== "PLAYER" ||
    !h?.policyVersion ||
    h.comparisonPolicyVersion !== "most-recent-unique-v1" ||
    ![h.cooldownMs, h.windowMs, h.maxRequests, h.requestTtlMs].every(
      (v) => Number.isSafeInteger(v) && v > 0,
    )
  )
    return false;
  const requestId = `ha:${hash(o.observationVersionId).slice(0, 40)}`;
  if (await read(tx.collection("mapAssistanceRequests"), requestId))
    return false;
  const owner = o.source.ownerAccountId;
  const window = Math.floor(nowMs / h.windowMs);
  const c = tx.collection("mapControlState");
  const budgetId = `ha-budget:${hash(owner)}`;
  const cooldownId = `ha-cooldown:${hash(owner)}`;
  const budget = await read(c, budgetId);
  const cooldown = await read(c, cooldownId);
  const budgetCount = budget?.window === window ? budget.count : 0;
  if (budgetCount >= h.maxRequests || (cooldown?.nextAllowedAtMs ?? 0) > nowMs)
    return false;
  // Draft policy, never bound in initial production controls. Equal priority does not ask.
  const ranked = [...candidates].sort(
    (a, b) =>
      Date.parse(b.lastVerifiedBoard.observedAt) -
      Date.parse(a.lastVerifiedBoard.observedAt),
  );
  if (
    ranked.length < 2 ||
    Date.parse(ranked[0].lastVerifiedBoard.observedAt) ===
      Date.parse(ranked[1].lastVerifiedBoard.observedAt)
  )
    return false;
  const comparison = ranked[0];
  await put(tx.collection("mapAssistanceRequests"), requestId, {
    requestId,
    ownerAccountId: owner,
    observationVersionId: o.observationVersionId,
    comparisonBoardInstanceId: comparison.boardInstanceId,
    comparisonInstanceVersion: comparison.instanceVersion,
    comparisonObservationVersionId: comparison.lastObservationVersionId,
    state: "PENDING",
    policyVersion: h.policyVersion,
    expiresAt: iso(nowMs + h.requestTtlMs),
  });
  await put(c, budgetId, {
    kind: "HA_BUDGET",
    window,
    count: budgetCount + 1,
    expiresAt: iso((window + 1) * h.windowMs),
  });
  await put(c, cooldownId, {
    kind: "HA_COOLDOWN",
    nextAllowedAtMs: nowMs + h.cooldownMs,
    expiresAt: iso(nowMs + h.cooldownMs),
  });
  return true;
};

// Queries happen before the transaction. Every mutation fences the shared revision;
// a changed revision rejects this selection, and each selected row is re-read by doc in the snapshot.
const prepareSelection = async (db, operation, event) => {
  const selected = { nearby: [], contributions: [], reports: [] };
  if (operation === "resolve" && idValid(event.observationVersionId)) {
    const o = await currentObservation(db, event.observationVersionId);
    if (verifiedObservation(o))
      selected.nearby = rows(
        await db
          .collection("boardInstances")
          .where({
            lifecycleState: "ACTIVE",
            candidatePoint: db.command.geoNear({
              geometry: new db.Geo.Point(
                o.input.location.longitude,
                o.input.location.latitude,
              ),
              maxDistance: 250,
            }),
          })
          .limit(50)
          .get(),
      );
  } else if (operation === "project" && idValid(event.outboxId)) {
    const work = await read(
      db.collection("mapProjectionOutbox"),
      event.outboxId,
    );
    if (work)
      selected.contributions = rows(
        await db
          .collection("mapContributions")
          .where({ boardInstanceId: work.boardInstanceId, lifecycle: "ACTIVE" })
          .limit(101)
          .get(),
      );
  } else if (
    operation === "report" &&
    event.command !== "GET_STATE" &&
    /^[a-f0-9]{32}$/u.test(event.publicLeadId ?? "")
  ) {
    selected.reports = rows(
      await db
        .collection("mapModerationLedger")
        .where({
          kind: "REPORT_STATE",
          publicLeadId: event.publicLeadId,
          active: true,
        })
        .limit(1000)
        .get(),
    );
  }
  return selected;
};
const snapshotRows = async (collection, selection) => {
  const result = [];
  for (const row of selection) {
    if (!idValid(row._id)) throw new Error("SELECTION_ID_INVALID");
    const fresh = await read(collection, row._id);
    if (fresh) result.push({ ...fresh, _id: row._id });
  }
  return result;
};

const resolve = async (tx, event, control, nowMs, selection) => {
  if (!idValid(event.observationVersionId)) return fail("INVALID_REQUEST");
  const o = await currentObservation(tx, event.observationVersionId);
  const v = verifiedObservation(o);
  if (!v || o.verification.policyVersion !== control.policy.verificationVersion)
    return fail("OBSERVATION_UNAVAILABLE");
  const contribution = await read(
    tx.collection("mapContributions"),
    hash("contribution", o.lineageId),
  );
  if (
    contribution?.noResurrection ||
    ["DELETED", "WITHDRAWN"].includes(contribution?.lifecycle)
  )
    return fail("RECORD_WITHDRAWN");
  const prior = await read(
    tx.collection("boardAssociations"),
    `head:${o.observationVersionId}`,
  );
  if (prior?.action === "LINK")
    return {
      ok: true,
      resolution: prior.resolution,
      boardInstanceId: prior.boardInstanceId,
      duplicate: true,
    };
  const nearby = (
    await snapshotRows(tx.collection("boardInstances"), selection.nearby)
  ).filter((i) => i.lifecycleState === "ACTIVE");
  if (nearby.length >= 50) return fail("CANDIDATE_SET_TRUNCATED");
  const candidates = [];
  for (const i of nearby) {
    if (i.boardInstanceId === prior?.negativeBoardInstanceId) continue;
    const raw = await read(
      tx.collection("boardObservations"),
      `observation:${i.lastObservationVersionId}`,
    );
    const verified = verifiedObservation(raw);
    if (!verified) return fail("CANDIDATE_INVALID");
    candidates.push({ ...i, lastVerifiedBoard: verified });
  }
  const resolution = resolveBoardInstance(
    v,
    v.verifiedBoardVersion,
    candidates,
  );
  if (resolution.kind.startsWith("REJECTED")) return fail(resolution.kind);
  if (resolution.kind === "AMBIGUOUS")
    return {
      ok: true,
      resolution: "AMBIGUOUS",
      assistanceRequested: await maybeAssistance(
        tx,
        o,
        candidates.filter((i) =>
          resolution.candidateIds.includes(i.boardInstanceId),
        ),
        control,
        nowMs,
      ),
    };
  const id =
    resolution.kind === "UNIQUE_MATCH"
      ? resolution.boardInstanceId
      : hash("instance", o.observationVersionId);
  if (
    resolution.kind === "NO_MATCH" &&
    (await read(tx.collection("boardInstances"), id))
  )
    return fail("STALE_CANDIDATE");
  return link(tx, o, id, resolution.kind, control.policy, nowMs);
};

const project = async (tx, event, control, nowMs, newId, selection) => {
  if (!idValid(event.outboxId)) return fail("INVALID_REQUEST");
  const work = await read(tx.collection("mapProjectionOutbox"), event.outboxId);
  if (
    !work ||
    !Number.isSafeInteger(work.eventSequence) ||
    work.eventSequence < 1
  )
    return fail("OUTBOX_UNAVAILABLE");
  const instance = await read(
    tx.collection("boardInstances"),
    work.boardInstanceId,
  );
  if (!instance) return fail("INSTANCE_UNAVAILABLE");
  if (
    work.status === "APPLIED" ||
    work.eventSequence <= instance.lastAppliedEventSequence
  ) {
    await put(tx.collection("mapProjectionOutbox"), event.outboxId, {
      ...work,
      status: "APPLIED",
    });
    return { ok: true, effect: "LATE_EVENT_DISCARDED" };
  }
  if (work.eventSequence !== instance.lastEventSequence)
    return fail("STALE_OUTBOX_SEQUENCE");
  const contributions = (
    await snapshotRows(
      tx.collection("mapContributions"),
      selection.contributions,
    )
  ).filter(
    (c) =>
      c.boardInstanceId === instance.boardInstanceId &&
      c.lifecycle === "ACTIVE",
  );
  if (contributions.length > 100) return fail("SUPPORT_SET_TRUNCATED");
  const candidates = [];
  const contributorOwners = new Map();
  for (const contribution of contributions) {
    const o = await currentObservation(tx, contribution.observationVersionId);
    if (!o) continue;
    const candidate = await candidateFromObservation(
      tx,
      o,
      contribution,
      control.policy,
      nowMs,
    );
    if (candidate) {
      candidates.push(candidate);
      const ownerId = o.source.ownerAccountId;
      const attribution = candidate.contributors?.[0];
      const priorAttribution = contributorOwners.get(ownerId);
      if (
        ownerId &&
        attribution &&
        (!priorAttribution ||
          Date.parse(o.input.observedAt) >
            Date.parse(priorAttribution.observedAt))
      )
        contributorOwners.set(ownerId, {
          attribution,
          observedAt: o.input.observedAt,
        });
    }
  }
  // A newer active, verified observation proves the old board snapshot obsolete.
  // It must itself pass publication gates before any current state can be served.
  const latestActive = contributions.some(
    (c) => c.observationVersionId === instance.lastObservationVersionId,
  );
  if (
    latestActive &&
    !candidates.some(
      (c) => c.observationVersionId === instance.lastObservationVersionId,
    )
  ) {
    const latest = await currentObservation(
      tx,
      instance.lastObservationVersionId,
    );
    // Expiry removes this NETWORK support alone. Other current support survives.
    if (!(
      latest?.source.family === "NETWORK" &&
      Date.parse(latest.publicProjection?.publicUntil) <= nowMs
    ))
      candidates.length = 0;
  }
  const allContributors = [...contributorOwners.entries()]
    .sort(
      (a, b) =>
        Date.parse(b[1].observedAt) - Date.parse(a[1].observedAt) ||
        a[0].localeCompare(b[0]),
    )
    .map(([, value]) => value.attribution);
  const state = emptyProjectorState();
  state.instances[instance.boardInstanceId] = {
    lastEventSequence: instance.lastAppliedEventSequence,
    activePublicLeadId: instance.activePublicLeadId,
    currentSupportObservationVersionId:
      instance.currentSupportObservationVersionId ?? null,
  };
  for (const id of instance.retiredIds) state.retiredIds[id] = true;
  if (instance.activePublicLeadId) {
    const prior = await currentPublic(tx, instance.activePublicLeadId);
    if (!prior || prior.visibility !== "VISIBLE")
      return fail("PROJECTION_STATE_INVALID");
    state.leads[prior.publicLeadId] = { ...prior };
    if (
      candidates.length > 0 &&
      prior.publicUntil &&
      Date.parse(prior.publicUntil) <= nowMs &&
      !candidates.some(
        (c) => c.observationVersionId !== instance.lastObservationVersionId,
      )
    ) {
      // The last support ended before this event: retain a tombstone and start a
      // new public lifecycle rather than reviving an expired public identifier.
      const retired = {
        ...prior,
        servedVersion: prior.servedVersion + 1,
        visibility: "RETIRED",
        lifecycleState: "RETIRED",
        retiredAt: iso(nowMs),
        publicUntil: null,
        publicLocation: null,
        boardShortLabel: null,
        board: null,
        recordType: null,
        opportunity: null,
        observedAt: null,
        freshnessPolicyVersion: null,
        venueNote: null,
        contributor: null,
        contributors: [],
        sourceLabel: null,
        disclosures: null,
      };
      await put(
        tx.collection("publicMapLeads"),
        `head:${prior.publicLeadId}`,
        retired,
      );
      await put(
        tx.collection("publicMapLeads"),
        `lead:${prior.publicLeadId}:${retired.servedVersion}`,
        { ...retired, kind: "VERSION" },
      );
      state.retiredIds[prior.publicLeadId] = true;
      state.instances[instance.boardInstanceId] = {
        ...state.instances[instance.boardInstanceId],
        activePublicLeadId: null,
        currentSupportObservationVersionId: null,
      };
    }
  }
  const next = reconcilePublicMapLead(
    state,
    {
      boardInstanceId: instance.boardInstanceId,
      eventSequence: work.eventSequence,
      reconciledAt: iso(nowMs),
      eligibleCandidates: candidates.map((candidate) => ({
        ...candidate,
        contributors:
          candidate.sourceType === "NETWORK_SOURCE" ? [] : allContributors,
      })),
      projectionVersion: control.policy.projectionVersion,
      policyVersion: control.policy.policyVersion,
    },
    newId,
  );
  if (next.publicLeadId) {
    const core = next.state.leads[next.publicLeadId];
    if (
      next.effect === "CREATED" &&
      (await currentPublic(tx, core.publicLeadId))
    )
      throw new Error("PUBLIC_LEAD_ID_COLLISION_OR_RESURRECTION");
    const moderation = await read(
      tx.collection("mapModerationLedger"),
      `target:${core.publicLeadId}`,
    );
    const retired = core.visibility === "RETIRED";
    const support = await currentObservation(
      tx,
      next.state.instances[instance.boardInstanceId]
        .currentSupportObservationVersionId,
    );
    let row = {
      ...core,
      uploadedAt: support?.publicProjection?.uploadedAt ?? null,
      kind: "HEAD",
      lifecycleState: retired
        ? "RETIRED"
        : moderation?.hidden === true
          ? "HIDDEN"
          : "PUBLIC",
      publicUntil: core.publicUntil ?? null,
    };
    if (!retired) {
      const safe = safePublicCore(
        { ...row, lifecycleState: "PUBLIC" },
        control.policy.opportunity.policyVersion,
        nowMs,
        control.policy.publicAvatarOrigins ?? [],
        control.policy.network,
      );
      if (!safe) throw new Error("PUBLIC_PROJECTION_INVALID");
      row = {
        ...safe,
        kind: "HEAD",
        lifecycleState: row.lifecycleState,
        publicUntil: core.publicUntil ?? null,
      };
    }
    if (row.publicLocation)
      row.publicLocation = {
        ...row.publicLocation,
        point: new tx.Geo.Point(
          row.publicLocation.longitude,
          row.publicLocation.latitude,
        ),
      };
    await put(
      tx.collection("publicMapLeads"),
      `head:${core.publicLeadId}`,
      row,
    );
    await put(
      tx.collection("publicMapLeads"),
      `lead:${core.publicLeadId}:${core.servedVersion}`,
      { ...row, kind: "VERSION" },
    );
  }
  const projection = next.state.instances[instance.boardInstanceId];
  await put(tx.collection("boardInstances"), instance.boardInstanceId, {
    ...instance,
    lastAppliedEventSequence: work.eventSequence,
    activePublicLeadId: projection.activePublicLeadId,
    currentSupportObservationVersionId:
      projection.currentSupportObservationVersionId,
    activeServedVersion: projection.activePublicLeadId
      ? next.state.leads[projection.activePublicLeadId].servedVersion
      : 0,
    retiredIds: Object.keys(next.state.retiredIds),
  });
  await put(tx.collection("mapProjectionOutbox"), event.outboxId, {
    ...work,
    status: "APPLIED",
    attempts: work.attempts + 1,
    appliedAt: iso(nowMs),
  });
  await invalidateEpoch(tx);
  return { ok: true, effect: next.effect, publicLeadId: next.publicLeadId };
};

const consent = async (tx, caller, event, control, nowMs) => {
  const terms = control.policy.terms;
  if (!terms?.version || !/^[a-f0-9]{64}$/u.test(terms.scopeDigest ?? ""))
    return fail("CONSENT_POLICY_UNAVAILABLE");
  const id = hash("consent", caller.accountId, terms.version);
  const prior = await read(tx.collection("mapContributionConsents"), id);
  const accepted =
    prior?.accepted === true &&
    prior.scopeDigest === terms.scopeDigest &&
    (!coversUploadedV1(terms) ||
      uploadedV1ConsentAccepted(prior, terms, caller.accountId, nowMs));
  if (event.command === "GET")
    return {
      ok: true,
      termsVersion: terms.version,
      scopeDigest: terms.scopeDigest,
      accepted,
    };
  if (
    event.command !== "ACCEPT" ||
    event.termsVersion !== terms.version ||
    event.scopeDigest !== terms.scopeDigest
  )
    return fail("CONSENT_POLICY_MISMATCH");
  if (prior && prior.scopeDigest !== terms.scopeDigest)
    return fail("CONSENT_POLICY_MISMATCH");
  if (!accepted)
    await put(tx.collection("mapContributionConsents"), id, {
      ownerAccountId: caller.accountId,
      termsVersion: terms.version,
      scopeDigest: terms.scopeDigest,
      accepted: true,
      acceptedAt: iso(nowMs),
      ...(coversUploadedV1(terms)
        ? { uploadSharingScope: terms.uploadSharingScope, rightsAttested: true }
        : {}),
    });
  await registerConsentSourceWake(
    tx,
    caller.accountId,
    terms,
    nowMs,
    !!prior && !accepted,
  );
  return {
    ok: true,
    accepted: true,
    termsVersion: terms.version,
    scopeDigest: terms.scopeDigest,
    duplicate: accepted,
  };
};

const owner = async (tx, caller, event, nowMs) => {
  if (
    !idValid(event.contributionId) ||
    !["GET", "WITHDRAW", "DELETE"].includes(event.command)
  )
    return fail("INVALID_REQUEST");
  const c = tx.collection("mapContributions");
  const prior = await read(c, event.contributionId);
  if (!prior || prior.ownerAccountId !== caller.accountId)
    return fail("CONTRIBUTION_UNAVAILABLE");
  if (event.command === "GET")
    return {
      ok: true,
      contributionId: prior.contributionId,
      lifecycle: prior.lifecycle,
      noResurrection: prior.noResurrection,
    };
  const result = applyOwnerContributionCommand(prior, {
    trustedAccountId: caller.accountId,
    commandId: event.actionId,
    action: event.command,
  });
  if (!result.ok) return result;
  await put(c, event.contributionId, result.value);
  const instance = await read(
    tx.collection("boardInstances"),
    prior.boardInstanceId,
  );
  if (!instance) throw new Error("INSTANCE_UNAVAILABLE");
  if (instance.activePublicLeadId) {
    const lead = await currentPublic(tx, instance.activePublicLeadId);
    if (lead?.lifecycleState === "PUBLIC")
      await put(tx.collection("publicMapLeads"), `head:${lead.publicLeadId}`, {
        ...lead,
        lifecycleState: "HIDDEN",
        hideReason: "OWNER_WRITE_PENDING",
      });
  }
  const work = await enqueue(tx, instance, nowMs);
  await invalidateEpoch(tx);
  return {
    ok: true,
    lifecycle: result.value.lifecycle,
    outboxId: work.outboxId,
  };
};

export const reporterEligible = async (db, accountId, control, nowMs) => {
  const account = await read(db.collection("accounts"), accountId);
  if (
    account?.status !== "active" ||
    account.spamOrInvalid === true ||
    account.restricted === true
  )
    return false;
  const raw = await read(
    db.collection("mapAccountPolicies"),
    `account:${accountId}`,
  );
  if (raw) {
    const p = await accountPolicy(db, accountId, nowMs);
    return p?.reporterEligible === true && p.spamOrInvalid === false;
  }
  return (
    control.policy.report.reporterEligibility ===
    "ACTIVE_ACCOUNT_EXCLUDING_RESTRICTED_V1"
  );
};

const report = async (tx, caller, event, control, nowMs, selection) => {
  if (
    !/^[a-f0-9]{32}$/u.test(event.publicLeadId ?? "") ||
    !["GET_STATE", "REPORT", "CANCEL_REPORT"].includes(event.command)
  )
    return fail("INVALID_REQUEST");
  const lead = await currentPublic(tx, event.publicLeadId);
  if (
    !lead ||
    !["PUBLIC", "HIDDEN"].includes(lead.lifecycleState) ||
    lead.retiredAt
  )
    return fail("LEAD_UNAVAILABLE");
  const ledger = tx.collection("mapModerationLedger");
  const id = `report:${hash(caller.digest, event.publicLeadId, control.policy.report.policyVersion)}`;
  const prior = await read(ledger, id);
  if (event.command === "GET_STATE")
    return {
      ok: true,
      active: prior?.active === true,
      hidden: lead.lifecycleState === "HIDDEN",
      policyVersion: control.policy.report.policyVersion,
    };
  if (event.command === "REPORT") {
    if (!(await reporterEligible(tx, caller.accountId, control, nowMs)))
      return fail("INELIGIBLE_REPORTER");
  }
  const active = event.command === "REPORT";
  const duplicate = (prior?.active ?? false) === active;
  const state = {
    kind: "REPORT_STATE",
    publicLeadId: event.publicLeadId,
    reporterAccountId: caller.accountId,
    reporterDigest: caller.digest,
    active,
    policyVersion: control.policy.report.policyVersion,
    updatedAt: iso(nowMs),
  };
  if (!duplicate) await put(ledger, id, state);
  const activeRows = (await snapshotRows(ledger, selection.reports)).filter(
    (r) =>
      r._id !== id &&
      r.kind === "REPORT_STATE" &&
      r.publicLeadId === event.publicLeadId &&
      r.active === true,
  );
  if (active) activeRows.push(state);
  if (activeRows.length >= 1000) throw new Error("REPORT_SET_TRUNCATED");
  let count = 0;
  const distinct = new Set();
  for (const r of activeRows) {
    if (
      distinct.has(r.reporterAccountId) ||
      r.policyVersion !== control.policy.report.policyVersion
    )
      continue;
    if (await reporterEligible(tx, r.reporterAccountId, control, nowMs)) {
      distinct.add(r.reporterAccountId);
      count += 1;
    }
  }
  const targetId = `target:${event.publicLeadId}`;
  const target = await read(ledger, targetId);
  const visibility = visibilityAfterActiveReports(
    target?.hidden ? "HIDDEN" : "VISIBLE",
    count,
    control.policy.report,
  );
  const hidden = visibility === "HIDDEN";
  await put(ledger, targetId, {
    kind: "TARGET",
    publicLeadId: event.publicLeadId,
    hidden,
    distinctEligibleReporters: count,
    policyVersion: control.policy.report.policyVersion,
  });
  if (hidden && !target?.hidden) {
    await put(tx.collection("publicMapLeads"), `head:${event.publicLeadId}`, {
      ...lead,
      lifecycleState: "HIDDEN",
      hideReason: "MODERATION_THRESHOLD",
    });
    await invalidateEpoch(tx);
    await put(
      tx.collection("mapAuditEvents"),
      hash("auto-hide", event.publicLeadId),
      {
        kind: "AUTO_HIDE",
        publicLeadId: event.publicLeadId,
        createdAt: iso(nowMs),
        policyVersion: control.policy.report.policyVersion,
      },
    );
  }
  return {
    ok: true,
    active,
    duplicate,
    hidden,
    policyVersion: control.policy.report.policyVersion,
  };
};

const getAssistance = async (db, caller, control, nowMs) => {
  if (control.features.haPaused !== false || !control.policy.ha?.policyVersion)
    return fail("ASSISTANCE_UNAVAILABLE");
  const requests = rows(
    await db
      .collection("mapAssistanceRequests")
      .where({
        ownerAccountId: caller.accountId,
        state: "PENDING",
      })
      .limit(20)
      .get(),
  );
  const items = [];
  for (const r of requests) {
    if (
      Date.parse(r.expiresAt) <= nowMs ||
      r.policyVersion !== control.policy.ha.policyVersion
    )
      continue;
    const o = await currentObservation(db, r.observationVersionId);
    const comparison = await read(
      db.collection("boardObservations"),
      `observation:${r.comparisonObservationVersionId}`,
    );
    if (
      o?.source.ownerAccountId !== caller.accountId ||
      !verifiedObservation(comparison)
    )
      continue;
    const board = (input) => ({
      ipName: input.boardFacts.ipName,
      themeName: input.boardFacts.themeName,
      tiers: input.boardFacts.tiers.map((t) => ({
        tierCode: t.tierCode,
        remainingTickets: t.remainingTickets,
        isGrandPrize: t.isGrandPrize,
      })),
    });
    items.push({
      requestId: r.requestId,
      currentBoard: board(o.input),
      comparisonBoard: board(comparison.input),
      expiresAt: r.expiresAt,
    });
  }
  return { ok: true, items };
};

const answerAssistance = async (tx, caller, event, control, nowMs) => {
  if (
    control.features.haPaused !== false ||
    !control.policy.ha?.policyVersion ||
    !/^ha:[a-f0-9]{40}$/u.test(event.requestId ?? "") ||
    !["SAME_BOARD", "DIFFERENT_BOARD", "CANNOT_TELL", "SKIP"].includes(
      event.answer,
    )
  )
    return fail("INVALID_REQUEST");
  const c = tx.collection("mapAssistanceRequests");
  const r = await read(c, event.requestId);
  if (!r || r.ownerAccountId !== caller.accountId)
    return fail("REQUEST_UNAVAILABLE");
  if (r.state !== "PENDING")
    return r.answer === event.answer
      ? { ok: true, accepted: event.answer, duplicate: true }
      : fail("REQUEST_UNAVAILABLE");
  if (
    r.policyVersion !== control.policy.ha.policyVersion ||
    Date.parse(r.expiresAt) <= nowMs
  )
    return fail("REQUEST_EXPIRED");
  const o = await currentObservation(tx, r.observationVersionId);
  const i = await read(
    tx.collection("boardInstances"),
    r.comparisonBoardInstanceId,
  );
  if (
    o?.source.ownerAccountId !== caller.accountId ||
    !i ||
    i.instanceVersion !== r.comparisonInstanceVersion ||
    i.lifecycleState !== "ACTIVE" ||
    i.lastObservationVersionId !== r.comparisonObservationVersionId ||
    (await read(
      tx.collection("boardAssociations"),
      `head:${r.observationVersionId}`,
    ))
  )
    return fail("REQUEST_STALE");
  if (event.answer === "SAME_BOARD") {
    const old = verifiedObservation(
      await read(
        tx.collection("boardObservations"),
        `observation:${i.lastObservationVersionId}`,
      ),
    );
    const v = verifiedObservation(o);
    if (
      !old ||
      !v ||
      resolveBoardInstance(v, v.verifiedBoardVersion, [
        { boardInstanceId: i.boardInstanceId, lastVerifiedBoard: old },
      ]).kind !== "UNIQUE_MATCH"
    )
      return fail("HARD_CONFLICT");
    const linked = await link(
      tx,
      o,
      i.boardInstanceId,
      "HUMAN_EVIDENCE",
      control.policy,
      nowMs,
    );
    if (!linked.ok) return linked;
  } else if (event.answer === "DIFFERENT_BOARD") {
    const decision = {
      kind: "HEAD",
      observationVersionId: o.observationVersionId,
      boardInstanceId: null,
      negativeBoardInstanceId: i.boardInstanceId,
      decisionVersion: 1,
      action: "UNLINK",
      supersedesDecisionVersion: null,
      resolverVersion: control.policy.resolverVersion,
      createdAt: iso(nowMs),
    };
    await put(
      tx.collection("boardAssociations"),
      `head:${o.observationVersionId}`,
      decision,
    );
    await put(
      tx.collection("boardAssociations"),
      hash(o.observationVersionId, "1"),
      { ...decision, kind: "DECISION" },
    );
  }
  if (event.answer !== "SKIP")
    await put(tx.collection("mapAssistanceEvidence"), hash(event.requestId), {
      requestId: event.requestId,
      observationVersionId: o.observationVersionId,
      comparisonBoardInstanceId: i.boardInstanceId,
      answer: event.answer,
      resolverContextVersion: r.comparisonInstanceVersion,
      createdAt: iso(nowMs),
    });
  await put(c, event.requestId, {
    ...r,
    state: "ANSWERED",
    answer: event.answer,
    answeredAt: iso(nowMs),
  });
  return { ok: true, accepted: event.answer };
};

export const createMain =
  ({
    cloud,
    env,
    operation,
    collectionAllowlist,
    now = Date.now,
    newId = () => randomBytes(16).toString("hex"),
  }) =>
  async (raw = {}) => {
    const event = cleanEvent(raw);
    const publicError = (response) =>
      ["query", "detail"].includes(operation) &&
      !response.ok &&
      !("requestId" in response)
        ? {
            ...response,
            requestId:
              typeof event?.requestId === "string"
                ? event.requestId.slice(0, 128)
                : "",
            generation:
              Number.isSafeInteger(event?.generation) && event.generation >= 0
                ? event.generation
                : 0,
            retryable: response.code === "SERVICE_UNAVAILABLE",
            retryAfterSeconds:
              response.code === "SERVICE_UNAVAILABLE" ? 30 : null,
          }
        : response;
    let stage = "ENTRY";
    try {
      if (
        env.ICHI_V2_BACKEND_MODE !== "production" ||
        env.ICHI_V2_FUNCTION_ENABLED !== "true"
      )
        return publicError(fail("SERVICE_UNAVAILABLE"));
      if (!KEYS[operation]) return publicError(fail("SERVICE_UNAVAILABLE"));
      const db = guardedDatabase(cloud.database(), collectionAllowlist);
      const nowMs = now();
      stage = "TRUSTED_ACCOUNT";
      const caller = await trustedAccount(cloud, db, env);
      if (!caller) return publicError(fail("UNAUTHORIZED"));
      stage = "READ_CONTROL";
      const control = await readControl(
        db,
        ["query", "detail"].includes(operation),
      );
      if (
        !control ||
        !policyValid(control.policy) ||
        control.features[FEATURE[operation]] !== true
      )
        return publicError(fail("SERVICE_UNAVAILABLE"));
      stage = "RATE_TRANSACTION";
      if (!(await consumeRate(db, caller, operation, nowMs)))
        return publicError(fail("RATE_LIMITED"));
      if (
        !event ||
        Object.keys(event).some((k) => !KEYS[operation].includes(k))
      )
        return publicError(fail("INVALID_REQUEST"));
      const context = { db, caller, control, env, nowMs, newId, cloud };
      if (["query", "detail"].includes(operation))
        return publicError(await publicRead(context, operation, event));
      if (operation === "getAssistance") {
        const result = await getAssistance(db, caller, control, nowMs);
        const finalControl = await readControl(db);
        const finalCaller = await trustedAccount(cloud, db, env);
        if (
          !finalControl ||
          finalControl.epoch !== control.epoch ||
          finalControl.features.haEnabled !== true ||
          finalControl.features.haPaused !== false ||
          JSON.stringify(finalControl.policy) !==
            JSON.stringify(control.policy) ||
          finalCaller?.accountId !== caller.accountId
        )
          return fail("ASSISTANCE_UNAVAILABLE");
        return result;
      }
      const readOnly =
        ((operation === "consent" || operation === "owner") &&
          event.command === "GET") ||
        (operation === "report" && event.command === "GET_STATE");
      if (!readOnly && !actionValid(event.actionId))
        return fail("INVALID_REQUEST");
      stage = "PREPARE_SELECTION";
      const selection = await prepareSelection(db, operation, event);
      stage = "COMMAND_TRANSACTION";
      return await db.runTransaction(async (tx) => {
        stage = "COMMAND_TRUSTED_ACCOUNT";
        const freshCaller = await trustedAccount(cloud, tx, env);
        stage = "COMMAND_READ_CONTROL";
        const fresh = await readControl(tx);
        if (!freshCaller || freshCaller.accountId !== caller.accountId)
          return fail("UNAUTHORIZED");
        if (
          !fresh ||
          fresh.epoch !== control.epoch ||
          fresh.mutationRevision !== control.mutationRevision ||
          !fresh.features[FEATURE[operation]] ||
          JSON.stringify(fresh.policy) !== JSON.stringify(control.policy)
        )
          return fail("SERVICE_UNAVAILABLE");
        if (
          ["resolve", "project"].includes(operation) &&
          !(await hasMaintenanceAuthority(tx, freshCaller, nowMs))
        )
          return fail("UNAUTHORIZED");
        const receiptId = hash(caller.digest, operation, event.actionId ?? "");
        const digest = hash(JSON.stringify(event));
        if (!readOnly) {
          const receipt = await read(
            tx.collection("mapAuditEvents"),
            receiptId,
          );
          if (receipt)
            return receipt.requestDigest === digest
              ? receipt.result
              : fail("IDEMPOTENCY_CONFLICT");
        }
        let result;
        if (operation === "resolve")
          result = await resolve(tx, event, fresh, nowMs, selection);
        else if (operation === "project")
          result = await project(tx, event, fresh, nowMs, newId, selection);
        else if (operation === "consent") {
          stage = "COMMAND_CONSENT_READ_WRITE";
          result = await consent(tx, caller, event, fresh, nowMs);
        } else if (operation === "owner")
          result = await owner(tx, caller, event, nowMs);
        else if (operation === "report")
          result = await report(tx, caller, event, fresh, nowMs, selection);
        else if (operation === "answerAssistance")
          result = await answerAssistance(tx, caller, event, fresh, nowMs);
        else return fail("INVALID_REQUEST");
        if (result.ok && !readOnly) {
          const epoch = await read(
            tx.collection("mapControlState"),
            "global:read-epoch",
          );
          await put(tx.collection("mapControlState"), "global:read-epoch", {
            ...epoch,
            mutationRevision: fresh.mutationRevision + 1,
          });
          await audit(tx, caller, operation, event.actionId, result, nowMs);
          const receipt = await read(
            tx.collection("mapAuditEvents"),
            receiptId,
          );
          await put(tx.collection("mapAuditEvents"), receiptId, {
            ...receipt,
            requestDigest: digest,
          });
        }
        stage = "COMMAND_COMPLETE_AWAIT_COMMIT";
        return result;
      });
    } catch (error) {
      if (operation === "consent") {
        const code = String(error?.code ?? error?.errCode ?? "UNKNOWN");
        console.error(
          JSON.stringify({
            event: "MAP_CONSENT_SERVICE_FAILURE",
            stage,
            code: /^[A-Za-z0-9_.:-]{1,100}$/u.test(code) ? code : "UNKNOWN",
          }),
        );
      }
      return publicError(fail("SERVICE_UNAVAILABLE"));
    }
  };

export { prepareSelection, resolve, project, enqueue, link };
