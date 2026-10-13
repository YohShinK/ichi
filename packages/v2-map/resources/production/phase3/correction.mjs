import { admissionPreviewDatabase } from "../phase2/admission.mjs";
import { stable } from "../phase2/source.mjs";
import { hash, read, put, readControl } from "../shared/security.mjs";
import { link, project, prepareSelection } from "../shared/runtime.mjs";
import {
  buildNetworkObservation,
  networkContentDigest,
  networkLocationDigest,
} from "./network.mjs";
import { networkDecisionId } from "./runtime.mjs";

export const correctionPolicy = ({ policy, record, decision, previous }) => {
  const next = structuredClone(policy);
  const registries = [
    "venueApproximation",
    "collection50VenueApproximation",
    "workflowVenueApproximation",
  ];
  const matches = registries.filter((key) =>
    next.network[key]?.approvedSources.some(
      (s) => s.sourceId === record.sourceId,
    ),
  );
  if (
    matches.length > 1 ||
    (record.location.accuracyMeters === null && matches.length !== 1)
  )
    return { ok: false, code: "CORRECTION_BOUND_MISSING" };
  for (const key of matches) {
    const entry = next.network[key].approvedSources.find(
      (s) => s.sourceId === record.sourceId,
    );
    if (
      entry.sourceVersion !== previous.sourceVersion ||
      entry.locationDigest !== networkLocationDigest(record.location)
    )
      return { ok: false, code: "CORRECTION_BOUND_MISSING" };
    entry.sourceVersion = record.sourceVersion;
  }
  for (const key of ["reviewDelegation", "workflowReviewDelegation"]) {
    const entry = next.network[key]?.approvedSources.find(
      (s) => s.sourceId === record.sourceId,
    );
    if (!entry) continue;
    if (
      entry.sourceVersion !== previous.sourceVersion ||
      entry.contentDigest !== previous.contentDigest
    )
      return { ok: false, code: "CORRECTION_DELEGATION_CHANGED" };
    entry.sourceVersion = record.sourceVersion;
    entry.contentDigest = networkContentDigest(record);
  }
  if (
    decision.approval.reviewedBy === "AGENT_USER_DELEGATION" &&
    !["reviewDelegation", "workflowReviewDelegation"].some(
      (key) =>
        next.network[key]?.authorizationRef ===
          decision.approval.authorizationRef &&
        next.network[key].approvedSources.some(
          (s) =>
            s.sourceId === record.sourceId &&
            s.sourceVersion === record.sourceVersion &&
            s.contentDigest === networkContentDigest(record),
        ),
    )
  )
    return { ok: false, code: "CORRECTION_DELEGATION_CHANGED" };
  return { ok: true, policy: next };
};

