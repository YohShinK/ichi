import { admissionPreviewDatabase } from "../phase2/admission.mjs";
import { stable } from "../phase2/source.mjs";
import { read, put, readControl, hash } from "../shared/security.mjs";
import { prepareSelection, resolve, project } from "../shared/runtime.mjs";
import {
  buildNetworkObservation,
  networkContentDigest,
  networkRecordValid,
} from "./network.mjs";

// Internal backend boundary only; no client cloud function or collect/review/publish
// workflow is introduced here. The authenticated approval store is a trusted port.
export const admitOfficialNetworkSource = async ({
  db,
  record,
  decisions,
  locationPolicy,
  nowMs,
  newId,
}) => {
  if (!networkRecordValid(record))
    return { ok: false, code: "NETWORK_ADMISSION_DENIED" };
  const before = await readControl(db);
  if (
    !before?.features.resolverEnabled ||
    !before.features.projectorEnabled ||
    typeof decisions?.read !== "function"
  )
    return { ok: false, code: "NETWORK_SERVICE_DISABLED" };
  const decision = await decisions.read(record.sourceId, record.sourceVersion);
  const built = buildNetworkObservation({
    record,
    approval: decision?.approval,
    rights: decision?.rights,
    noteSafety: decision?.noteSafety,
    policy: before.policy,
    locationPolicy,
    nowMs,
  });
  if (!built.ok) return built;
  const o = built.observation;
  const preview = admissionPreviewDatabase(db),
    staged = preview.db;
  const c = staged.collection("boardObservations"),
    sourceKey = `network-source:${o.source.sourceId}`;
  const previous = await read(c, sourceKey);
  if (previous?.state === "TAKEN_DOWN" || previous?.noResurrection)
    return { ok: false, code: "NETWORK_TAKEN_DOWN" };
  const revisionKey = `network-revision:${hash(record.sourceId, record.sourceVersion)}`;
  const revision = await read(c, revisionKey);
  if (revision && revision.contentDigest !== networkContentDigest(record))
    return { ok: false, code: "IMMUTABLE_SOURCE_VERSION" };
  if (
    previous &&
    (previous.sourceUrl !== record.sourceUrl ||
      previous.sourcePublishedAt !== record.sourcePublishedAt ||
      previous.observedAt !== o.input.observedAt)
  )
    return { ok: false, code: "IMMUTABLE_OBSERVATION_TIME" };
  if (
    previous?.reviewedAt &&
    Date.parse(o.source.reviewedAt) < Date.parse(previous.reviewedAt)
  )
    return { ok: false, code: "STALE_FOUNDER_REVIEW" };
  if (previous?.observationVersionId === o.observationVersionId)
    return {
      ok: true,
      duplicate: true,
      observationVersionId: o.observationVersionId,
    };
  const lineage = await read(c, `lineage:${o.lineageId}`);
  if (lineage && ["DELETING", "DELETED"].includes(lineage.lifecycleState))
    return { ok: false, code: "NETWORK_TAKEN_DOWN" };
  const source = {
    kind: "NETWORK_SOURCE_RECORD",
    lineageId: o.lineageId,
    state: "APPROVED",
    sourceId: record.sourceId,
    sourceVersion: record.sourceVersion,
    sourceUrl: record.sourceUrl,
    sourcePublishedAt: record.sourcePublishedAt,
    observedAt: o.input.observedAt,
    observationVersionId: o.observationVersionId,
    contentDigest: o.source.contentDigest,
    reviewVersion: o.source.reviewVersion,
    rightsDecisionVersion: o.source.rightsDecisionVersion,
    reviewedAt: o.source.reviewedAt,
    takedownOwnerId: record.takedownOwnerId,
    noResurrection: false,
  };
  await put(c, revisionKey, { ...source, kind: "NETWORK_SOURCE_REVISION" });
  await put(c, sourceKey, source);
  await put(c, `observation:${o.observationVersionId}`, o);
  await put(c, `lineage:${o.lineageId}`, {
    kind: "LINEAGE_HEAD",
    lineageId: o.lineageId,
    sourceVersion: o.sourceVersion,
    currentObservationVersionId: o.observationVersionId,
    lifecycleState: "CURRENT",
    ownerAccountId: null,
  });
  const event = { observationVersionId: o.observationVersionId };
  const resolved = await resolve(
    staged,
    event,
    before,
    nowMs,
    await prepareSelection(staged, "resolve", event),
  );
  if (!resolved.ok || resolved.resolution === "AMBIGUOUS")
    return { ok: false, code: resolved.resolution ?? resolved.code };
  const projectEvent = { outboxId: resolved.outboxId };
  const projected = await project(
    staged,
    projectEvent,
    before,
    nowMs,
    newId,
    await prepareSelection(staged, "project", projectEvent),
  );
  if (!projected.ok || !["CREATED", "ADVANCED"].includes(projected.effect))
    return { ok: false, code: projected.code ?? "NETWORK_PROJECTION_DENIED" };
  const publicRow = await preview.get(
    "publicMapLeads",
    `head:${projected.publicLeadId}`,
  );
  if (publicRow?.lifecycleState !== "PUBLIC")
    return { ok: false, code: "NETWORK_PROJECTION_DENIED" };
  if (
    stable(await decisions.read(record.sourceId, record.sourceVersion)) !==
    stable(decision)
  )
    return { ok: false, code: "STALE_FOUNDER_REVIEW" };
  if (preview.originals.size + preview.writes.size > 90)
    return { ok: false, code: "NETWORK_TRANSACTION_BUDGET_EXCEEDED" };
  return db.runTransaction(async (tx) => {
    // Production integration must implement this port with the same transactional
    // approval store. No self-attested request field substitutes for this check.
    if (
      stable(
        await decisions.read(record.sourceId, record.sourceVersion, tx),
      ) !== stable(decision)
    )
      return { ok: false, code: "STALE_FOUNDER_REVIEW" };
    if (stable(await readControl(tx)) !== stable(before))
      return { ok: false, code: "STALE_NETWORK_ADMISSION" };
    for (const { name, id, data } of preview.originals.values())
      if (stable(await read(tx.collection(name), id)) !== stable(data))
        return { ok: false, code: "STALE_NETWORK_ADMISSION" };
    for (const { name, id, data } of preview.writes.values())
      await put(tx.collection(name), id, data);
    await put(
      tx.collection("mapAuditEvents"),
      hash("network-admission", o.observationVersionId),
      {
        kind: "NETWORK_ADMISSION_RECEIPT",
        sourceId: record.sourceId,
        sourceVersion: record.sourceVersion,
        observationVersionId: o.observationVersionId,
        boardInstanceId: resolved.boardInstanceId,
        reviewVersion: o.source.reviewVersion,
        rightsDecisionVersion: o.source.rightsDecisionVersion,
        actorDigest: hash(o.source.curatorAuthorityId),
        policyVersion: before.policy.network.policyVersion,
        createdAt: new Date(nowMs).toISOString(),
      },
    );
    const epoch = await read(
      tx.collection("mapControlState"),
      "global:read-epoch",
    );
    await put(tx.collection("mapControlState"), "global:read-epoch", {
      ...epoch,
      mutationRevision: before.mutationRevision + 1,
    });
    return {
      ok: true,
      duplicate: false,
      observationVersionId: o.observationVersionId,
      boardInstanceId: resolved.boardInstanceId,
      publicLeadId: projected.publicLeadId,
      resolution: resolved.resolution,
    };
  });
};

