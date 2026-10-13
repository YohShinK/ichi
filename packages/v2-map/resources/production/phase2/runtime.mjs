import { randomBytes } from "node:crypto";
import {
  prepareSourceMetadata,
  cleanupAccountMetadata,
  noteCacheId,
} from "./metadata.mjs";
import { admitSourceAtomically } from "./admission.mjs";
import producer from "../../../../../services/cloudbase/shared/source-bridge-producer.js";
import { hash, read, put, rows, trustedAccount } from "../shared/security.mjs";
import {
  bridgeDatabase,
  requestValid,
  signedRequest,
  requestFailureCode,
} from "./security.mjs";
import { verifiedObservation } from "../shared/domain.mjs";
import { isForwardBoardTransition } from "../../../src/board-instance.js";
import {
  loadSource,
  normalizeSource,
  authorizeSource,
  sourceFingerprint,
  stateId,
  lineageId,
  stable,
} from "./source.mjs";
import {
  prepareSelection,
  resolve,
  project,
  policyValid,
  enqueue,
  link,
} from "./pipeline.mjs";

const fail = (code) => ({ ok: false, code });
const iso = (n) => new Date(n).toISOString();
const get = (db, name, id) => read(db.collection(name), id);
const set = (db, name, id, data) => put(db.collection(name), id, data);
const control = async (db) => {
  const bridge = await get(db, "mapSourceBridgeControl", "global:bridge");
  const epoch = await get(db, "mapControlState", "global:read-epoch");
  const policy = await get(db, "mapControlState", "global:policy");
  const features = await get(db, "mapControlState", "global:features");
  const stop = await get(db, "mapControlState", "global:read-stop");
  if (
    bridge?.contract !== "source-bridge-phase2-v1" ||
    !Number.isSafeInteger(epoch?.epoch) ||
    !Number.isSafeInteger(epoch?.mutationRevision) ||
    !policyValid(policy)
  )
    return null;
  return {
    bridge,
    epoch: epoch.epoch,
    mutationRevision: epoch.mutationRevision,
    policy,
    features,
    stopped: stop?.stopped !== false,
  };
};
const bump = async (tx) => {
  const e = await get(tx, "mapControlState", "global:read-epoch");
  await set(tx, "mapControlState", "global:read-epoch", {
    ...e,
    mutationRevision: e.mutationRevision + 1,
  });
};
const retireSupport = async (tx, work, terminal, nowMs) => {
  const headId = `lineage:${work.lineageId}`;
  const head = await get(tx, "boardObservations", headId);
  if (head)
    await set(tx, "boardObservations", headId, {
      ...head,
      lifecycleState: terminal ? "DELETED" : "SUPERSEDED",
    });
  const id = hash("contribution", work.lineageId);
  const c = await get(tx, "mapContributions", id);
  if (!c?.boardInstanceId) return null;
  await set(tx, "mapContributions", id, {
    ...c,
    lifecycle: terminal ? "DELETED" : "INVALIDATED",
    noResurrection: terminal || c.noResurrection,
    publicHideIntent: true,
  });
  const instance = await get(tx, "boardInstances", c.boardInstanceId);
  if (!instance) throw new Error("BRIDGE_INSTANCE_MISSING");
  if (instance.activePublicLeadId) {
    const lead = await get(
      tx,
      "publicMapLeads",
      `head:${instance.activePublicLeadId}`,
    );
    if (lead?.lifecycleState === "PUBLIC")
      await set(tx, "publicMapLeads", `head:${instance.activePublicLeadId}`, {
        ...lead,
        lifecycleState: "HIDDEN",
        hideReason: "SOURCE_INELIGIBLE",
      });
  }
  return (await enqueue(tx, instance, nowMs)).outboxId;
};

