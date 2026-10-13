import { randomBytes } from "node:crypto";
import { read, hash } from "../shared/security.mjs";
import { bridgeDatabase } from "../phase2/security.mjs";
import { networkRequestValid } from "./security.mjs";
import {
  admitOfficialNetworkSource,
  reconcileNetworkLifecycle,
  reconcileDueNetworkSources,
} from "./admission.mjs";

export const networkDecisionId = (sourceId, sourceVersion) =>
  `network-decision:${hash(sourceId, sourceVersion)}`;
const fail = (code) => ({ ok: false, code });
export const createNetworkMain =
  ({
    cloud,
    env = process.env,
    operation,
    now = Date.now,
    newId = () => randomBytes(16).toString("hex"),
  }) =>
  async (event = {}, invocation = {}) => {
    if (env.ICHI_V2_BACKEND_MODE !== "production")
      return fail("SERVICE_DISABLED");
    const nowMs = now(),
      db = bridgeDatabase(cloud.database());
    const control = await read(
      db.collection("mapControlState"),
      "global:network",
    );
    if (
      control?.kind !== "NETWORK_CONTROL" ||
      control.contract !== "official-network-production-v1"
    )
      return fail("SERVICE_DISABLED");
    let invocationEnv = invocation.environment ?? invocation.environ;
    if (typeof invocationEnv === "string") {
      try {
        invocationEnv = JSON.parse(invocationEnv);
      } catch {
        invocationEnv = null;
      }
    }
    const principal = cloud.getWXContext();
    const timer =
      env.TRIGGER_SRC === "timer" &&
      invocationEnv?.TRIGGER_SRC === "timer" &&
      !principal?.OPENID &&
      !principal?.UID &&
      !principal?.TCB_UUID;
    if (operation === "maintenance" && timer) {
      if (
        env.ICHI_V2_NETWORK_MAINTENANCE_ENABLED !== "true" ||
        control.maintenanceEnabled !== true
      )
        return { ok: true, disabled: true, processed: 0 };
      return reconcileDueNetworkSources({ db, nowMs, newId });
    }
    if (!networkRequestValid(env.ICHI_V2_NETWORK_OPS_HMAC_KEY, event, nowMs))
      return fail("UNAUTHORIZED");
    if (event.command === "STATUS")
      return {
        ok: true,
        admissionEnabled: control.admissionEnabled === true,
        maintenanceEnabled: control.maintenanceEnabled === true,
        curatorAuthorityId: control.curatorAuthorityId,
      };
    const smokeAllowed =
      control.smokeEnabled === true &&
      Date.parse(control.smokeExpiresAt) > nowMs &&
      control.smokeSourceIds?.includes(
        event.record?.sourceId ?? event.sourceId,
      );
    if (event.command === "ADMIT" && operation === "admission") {
      if (env.ICHI_V2_NETWORK_ADMISSION_ENABLED !== "true" && !smokeAllowed)
        return fail("NETWORK_SERVICE_DISABLED");
      if (control.admissionEnabled !== true && !smokeAllowed)
        return fail("NETWORK_SERVICE_DISABLED");
      const decisions = {
        read: async (sourceId, version, tx = db) => {
          const fresh = await read(
            tx.collection("mapControlState"),
            "global:network",
          );
          const row = await read(
            tx.collection("boardObservations"),
            networkDecisionId(sourceId, version),
          );
          if (
            fresh?.curatorAuthorityId !== control.curatorAuthorityId ||
            row?.kind !== "NETWORK_AUTHORIZED_DECISION" ||
            row.approval?.curatorAuthorityId !== fresh.curatorAuthorityId ||
            (row.testOnly === true
              ? !(
                  fresh.smokeEnabled === true &&
                  Date.parse(fresh.smokeExpiresAt) > nowMs &&
                  fresh.smokeSourceIds?.includes(sourceId)
                )
              : fresh.admissionEnabled !== true)
          )
            return null;
          return {
            approval: row.approval,
            rights: row.rights,
            noteSafety: row.noteSafety,
            controlVersion: fresh.controlVersion,
          };
        },
      };
      const bridge = await read(
        db.collection("mapSourceBridgeControl"),
        "global:bridge",
      );
      return admitOfficialNetworkSource({
        db,
        record: event.record,
        decisions,
        locationPolicy: bridge?.locationPolicy,
        nowMs,
        newId:
          smokeAllowed && control.smokeNewLeadIds?.[event.record.sourceId]
            ? () => control.smokeNewLeadIds[event.record.sourceId]
            : newId,
      });
    }
    if (
      ["RECONCILE", "TAKEDOWN"].includes(event.command) &&
      operation === "maintenance"
    ) {
      if (
        !smokeAllowed &&
        (control.maintenanceEnabled !== true ||
          env.ICHI_V2_NETWORK_MAINTENANCE_ENABLED !== "true")
      )
        return fail("NETWORK_SERVICE_DISABLED");
      const source = await read(
        db.collection("boardObservations"),
        `network-source:${event.sourceId}`,
      );
      if (!source) return fail("NETWORK_SOURCE_UNAVAILABLE");
      const o = await read(
        db.collection("boardObservations"),
        `observation:${source.observationVersionId}`,
      );
      const c = await read(
        db.collection("mapContributions"),
        hash("contribution", o.lineageId),
      );
      if (!c) return fail("NETWORK_SOURCE_UNAVAILABLE");
      let clock = nowMs;
      if (Object.hasOwn(event, "smokeNowMs")) {
        if (
          !smokeAllowed ||
          !Number.isFinite(event.smokeNowMs) ||
          event.smokeNowMs !== Date.parse(o.publicProjection.publicUntil)
        )
          return fail("INVALID_SMOKE_CLOCK");
        clock = event.smokeNowMs;
      }
      return reconcileNetworkLifecycle({
        db,
        boardInstanceId: c.boardInstanceId,
        nowMs: clock,
        newId,
        takedownSourceId: event.command === "TAKEDOWN" ? event.sourceId : null,
      });
    }
    return fail("INVALID_REQUEST");
  };