// Trusted operator library only. No cloud-function command or client endpoint.
// A correction keeps its admitted physical board and original observation clock.
export const correctFounderNetworkSource = async ({
  db,
  record,
  decision,
  authorityId,
  expected,
  evidenceRef,
  nowMs,
}) => {
  const fail = (code) => ({ ok: false, code });
  const before = await readControl(db);
  const networkControl = await read(
    db.collection("mapControlState"),
    "global:network",
  );
  if (
    !before ||
    !before.features.resolverEnabled ||
    !before.features.projectorEnabled ||
    authorityId !== networkControl?.curatorAuthorityId ||
    authorityId !== decision?.approval?.curatorAuthorityId ||
    !evidenceRef
  )
    return fail("CORRECTION_UNAUTHORIZED");
  const sourceKey = `network-source:${record.sourceId}`;
  const previous = await read(db.collection("boardObservations"), sourceKey);
  const receiptId = hash(
    "network-correction",
    record.sourceId,
    record.sourceVersion,
  );
  const priorReceipt = await read(db.collection("mapAuditEvents"), receiptId);
  if (
    priorReceipt &&
    priorReceipt.contentDigest === networkContentDigest(record) &&
    previous?.sourceVersion === record.sourceVersion
  )
    return { ok: true, duplicate: true, ...priorReceipt.result };
  if (
    !previous ||
    previous.state !== "APPROVED" ||
    previous.noResurrection ||
    previous.sourceVersion !== expected?.sourceVersion ||
    previous.contentDigest !== expected.contentDigest ||
    record.sourceVersion === previous.sourceVersion
  )
    return fail("CORRECTION_SOURCE_CHANGED");
  const oldObservation = await read(
    db.collection("boardObservations"),
    `observation:${previous.observationVersionId}`,
  );
  const contribution =
    oldObservation &&
    (await read(
      db.collection("mapContributions"),
      hash("contribution", oldObservation.lineageId),
    ));
  const instance =
    contribution &&
    (await read(db.collection("boardInstances"), contribution.boardInstanceId));
  const oldLead =
    instance?.activePublicLeadId &&
    (await read(
      db.collection("publicMapLeads"),
      `head:${instance.activePublicLeadId}`,
    ));
  const moderation =
    oldLead &&
    (await read(
      db.collection("mapModerationLedger"),
      `target:${oldLead.publicLeadId}`,
    ));
  if (
    contribution?.lifecycle !== "ACTIVE" ||
    contribution.noResurrection ||
    instance?.lifecycleState !== "ACTIVE" ||
    instance.boardInstanceId !== expected.boardInstanceId ||
    oldLead?.publicLeadId !== expected.publicLeadId ||
    oldLead.lifecycleState !== "PUBLIC" ||
    oldLead.retiredAt ||
    moderation?.hidden ||
    oldObservation.source.sourceId !== record.sourceId
  )
    return fail("CORRECTION_TARGET_UNAVAILABLE");
  const oldRecord = oldObservation.source.record;
  // These fields describe the same evidence and are never renewed by a correction.
  for (const key of [
    "sourceUrl",
    "sourcePublishedAt",
    "fetchedAt",
    "observedAtBasis",
    "observationEvidence",
    "location",
    "takedownOwnerId",
  ])
    if (stable(oldRecord[key]) !== stable(record[key]))
      return fail("CORRECTION_EVIDENCE_CHANGED");
  const corrected = correctionPolicy({
    policy: before.policy,
    record,
    decision,
    previous,
  });
  if (!corrected.ok) return corrected;
  const policy = corrected.policy;
  const locationPolicy = (
    await read(db.collection("mapSourceBridgeControl"), "global:bridge")
  )?.locationPolicy;
  const built = buildNetworkObservation({
    record,
    approval: decision.approval,
    rights: decision.rights,
    noteSafety: decision.noteSafety,
    policy,
    locationPolicy,
    nowMs,
  });
  if (!built.ok) return built;
  const o = built.observation;
  if (
    o.lineageId !== oldObservation.lineageId ||
    o.input.observedAt !== previous.observedAt ||
    o.publicProjection.publicUntil !== oldLead.publicUntil
  )
    return fail("CORRECTION_CLOCK_CHANGED");
  const revisionKey = `network-revision:${hash(record.sourceId, record.sourceVersion)}`;
  if (await read(db.collection("boardObservations"), revisionKey))
    return fail("IMMUTABLE_SOURCE_VERSION");
  const preview = admissionPreviewDatabase(db),
    staged = preview.db;
  // Capture every externally checked row in the final compare-and-set read set.
  for (const [name, id] of [
    ["mapControlState", "global:network"],
    ["mapSourceBridgeControl", "global:bridge"],
    ["boardObservations", sourceKey],
    ["boardObservations", `observation:${previous.observationVersionId}`],
    ["mapContributions", hash("contribution", o.lineageId)],
    ["boardInstances", instance.boardInstanceId],
    ["publicMapLeads", `head:${oldLead.publicLeadId}`],
    ["mapModerationLedger", `target:${oldLead.publicLeadId}`],
    ["mapAuditEvents", receiptId],
  ])
    await preview.get(name, id);
  if (
    stable(await readControl(staged)) !== stable(before) ||
    stable(await preview.get("mapControlState", "global:network")) !==
      stable(networkControl) ||
    stable(await preview.get("boardObservations", sourceKey)) !==
      stable(previous) ||
    stable(
      await preview.get(
        "boardObservations",
        `observation:${previous.observationVersionId}`,
      ),
    ) !== stable(oldObservation) ||
    stable(
      await preview.get("mapContributions", hash("contribution", o.lineageId)),
    ) !== stable(contribution) ||
    stable(await preview.get("boardInstances", instance.boardInstanceId)) !==
      stable(instance) ||
    stable(
      await preview.get("publicMapLeads", `head:${oldLead.publicLeadId}`),
    ) !== stable(oldLead) ||
    stable(
      await preview.get(
        "mapModerationLedger",
        `target:${oldLead.publicLeadId}`,
      ),
    ) !== stable(moderation)
  )
    return fail("CORRECTION_SNAPSHOT_CHANGED");
  await put(staged.collection("mapControlState"), "global:policy", policy);
  const observations = staged.collection("boardObservations");
  const source = {
    ...previous,
    sourceVersion: record.sourceVersion,
    observationVersionId: o.observationVersionId,
    contentDigest: o.source.contentDigest,
    reviewVersion: o.source.reviewVersion,
    rightsDecisionVersion: o.source.rightsDecisionVersion,
    reviewedAt: o.source.reviewedAt,
  };
  await put(observations, revisionKey, {
    ...source,
    kind: "NETWORK_SOURCE_REVISION",
  });
  await put(observations, sourceKey, source);
  await put(observations, `observation:${o.observationVersionId}`, o);
  await put(observations, `lineage:${o.lineageId}`, {
    kind: "LINEAGE_HEAD",
    lineageId: o.lineageId,
    sourceVersion: o.sourceVersion,
    currentObservationVersionId: o.observationVersionId,
    lifecycleState: "CURRENT",
    ownerAccountId: null,
  });
  const decisionId = networkDecisionId(record.sourceId, record.sourceVersion);
  if (await preview.get("boardObservations", decisionId))
    return fail("CORRECTION_DECISION_EXISTS");
  await put(observations, decisionId, {
    kind: "NETWORK_AUTHORIZED_DECISION",
    lineageId: o.lineageId,
    sourceVersion: record.sourceVersion,
    approval: decision.approval,
    rights: decision.rights,
    noteSafety: decision.noteSafety,
  });
  const correctedControl = { ...before, policy };
  const linked = await link(
    staged,
    o,
    instance.boardInstanceId,
    "UNIQUE_MATCH",
    policy,
    nowMs,
  );
  if (!linked.ok) return linked;
  const event = { outboxId: linked.outboxId };
  const projected = await project(
    staged,
    event,
    correctedControl,
    nowMs,
    () => {
      throw Error("CORRECTION_MUST_PRESERVE_PUBLIC_ID");
    },
    await prepareSelection(staged, "project", event),
  );
  if (
    !projected.ok ||
    projected.publicLeadId !== oldLead.publicLeadId ||
    projected.effect !== "ADVANCED"
  )
    return fail("CORRECTION_PROJECTION_DENIED");
  const freshLead = await preview.get(
    "publicMapLeads",
    `head:${oldLead.publicLeadId}`,
  );
  if (
    freshLead.lifecycleState !== "PUBLIC" ||
    freshLead.servedVersion !== oldLead.servedVersion + 1 ||
    freshLead.observedAt !== oldLead.observedAt ||
    freshLead.publicUntil !== oldLead.publicUntil
  )
    return fail("CORRECTION_PUBLIC_INVARIANT");
  const result = {
    observationVersionId: o.observationVersionId,
    boardInstanceId: instance.boardInstanceId,
    publicLeadId: oldLead.publicLeadId,
    servedVersion: freshLead.servedVersion,
  };
  await put(staged.collection("mapAuditEvents"), receiptId, {
    kind: "NETWORK_FOUNDER_CORRECTION_RECEIPT",
    sourceId: record.sourceId,
    sourceVersion: record.sourceVersion,
    previousSourceVersion: previous.sourceVersion,
    previousObservationVersionId: previous.observationVersionId,
    contentDigest: networkContentDigest(record),
    authorityDigest: hash(authorityId),
    evidenceRef,
    preservedObservedAt: oldLead.observedAt,
    preservedPublicUntil: oldLead.publicUntil,
    associationBasis: "SAME_ADMITTED_SOURCE_LINEAGE_FOUNDER_FACT_CORRECTION",
    result,
    createdAt: new Date(nowMs).toISOString(),
  });
  const epoch = await preview.get("mapControlState", "global:read-epoch");
  await put(staged.collection("mapControlState"), "global:read-epoch", {
    ...epoch,
    mutationRevision: before.mutationRevision + 1,
  });
  if (preview.originals.size + preview.writes.size > 90)
    return fail("CORRECTION_TRANSACTION_BUDGET");
  return db.runTransaction(async (tx) => {
    for (const { name, id, data } of preview.originals.values())
      if (stable(await read(tx.collection(name), id)) !== stable(data))
        return fail("CORRECTION_SNAPSHOT_CHANGED");
    for (const { name, id, data } of preview.writes.values())
      await put(tx.collection(name), id, data);
    return { ok: true, duplicate: false, ...result };
  });
};