const createStagedWorker =
  ({
    cloud,
    env = process.env,
    now = Date.now,
    newId = () => randomBytes(16).toString("hex"),
    admissionStaging = false,
  }) =>
  async (event, invocation = {}) => {
    if (
      env.ICHI_V2_FUNCTION_ENABLED !== "true" ||
      env.ICHI_V2_BACKEND_MODE !== "production"
    )
      return fail("SERVICE_DISABLED");
    const nowMs = now();
    const replay = event?.operation === "REPLAY";
    if (
      !requestValid(
        env.ICHI_V2_SOURCE_BRIDGE_HMAC_KEY,
        event,
        replay ? "REPLAY" : "PROCESS",
        nowMs,
      )
    )
      return {
        ...fail("UNAUTHORIZED"),
        failureCode: requestFailureCode(event, nowMs),
      };
    const db = bridgeDatabase(cloud.database());
    let before = await control(db);
    if (!before || before.bridge.processorEnabled !== true)
      return fail("BRIDGE_PAUSED");
    const work = await get(db, "mapSourceOutbox", event.eventId);
    if (!work) return fail("EVENT_UNAVAILABLE");
    if (replay)
      return db.runTransaction(async (tx) => {
        const c = await control(tx);
        const fresh = await get(tx, "mapSourceOutbox", event.eventId);
        if (
          !c ||
          c.bridge.processorEnabled !== true ||
          fresh?.kind !== "SOURCE_EVENT"
        )
          return fail("REPLAY_UNAVAILABLE");
        if (fresh.replayedAs)
          return { ok: true, eventId: fresh.replayedAs, duplicate: true };
        const next = await producer.enqueueSourceChange({
          tx,
          env,
          recordId: fresh.recordId,
          ownerAccountId: fresh.ownerAccountId,
          reason: "REPLAY",
          nowMs,
          force: true,
        });
        await set(tx, "mapSourceOutbox", event.eventId, {
          ...fresh,
          replayedAs: next.eventId,
          replayedAt: iso(nowMs),
        });
        return { ok: true, eventId: next.eventId };
      });
    if (
      [
        "APPLIED",
        "SKIPPED",
        "SUPERSEDED",
        "MANUAL_REVIEW",
        "DEAD_LETTER",
      ].includes(work.status)
    )
      return { ok: true, status: work.status, duplicate: true };
    if (
      work.eventId !== event.eventId ||
      work.status !== "PENDING" ||
      Date.parse(work.nextAttemptAt) > nowMs
    )
      return fail("EVENT_NOT_READY");
    let selection = null;
    let sweep = null;
    if (work.kind === "ACCOUNT_EVENT") {
      sweep = rows(
        await db
          .collection("mapSourceBridgeState")
          .where({
            kind: "SOURCE_HEAD",
            ownerAccountId: work.ownerAccountId,
            deletionLatch: false,
          })
          .limit(1)
          .get(),
      );
    } else if (work.kind === "CONSENT_EVENT") {
      sweep = rows(
        await db
          .collection("observationCandidates")
          .where({
            ownerAccountId: work.ownerAccountId,
            recordId: db.command.gt(work.cursor ?? ""),
          })
          .orderBy("recordId", "asc")
          .limit(2)
          .get(),
      );
    } else if (work.kind === "SOURCE_EVENT") {
      if (work.stage === "RESOLVE")
        selection = await prepareSelection(db, "resolve", {
          observationVersionId: work.observationVersionId,
        });
      if (work.stage === "PROJECT")
        selection = await prepareSelection(db, "project", {
          outboxId: work.projectionOutboxId,
        });
    } else return fail("EVENT_KIND_INVALID");
    try {
      if (work.kind === "SOURCE_EVENT" && !admissionStaging) {
        if (normalizeSource(await loadSource(db, work.recordId), nowMs).ok)
          await prepareSourceMetadata({
            db,
            cloud,
            env,
            recordId: work.recordId,
            policy: before.policy,
            nowMs,
            invocation,
          });
        before = await control(db);
      }
      if (work.kind === "ACCOUNT_EVENT" && !sweep.length && !admissionStaging) {
        if (
          !(
            await get(
              db,
              "mapSourceBridgeState",
              `account:${hash(work.ownerAccountId)}`,
            )
          )?.deletionLatch
        )
          throw new Error("ACCOUNT_TOMBSTONE_REQUIRED");
        await cleanupAccountMetadata({ db, cloud, owner: work.ownerAccountId });
      }
      if (work.kind === "SOURCE_EVENT" && !admissionStaging)
        return await admitSourceAtomically({
          db,
          cloud,
          env,
          before,
          work,
          nowMs,
          newId,
          readControl: control,
          stagedWorker: (options) =>
            createStagedWorker({ ...options, admissionStaging: true }),
        });
      return await db.runTransaction(async (tx) => {
        const current = await control(tx);
        if (
          !current ||
          current.bridge.processorEnabled !== true ||
          current.mutationRevision !== before.mutationRevision ||
          stable(current) !== stable(before)
        )
          return fail("STALE_SELECTION");
        const fresh = await get(tx, "mapSourceOutbox", event.eventId);
        if (stable(fresh) !== stable(work)) return fail("STALE_EVENT");
        if (work.kind === "CONSENT_EVENT") {
          const terms = current.policy.terms;
          const consent = await get(
            tx,
            "mapContributionConsents",
            hash("consent", work.ownerAccountId, terms.version),
          );
          if (
            work.termsVersion !== terms.version ||
            work.scopeDigest !== terms.scopeDigest ||
            consent?.accepted !== true ||
            consent.ownerAccountId !== work.ownerAccountId ||
            consent.scopeDigest !== terms.scopeDigest
          ) {
            await set(tx, "mapSourceOutbox", work.eventId, {
              ...work,
              status: "SKIPPED",
              stage: "DONE",
              rejection: "CURRENT_CONSENT_REQUIRED",
            });
            await bump(tx);
            return { ok: true, status: "SKIPPED" };
          }
          let queued = 0;
          for (const ref of sweep) {
            const record = await get(tx, "observationCandidates", ref._id);
            if (
              record?.ownerAccountId !== work.ownerAccountId ||
              record.recordId !== ref.recordId
            )
              return fail("STALE_SELECTION");
            // Current terms explicitly cover completed prior/current V1 uploads.
            // The normalizer excludes private/pending records; authorization
            // binds the owner and actual current accepted scope on the server.
            const normalized = normalizeSource(
              await loadSource(tx, ref._id),
              nowMs,
            );
            const authorized = await authorizeSource(
              tx,
              normalized,
              current.policy,
              current.bridge,
              nowMs,
            );
            if (!authorized.ok) continue;
            await producer.enqueueSourceChange({
              tx,
              env,
              recordId: ref._id,
              ownerAccountId: work.ownerAccountId,
              reason: "CONSENT_ACCEPTED",
              nowMs,
              force: true,
            });
            queued++;
          }
          const more = sweep.length === 2;
          await set(tx, "mapSourceOutbox", work.eventId, {
            ...work,
            cursor: sweep.at(-1)?.recordId ?? work.cursor,
            status: more ? "PENDING" : "APPLIED",
            stage: more ? "CONSENT_SWEEP" : "DONE",
            nextAttemptAt: iso(nowMs + 1000),
            queued: (work.queued ?? 0) + queued,
            ...(more ? {} : { appliedAt: iso(nowMs) }),
          });
          await bump(tx);
          return { ok: true, status: more ? "PENDING" : "APPLIED", queued };
        }
        if (work.kind === "ACCOUNT_EVENT") {
          const accountTombstone = await get(
            tx,
            "mapSourceBridgeState",
            `account:${hash(work.ownerAccountId)}`,
          );
          if (!accountTombstone?.deletionLatch)
            throw new Error("ACCOUNT_TOMBSTONE_REQUIRED");
          if (sweep.length) {
            const state = await get(tx, "mapSourceBridgeState", sweep[0]._id);
            if (
              state?.ownerAccountId !== work.ownerAccountId ||
              state.deletionLatch
            )
              return fail("STALE_SELECTION");
            await producer.enqueueSourceChange({
              tx,
              env,
              recordId: state.recordId,
              ownerAccountId: work.ownerAccountId,
              reason: "DELETE",
              nowMs,
              force: true,
            });
          } else {
            await set(tx, "mapSourceOutbox", event.eventId, {
              ...work,
              status: "APPLIED",
              stage: "DONE",
              appliedAt: iso(nowMs),
              readBarrierRequiresReview: true,
            });
            await bump(tx);
          }
          return {
            ok: true,
            status: sweep.length ? "PENDING" : "APPLIED",
            readBarrierRequiresReview: true,
          };
        }
        const state = await get(
          tx,
          "mapSourceBridgeState",
          stateId(work.recordId),
        );
        if (
          !state ||
          state.ownerAccountId !== work.ownerAccountId ||
          state.lineageId !== work.lineageId ||
          work.revision !== state.desiredRevision
        ) {
          await set(tx, "mapSourceOutbox", event.eventId, {
            ...work,
            status: "SUPERSEDED",
            completedAt: iso(nowMs),
          });
          await bump(tx);
          return { ok: true, status: "SUPERSEDED" };
        }
        const raw = await loadSource(tx, work.recordId);
        let normalized = normalizeSource(raw, nowMs);
        if (raw.record && raw.record.ownerAccountId !== work.ownerAccountId)
          normalized = {
            ok: false,
            reason: "SOURCE_OWNER_MISMATCH",
            fingerprint: sourceFingerprint(raw),
          };
        const authorized = await authorizeSource(
          tx,
          normalized,
          current.policy,
          current.bridge,
          nowMs,
        );
        const terminal =
          state.deletionLatch || normalized.reason === "SOURCE_DELETED";
        const save = async (next, stateExtra = {}) => {
          await set(tx, "mapSourceOutbox", event.eventId, {
            ...work,
            ...next,
            updatedAt: iso(nowMs),
          });
          await set(tx, "mapSourceBridgeState", stateId(work.recordId), {
            ...state,
            ...stateExtra,
            updatedAt: iso(nowMs),
          });
          await bump(tx);
          return {
            ok: true,
            status: next.status ?? work.status,
            stage: next.stage ?? work.stage,
          };
        };
        if (work.stage === "SOURCE") {
          if (terminal || !authorized.ok) {
            if (terminal)
              await set(
                tx,
                "mapSourceBridgeState",
                noteCacheId(work.recordId),
                { kind: "NOTE_METADATA", deleted: true },
              );
            const projectionOutboxId = await retireSupport(
              tx,
              work,
              terminal,
              nowMs,
            );
            return save(
              {
                status: projectionOutboxId ? "PENDING" : "SKIPPED",
                stage: projectionOutboxId ? "PROJECT" : "DONE",
                projectionOutboxId,
                rejection: terminal ? "SOURCE_DELETED" : authorized.reason,
                sourceFingerprint: sourceFingerprint(raw),
              },
              {
                deletionLatch: terminal,
                appliedRevision: projectionOutboxId
                  ? state.appliedRevision
                  : work.revision,
                lastDecision: terminal ? "SOURCE_DELETED" : authorized.reason,
              },
            );
          }
          const o = authorized.observation;
          if (authorized.permissionFromUpload)
            await set(
              tx,
              "mapPlayerSourcePermissions",
              o.lineageId,
              authorized.permissionFromUpload,
            );
          const previous = await get(
            tx,
            "boardObservations",
            `observation:${o.observationVersionId}`,
          );
          if (previous && stable(previous) !== stable(o))
            throw new Error("IMMUTABLE_SOURCE_CONFLICT");
          if (!previous)
            await set(
              tx,
              "boardObservations",
              `observation:${o.observationVersionId}`,
              o,
            );
          await set(tx, "boardObservations", `lineage:${o.lineageId}`, {
            kind: "LINEAGE_HEAD",
            lineageId: o.lineageId,
            currentObservationVersionId: o.observationVersionId,
            sourceVersion: o.sourceVersion,
            lifecycleState: "CURRENT",
            ownerAccountId: work.ownerAccountId,
          });
          return save(
            {
              stage: "RESOLVE",
              observationVersionId: o.observationVersionId,
              sourceFingerprint: normalized.fingerprint,
            },
            {
              canonicalSchema: normalized.schemaVersion,
              currentFingerprint: normalized.fingerprint,
              currentAuthorizedObservationId: o.observationVersionId,
              observedAtBasis: normalized.observedAtBasis,
            },
          );
        }
        if (work.stage === "RESOLVE") {
          if (
            terminal ||
            !authorized.ok ||
            authorized.observation.observationVersionId !==
              work.observationVersionId ||
            normalized.fingerprint !== work.sourceFingerprint
          ) {
            const projectionOutboxId = await retireSupport(
              tx,
              work,
              terminal,
              nowMs,
            );
            return save({
              stage: projectionOutboxId ? "PROJECT" : "DONE",
              status: projectionOutboxId ? "PENDING" : "SKIPPED",
              projectionOutboxId,
              rejection: terminal
                ? "SOURCE_DELETED"
                : (authorized.reason ?? "SOURCE_CHANGED_WITHOUT_EVENT"),
            });
          }
          if (current.stopped || current.features?.resolverEnabled !== true)
            return fail("DOMAIN_PAUSED");
          const priorContribution = await get(
            tx,
            "mapContributions",
            hash("contribution", work.lineageId),
          );
          const oldRaw = priorContribution?.observationVersionId
            ? await get(
                tx,
                "boardObservations",
                `observation:${priorContribution.observationVersionId}`,
              )
            : null;
          const oldVerified = verifiedObservation(oldRaw);
          const newVerified = verifiedObservation(authorized.observation);
          // Revisions of the same private lineage are not new capture events. Keep
          // its established association only when location, identity and monotonic
          // counts agree. The original observedAt is never advanced by ingestion.
          const continuous =
            priorContribution?.boardInstanceId &&
            !priorContribution.noResurrection &&
            oldVerified &&
            newVerified &&
            oldRaw.lineageId === work.lineageId &&
            oldRaw.source.ownerAccountId === work.ownerAccountId &&
            stable(oldRaw.input.location) ===
              stable(authorized.observation.input.location) &&
            Date.parse(newVerified.observedAt) >=
              Date.parse(oldVerified.observedAt) &&
            oldVerified.facts.pricePerDrawMinor ===
              newVerified.facts.pricePerDrawMinor &&
            isForwardBoardTransition(oldVerified.facts, newVerified.facts);
          const result = continuous
            ? await link(
                tx,
                authorized.observation,
                priorContribution.boardInstanceId,
                "CURRENT_LINEAGE_CONTINUATION",
                current.policy,
                nowMs,
              )
            : await resolve(
                tx,
                { observationVersionId: work.observationVersionId },
                current,
                nowMs,
                selection,
              );
          if (!result.ok) {
            if (result.code === "LINEAGE_RELINK_REQUIRES_CORRECTION") {
              const projectionOutboxId = await retireSupport(
                tx,
                work,
                false,
                nowMs,
              );
              return save({
                stage: projectionOutboxId ? "PROJECT" : "DONE",
                status: projectionOutboxId ? "PENDING" : "MANUAL_REVIEW",
                projectionOutboxId,
                afterProjectionStatus: "MANUAL_REVIEW",
                resolution: result.code,
              });
            }
            throw new Error(result.code);
          }
          if (!result.outboxId) {
            if (result.duplicate)
              throw new Error("RESOLUTION_RECEIPT_INCOMPLETE");
            const projectionOutboxId = await retireSupport(
              tx,
              work,
              false,
              nowMs,
            );
            // Conservative resolution and HA remain the frozen domain's decisions.
            return save({
              stage: projectionOutboxId ? "PROJECT" : "DONE",
              status: projectionOutboxId ? "PENDING" : "MANUAL_REVIEW",
              projectionOutboxId,
              afterProjectionStatus: "MANUAL_REVIEW",
              resolution: result.resolution,
            });
          }
          return save({
            stage: "PROJECT",
            projectionOutboxId: result.outboxId,
            boardInstanceId: result.boardInstanceId,
          });
        }
        if (work.stage === "PROJECT") {
          // An unhooked change or consent/policy withdrawal still cannot publish a
          // stale source between stages. The head/support is invalidated in this tx.
          if (
            !work.rejection &&
            (terminal ||
              !authorized.ok ||
              normalized.fingerprint !== work.sourceFingerprint ||
              authorized.observation?.observationVersionId !==
                work.observationVersionId)
          ) {
            const projectionOutboxId = await retireSupport(
              tx,
              work,
              terminal,
              nowMs,
            );
            return save({
              projectionOutboxId,
              rejection: terminal
                ? "SOURCE_DELETED"
                : (authorized.reason ?? "SOURCE_CHANGED_WITHOUT_EVENT"),
            });
          }
          if (current.stopped || current.features?.projectorEnabled !== true)
            return fail("DOMAIN_PAUSED");
          const result = await project(
            tx,
            { outboxId: work.projectionOutboxId },
            current,
            nowMs,
            newId,
            selection,
          );
          if (!result.ok) {
            if (result.code === "STALE_OUTBOX_SEQUENCE")
              return save({
                status: "SUPERSEDED",
                stage: "DONE",
                rejection: result.code,
              });
            throw new Error(result.code);
          }
          return save(
            {
              status: work.afterProjectionStatus ?? "APPLIED",
              stage: "DONE",
              effect: result.effect,
              appliedAt: iso(nowMs),
            },
            {
              appliedRevision: work.revision,
              lastDecision: work.rejection ?? "PIPELINE_APPLIED",
            },
          );
        }
        throw new Error("EVENT_STAGE_INVALID");
      });
    } catch (error) {
      const code = /^[A-Z0-9_]+$/u.test(error?.message ?? "")
        ? error.message
        : "BRIDGE_TRANSACTION_FAILED";
      // Persistent failures are visible and bounded; no event is deleted or retried
      // forever. Replays retain the current-source and tombstone checks.
      await db.runTransaction(async (tx) => {
        const fresh = await get(tx, "mapSourceOutbox", event.eventId);
        if (fresh?.status !== "PENDING" || stable(fresh) !== stable(work))
          return;
        const attempts = (fresh.attempts ?? 0) + 1;
        await set(tx, "mapSourceOutbox", event.eventId, {
          ...fresh,
          attempts,
          status: attempts >= 8 ? "DEAD_LETTER" : "PENDING",
          lastError: code,
          nextAttemptAt: iso(nowMs + Math.min(3_600_000, 1000 * 2 ** attempts)),
        });
      });
      return fail(code);
    }
  };