// Reconcile expiry/takedown on each affected instance through the same projector.
// Reads always enforce the deadline even if no maintenance event has run yet.
export const reconcileNetworkLifecycle = async ({
  db,
  boardInstanceId,
  nowMs,
  newId,
  takedownSourceId = null,
}) => {
  const before = await readControl(db);
  const contributions = (
    await db
      .collection("mapContributions")
      .where({ boardInstanceId, lifecycle: "ACTIVE" })
      .limit(101)
      .get()
  ).data;
  return db.runTransaction(async (tx) => {
    const control = await readControl(tx);
    if (
      !control?.features.projectorEnabled ||
      stable(control) !== stable(before)
    )
      return { ok: false, code: "NETWORK_SERVICE_DISABLED" };
    const i = await read(tx.collection("boardInstances"), boardInstanceId);
    if (!i) return { ok: false, code: "INSTANCE_UNAVAILABLE" };
    if (takedownSourceId) {
      const c = tx.collection("boardObservations"),
        key = `network-source:${takedownSourceId}`;
      const source = await read(c, key);
      if (!source) return { ok: false, code: "NETWORK_SOURCE_UNAVAILABLE" };
      const o = await read(c, `observation:${source.observationVersionId}`);
      if (!o) return { ok: false, code: "NETWORK_SOURCE_UNAVAILABLE" };
      const contribution = await read(
        tx.collection("mapContributions"),
        hash("contribution", o.lineageId),
      );
      if (contribution?.boardInstanceId !== boardInstanceId)
        return { ok: false, code: "NETWORK_INSTANCE_MISMATCH" };
      if (source.state === "TAKEN_DOWN")
        return { ok: true, duplicate: true, effect: "UNCHANGED" };
      await put(c, key, {
        ...source,
        state: "TAKEN_DOWN",
        noResurrection: true,
        takenDownAt: new Date(nowMs).toISOString(),
      });
      await put(
        tx.collection("mapContributions"),
        contribution.contributionId,
        { ...contribution, lifecycle: "WITHDRAWN", noResurrection: true },
      );
      await put(
        tx.collection("mapAuditEvents"),
        hash("network-takedown", takedownSourceId),
        {
          kind: "NETWORK_TAKEDOWN_RECEIPT",
          sourceId: takedownSourceId,
          observationVersionId: o.observationVersionId,
          boardInstanceId,
          takedownOwnerId: source.takedownOwnerId,
          createdAt: new Date(nowMs).toISOString(),
          policyVersion: control.policy.network?.policyVersion ?? null,
        },
      );
    }
    const sequence = i.lastEventSequence + 1,
      outboxId = hash("outbox", boardInstanceId, String(sequence));
    await put(tx.collection("boardInstances"), boardInstanceId, {
      ...i,
      lastEventSequence: sequence,
    });
    await put(tx.collection("mapProjectionOutbox"), outboxId, {
      boardInstanceId,
      eventSequence: sequence,
      status: "PENDING",
      attempts: 0,
    });
    const result = await project(tx, { outboxId }, control, nowMs, newId, {
      contributions,
    });
    if (!result.ok) throw new Error(result.code);
    const epoch = await read(
      tx.collection("mapControlState"),
      "global:read-epoch",
    );
    await put(tx.collection("mapControlState"), "global:read-epoch", {
      ...epoch,
      mutationRevision: control.mutationRevision + 1,
    });
    return result;
  });
};