// Normal production entry always performs atomic V1→V2 admission.
export const createWorker = (options) =>
  createStagedWorker({ ...options, admissionStaging: false });

export const createOwnerEntry =
  ({ cloud, env = process.env, now = Date.now }) =>
  async (event) => {
    if (
      env.ICHI_V2_FUNCTION_ENABLED !== "true" ||
      env.ICHI_V2_BACKEND_MODE !== "production"
    )
      return fail("SERVICE_DISABLED");
    const db = bridgeDatabase(cloud.database());
    const caller = await trustedAccount(cloud, db, env);
    if (!caller) return fail("UNAUTHORIZED");
    if (
      !event ||
      Object.keys(event).some(
        (k) =>
          ![
            "command",
            "recordId",
            "actionId",
            "expectedFingerprint",
            "shareIntent",
            "rightsAttested",
          ].includes(k),
      ) ||
      !/^record_[a-f0-9]{32}$/u.test(event.recordId ?? "") ||
      !["GET", "SET_INITIAL_CHOICE"].includes(event.command)
    )
      return fail("INVALID_REQUEST");
    return db.runTransaction(async (tx) => {
      const c = await control(tx);
      if (
        !c ||
        c.bridge.ownerEntryEnabled !== true ||
        c.bridge.producerEnabled !== true
      )
        return fail("BRIDGE_PAUSED");
      const raw = await loadSource(tx, event.recordId);
      if (raw.record?.ownerAccountId !== caller.accountId)
        return fail("RECORD_UNAVAILABLE");
      const normalized = normalizeSource(raw, now());
      if (!normalized.ok) return fail(normalized.reason);
      const id = lineageId(event.recordId);
      const prior = await get(tx, "mapPlayerSourcePermissions", id);
      if (event.command === "GET")
        return {
          ok: true,
          fingerprint: normalized.fingerprint,
          shareIntent: prior?.shareIntent ?? null,
        };
      if (
        !/^[a-f0-9]{64}$/u.test(event.expectedFingerprint ?? "") ||
        !/^[A-Za-z0-9_-]{8,128}$/u.test(event.actionId ?? "") ||
        !["SHARE", "DO_NOT_SHARE"].includes(event.shareIntent)
      )
        return fail("INVALID_REQUEST");
      const receiptId = hash(
        caller.digest,
        "initial-player-choice",
        event.actionId,
      );
      const payloadHash = hash(stable(event));
      const receipt = await get(tx, "mapAuditEvents", receiptId);
      if (receipt)
        return receipt.payloadHash === payloadHash
          ? receipt.result
          : fail("ACTION_ID_CONFLICT");
      if (prior) return fail("CHOICE_ALREADY_RECORDED");
      if (normalized.fingerprint !== event.expectedFingerprint)
        return fail("STALE_SOURCE");
      const terms = c.policy.terms;
      const consent = terms?.version
        ? await get(
            tx,
            "mapContributionConsents",
            hash("consent", caller.accountId, terms.version),
          )
        : null;
      if (
        event.shareIntent === "SHARE" &&
        (event.rightsAttested !== true ||
          !terms?.version ||
          !/^[a-f0-9]{64}$/u.test(terms.scopeDigest ?? "") ||
          consent?.ownerAccountId !== caller.accountId ||
          consent?.accepted !== true ||
          consent.termsVersion !== terms.version ||
          consent.scopeDigest !== terms.scopeDigest)
      )
        return fail("SHARE_AUTHORIZATION_REQUIRED");
      const state = await get(
        tx,
        "mapSourceBridgeState",
        stateId(event.recordId),
      );
      const contribution = await get(
        tx,
        "mapContributions",
        hash("contribution", id),
      );
      if (state?.deletionLatch || contribution?.noResurrection)
        return fail("SOURCE_DELETED");
      await set(tx, "mapPlayerSourcePermissions", id, {
        recordId: event.recordId,
        lineageId: id,
        ownerAccountId: caller.accountId,
        shareIntent: event.shareIntent,
        followCurrentVersion: event.shareIntent === "SHARE",
        rightsAttested: event.rightsAttested === true,
        termsVersion: terms?.version ?? null,
        scopeDigest: terms?.scopeDigest ?? null,
        acceptedSourceFingerprint: normalized.fingerprint,
        createdAt: iso(now()),
      });
      const enqueued = await producer.enqueueSourceChange({
        tx,
        env,
        recordId: event.recordId,
        ownerAccountId: caller.accountId,
        reason: "CHOICE",
        nowMs: now(),
        force: true,
      });
      const result = {
        ok: true,
        shareIntent: event.shareIntent,
        queued: enqueued.enabled,
      };
      await set(tx, "mapAuditEvents", receiptId, {
        kind: "SOURCE_CHOICE_RECEIPT",
        payloadHash,
        result,
        actorDigest: caller.digest,
        createdAt: iso(now()),
      });
      return result;
    });
  };

export const createDrain =
  ({ cloud, env = process.env, now = Date.now }) =>
  async (event, invocation = {}) => {
    if (
      env.ICHI_V2_FUNCTION_ENABLED !== "true" ||
      env.ICHI_V2_BACKEND_MODE !== "production"
    )
      return fail("SERVICE_DISABLED");
    // TRIGGER_SRC is platform runtime metadata, never read from event. OPENID-bearing
    // client invocations cannot impersonate a timer, including warm-container reuse.
    let invocationEnvironment = invocation.environment ?? invocation.environ;
    if (typeof invocationEnvironment === "string") {
      try {
        invocationEnvironment = JSON.parse(invocationEnvironment);
      } catch {
        invocationEnvironment = null;
      }
    }
    const principal = cloud.getWXContext();
    const timer =
      env.TRIGGER_SRC === "timer" &&
      invocationEnvironment?.TRIGGER_SRC === "timer" &&
      !principal?.OPENID &&
      !principal?.UID &&
      !principal?.TCB_UUID;
    const scoped = !timer && event?.operation === "DRAIN_ONE";
    if (
      !timer &&
      !requestValid(
        env.ICHI_V2_SOURCE_BRIDGE_HMAC_KEY,
        event,
        scoped ? "DRAIN_ONE" : "DRAIN",
        now(),
      )
    )
      return fail("UNAUTHORIZED");
    const db = bridgeDatabase(cloud.database());
    const c = await control(db);
    if (!c || c.bridge.processorEnabled !== true) return fail("BRIDGE_PAUSED");
    const pending = scoped
      ? [await get(db, "mapSourceOutbox", event.eventId)].filter(
          (r) => r?.status === "PENDING",
        )
      : rows(
          await db
            .collection("mapSourceOutbox")
            .where({ status: "PENDING" })
            .orderBy("nextAttemptAt", "asc")
            .limit(20)
            .get(),
        );
    let processed = 0,
      failed = 0,
      continuing = false;
    const failureCodes = new Set();
    const failureCode = (value) =>
      typeof value === "string" && /^[A-Z0-9_]{1,100}$/u.test(value)
        ? value
        : Number.isInteger(value)
          ? `CLOUD_CALL_${value}`
          : "CLOUD_CALL_FAILED";
    const startedAt = now();
    for (const row of pending) {
      if (now() - startedAt >= 45_000) break;
      if (Date.parse(row.nextAttemptAt) > now()) break;
      try {
        const response = await cloud.callFunction({
          name: "process-map-source-bridge",
          data: signedRequest(
            env.ICHI_V2_SOURCE_BRIDGE_HMAC_KEY,
            "PROCESS",
            row.eventId,
            now(),
          ),
        });
        let result = response?.result;
        if (typeof result === "string") {
          try {
            result = JSON.parse(result);
          } catch {
            result = null;
          }
        }
        if (result?.ok) {
          processed++;
          continuing ||= result.status === "PENDING";
        } else {
          failed++;
          failureCodes.add(failureCode(result?.failureCode ?? result?.code));
        }
      } catch (error) {
        failed++;
        failureCodes.add(failureCode(error?.errCode ?? error?.code));
      }
    }
    return {
      ok: true,
      processed,
      failed,
      ...(failed ? { failureCodes: [...failureCodes] } : {}),
      hasMore:
        continuing ||
        (!scoped && pending.length === 20) ||
        processed + failed < pending.length,
    };
  };