// Bounded internal maintenance port. A future authorized production timer may
// invoke it; query/detail remain read-only and exclude deadlines immediately.
export const reconcileDueNetworkSources = async ({
  db,
  nowMs,
  newId,
  limit = 20,
}) => {
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 50 ||
    !Number.isFinite(nowMs)
  )
    return { ok: false, code: "INVALID_REQUEST" };
  const due = (
    await db
      .collection("publicMapLeads")
      .where({
        kind: "HEAD",
        lifecycleState: "PUBLIC",
        sourceIcon: "OFFICIAL_NETWORK",
        publicUntil: db.command.lt(new Date(nowMs + 1).toISOString()),
      })
      .limit(limit + 1)
      .get()
  ).data;
  const results = [];
  for (const row of due.slice(0, limit)) {
    if (
      typeof row.publicUntil !== "string" ||
      Date.parse(row.publicUntil) > nowMs
    )
      continue;
    const instances = (
      await db
        .collection("boardInstances")
        .where({ activePublicLeadId: row.publicLeadId })
        .limit(2)
        .get()
    ).data;
    if (instances.length !== 1) {
      results.push({ ok: false, code: "INSTANCE_UNAVAILABLE" });
      continue;
    }
    results.push(
      await reconcileNetworkLifecycle({
        db,
        boardInstanceId: instances[0].boardInstanceId,
        nowMs,
        newId,
      }),
    );
  }
  return {
    ok: results.every((r) => r.ok),
    processed: results.length,
    hasMore: due.length > limit,
    results,
  };
};