export const previewHistorical = async (
  db,
  recordIds,
  policy,
  bridge,
  nowMs,
) => {
  if (!Array.isArray(recordIds) || recordIds.length > 100)
    throw new Error("HISTORY_BATCH_LIMIT");
  const result = [];
  for (const recordId of recordIds) {
    const source = normalizeSource(await loadSource(db, recordId), nowMs);
    const decision = await authorizeSource(db, source, policy, bridge, nowMs);
    result.push({
      recordDigest: hash("historical-report", recordId),
      fingerprint: source.fingerprint,
      decision: decision.ok ? "ELIGIBLE_FOR_PIPELINE" : "SKIP",
      reason: decision.ok ? null : decision.reason,
    });
  }
  return result;
};

// Caller owns a separately approved, bounded history batch. Every row re-reads
// applicable authorization inside the same snapshot as its dirty event write.
export const enqueueHistoricalBatch = async (db, recordIds, env, nowMs) => {
  if (
    !Array.isArray(recordIds) ||
    recordIds.length > 100 ||
    new Set(recordIds).size !== recordIds.length
  )
    throw new Error("HISTORY_BATCH_LIMIT");
  const result = [];
  for (const recordId of recordIds)
    result.push(
      await db.runTransaction(async (tx) => {
        const c = await control(tx);
        if (!c || c.bridge.producerEnabled !== true)
          return { decision: "SKIP", reason: "BRIDGE_PAUSED" };
        const source = normalizeSource(await loadSource(tx, recordId), nowMs);
        const decision = await authorizeSource(
          tx,
          source,
          c.policy,
          c.bridge,
          nowMs,
        );
        if (!decision.ok) return { decision: "SKIP", reason: decision.reason };
        const state = await get(tx, "mapSourceBridgeState", stateId(recordId));
        if (state?.deletionLatch)
          return { decision: "SKIP", reason: "SOURCE_DELETED" };
        if (
          state?.currentFingerprint === source.fingerprint &&
          state.currentAuthorizedObservationId ===
            decision.observation.observationVersionId &&
          state.appliedRevision === state.desiredRevision &&
          state.lastDecision === "PIPELINE_APPLIED"
        )
          return { decision: "UNCHANGED" };
        if (
          state?.queuedHistoryObservationId ===
            decision.observation.observationVersionId &&
          state.desiredRevision > state.appliedRevision
        ) {
          const pendingId = hash(
            "source-event-phase2",
            source.lineageId,
            String(state.desiredRevision),
          );
          if (
            (await get(tx, "mapSourceOutbox", pendingId))?.status === "PENDING"
          )
            return { decision: "ALREADY_QUEUED", eventId: pendingId };
        }
        const event = await producer.enqueueSourceChange({
          tx,
          env,
          recordId,
          ownerAccountId: source.ownerAccountId,
          reason: "HISTORY",
          nowMs,
          force: true,
        });
        const queuedState = await get(
          tx,
          "mapSourceBridgeState",
          stateId(recordId),
        );
        await set(tx, "mapSourceBridgeState", stateId(recordId), {
          ...queuedState,
          queuedHistoryObservationId: decision.observation.observationVersionId,
        });
        return { decision: "QUEUED", eventId: event.eventId };
      }),
    );
  return result;
};
