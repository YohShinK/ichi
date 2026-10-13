import { createHash } from "node:crypto";
import { visibilityAfterActiveReports } from "../../../src/moderation.js";
import { readDoc } from "../shared/db.mjs";
import {
  deriveTrustedCaller,
  verifyRehearsalCapability,
  consumeShadowCapabilityNonce,
} from "../shared/security.mjs";

export const REPORT_POLICY = Object.freeze({
  policyVersion: "v2-21-report-policy-1",
  autoHideDistinctEligibleReports: 10,
});
const hash = (...parts) =>
  createHash("sha256").update(parts.join("\0")).digest("hex");
const fail = (code) => ({ ok: false, code });
const origin = "SYNTHETIC_REHEARSAL";
export const createMain =
  ({
    cloud,
    env,
    now = Date.now,
    diagnose = (value) =>
      cloud.logger().warn({ tag: "TASK21_REPORT_INVALID_STRUCTURE", ...value }),
  }) =>
  async (event = {}) => {
    const invalidRequest = (stage, structure = {}) => {
      if (
        env.ICHI_V2_SHADOW_BOUNDARY === "synthetic_only" &&
        env.ICHI_V2_SHADOW_REPORT_ENABLED === "true"
      ) {
        try {
          diagnose({ version: 1, stage, ...structure });
        } catch {
          // Diagnostics must not alter request rejection or persistence.
        }
      }
      return fail("INVALID_REQUEST");
    };
    if (!event || typeof event !== "object" || Array.isArray(event))
      return invalidRequest("EVENT_SHAPE", {
        eventType: event === null ? "null" : typeof event,
        isArray: Array.isArray(event),
      });
    // WeChat adds this transport envelope. It never supplies reporter authority.
    event = Object.fromEntries(
      Object.entries(event).filter(
        ([key]) => key !== "userInfo" && key !== "tcbContext",
      ),
    );
    if (
      env.ICHI_V2_SHADOW_BOUNDARY !== "synthetic_only" ||
      env.ICHI_V2_SHADOW_REPORT_ENABLED !== "true" ||
      env.ICHI_V2_SHADOW_REPORT_POLICY_VERSION !== REPORT_POLICY.policyVersion
    )
      return fail("REPORT_DISABLED");
    let caller;
    let principalClass = "WXCONTEXT_TEST_ACCOUNT";
    if (
      Object.keys(event).length === 1 &&
      typeof event.capability === "string"
    ) {
      if (env.ICHI_V2_SHADOW_REPORT_REHEARSAL_ENABLED !== "true")
        return fail("REHEARSAL_DISABLED");
      const capability = await verifyRehearsalCapability(
        event.capability,
        "report-rehearsal",
        "v2-shadow-report-public-map-lead",
        env.ICHI_V2_SHADOW_REHEARSAL_HMAC_KEY,
        (id, expiry) =>
          consumeShadowCapabilityNonce(cloud.database(), id, expiry),
        now(),
      );
      if (!capability.ok) return fail("UNAUTHORIZED");
      const payload = capability.payload;
      if (
        payload.policyVersion !== REPORT_POLICY.policyVersion ||
        !/^[a-f0-9]{64}$/u.test(payload.subjectDigest)
      )
        return invalidRequest("CAPABILITY_POLICY");
      caller = { ok: true, digest: payload.subjectDigest };
      principalClass = "SYNTHETIC_TEST_PRINCIPAL";
      event = {
        publicLeadId: payload.publicLeadId,
        command: payload.command,
        actionId: payload.actionId,
      };
    } else caller = deriveTrustedCaller(cloud, env);
    if (!caller.ok) return fail("UNAUTHORIZED");
    const { publicLeadId, command, actionId } = event;
    const extraKeys = Object.keys(event).filter(
      (key) => !["publicLeadId", "command", "actionId"].includes(key),
    );
    const leadValid = /^[a-f0-9]{32}$/u.test(publicLeadId);
    const commandValid = ["GET_STATE", "REPORT", "CANCEL_REPORT"].includes(
      command,
    );
    const actionValid =
      command === "GET_STATE" ||
      (typeof actionId === "string" &&
        /^[A-Za-z0-9_-]{8,128}$/u.test(actionId));
    if (extraKeys.length || !leadValid || !commandValid || !actionValid)
      return invalidRequest("BUSINESS_FIELDS", {
        extraKeyCount: extraKeys.length,
        extraKeys: extraKeys
          .slice(0, 16)
          .map((key) =>
            /^[A-Za-z_][A-Za-z0-9_]{0,47}$/u.test(key) &&
            !/^[a-f0-9]{32,}$/u.test(key)
              ? key
              : "[REDACTED_KEY]",
          ),
        leadValid,
        commandValid,
        actionValid,
        leadType: typeof publicLeadId,
        leadLength:
          typeof publicLeadId === "string" ? publicLeadId.length : null,
        commandType: typeof command,
        actionType: typeof actionId,
        actionLength: typeof actionId === "string" ? actionId.length : null,
      });
    const db = cloud.database();
    try {
      return await db.runTransaction(async (tx) => {
        const control = tx.collection("v2ShadowControlState");
        const ledger = tx.collection("v2ShadowModerationLedger");
        const stopped = await readDoc(control, "global:read-stop");
        if (stopped?.stopped !== false || stopped.dataOrigin !== origin)
          return fail("REPORT_DISABLED");
        const authority = await readDoc(control, `reporter:${caller.digest}`);
        if (
          authority?.kind !== "REPORTER_AUTHORITY" ||
          authority.subjectDigest !== caller.digest ||
          authority.dataOrigin !== origin ||
          authority.accountActive !== true ||
          (principalClass === "SYNTHETIC_TEST_PRINCIPAL" &&
            authority.principalClass !== principalClass) ||
          authority.spamOrInvalid !== false ||
          !(Date.parse(authority.expiresAt) > now())
        )
          return fail("UNAUTHORIZED");
        // Trusted WXContext account digest is device-independent. Authority is server-only.
        if (command === "REPORT" && authority.eligible !== true)
          return fail("INELIGIBLE_REPORTER");
        const windowKey = String(Math.floor(now() / 60000));
        const rateId = `report-rate:${hash(caller.digest, windowKey)}`;
        const rate = await readDoc(control, rateId);
        if ((rate?.count ?? 0) >= 30) return fail("RATE_LIMITED");
        const rows =
          (
            await tx
              .collection("v2ShadowPublicMapLeads")
              .where({ publicLeadId })
              .orderBy("servedVersion", "desc")
              .limit(1)
              .get()
          ).data ?? [];
        const target = rows[0] ? { ...rows[0] } : null;
        if (target) delete target._id;
        if (
          !target ||
          target.dataOrigin !== origin ||
          target.retiredAt ||
          !["PUBLIC", "HIDDEN"].includes(target.lifecycleState)
        )
          return fail("LEAD_UNAVAILABLE");
        const instances =
          (
            await tx
              .collection("v2ShadowBoardInstances")
              .where({ activePublicLeadId: publicLeadId })
              .limit(2)
              .get()
          ).data ?? [];
        if (
          instances.length !== 1 ||
          instances[0].lifecycleState !== "ACTIVE" ||
          instances[0].dataOrigin !== origin
        )
          return fail("LEAD_UNAVAILABLE");
        const instance = { ...instances[0] };
        delete instance._id;
        if (
          !["VISIBLE", "HIDDEN"].includes(target.visibility) ||
          (target.lifecycleState === "HIDDEN" &&
            instance.moderationThresholdHidden !== true)
        )
          return fail("LEAD_UNAVAILABLE");
        const policyVersion = REPORT_POLICY.policyVersion;
        const stateId = `state:${hash(publicLeadId, policyVersion)}`;
        const reportId = `report:${hash(publicLeadId, caller.digest, policyVersion)}`;
        const aggregate = await readDoc(ledger, stateId);
        const previous = await readDoc(ledger, reportId);
        if (
          (aggregate &&
            (aggregate.kind !== "TARGET_POLICY_STATE" ||
              aggregate.dataOrigin !== origin ||
              aggregate.policyVersion !== policyVersion ||
              aggregate.publicLeadId !== publicLeadId)) ||
          (previous &&
            (previous.kind !== "REPORT_STATE" ||
              previous.dataOrigin !== origin ||
              previous.policyVersion !== policyVersion ||
              previous.publicLeadId !== publicLeadId ||
              previous.reporterSubjectDigest !== caller.digest))
        )
          return fail("LEDGER_CONFLICT");
        const count = aggregate?.activeDistinctEligibleReporters ?? 0;
        if (
          !Number.isSafeInteger(count) ||
          count < 0 ||
          (previous?.active === true && count < 1)
        )
          return fail("LEDGER_CONFLICT");
        const result = (active) => ({
          ok: true,
          active,
          hidden:
            instance.moderationThresholdHidden === true ||
            target.visibility !== "VISIBLE",
          policyVersion,
        });
        await control.doc(rateId).set({
          data: {
            kind: "REPORT_RATE",
            subjectDigest: caller.digest,
            windowKey,
            count: (rate?.count ?? 0) + 1,
            expiresAt: new Date((Number(windowKey) + 1) * 60000).toISOString(),
            dataOrigin: origin,
          },
        });
        if (command === "GET_STATE") return result(previous?.active === true);
        const commandId = `command:${hash(publicLeadId, caller.digest, policyVersion, actionId)}`;
        const priorCommand = await readDoc(ledger, commandId);
        if (priorCommand)
          return priorCommand.command === command
            ? result(previous?.active === true)
            : fail("ACTION_CONFLICT");
        const active = command === "REPORT";
        const wasActive = previous?.active === true;
        const nextCount = count + (active === wasActive ? 0 : active ? 1 : -1);
        const visibility = visibilityAfterActiveReports(
          instance.moderationThresholdHidden ? "HIDDEN" : target.visibility,
          nextCount,
          REPORT_POLICY,
        );
        const autoHide =
          visibility === "HIDDEN" && target.visibility === "VISIBLE";
        const at = new Date(now()).toISOString();
        const base = { publicLeadId, policyVersion, dataOrigin: origin };
        await ledger.doc(reportId).set({
          data: {
            ...base,
            kind: "REPORT_STATE",
            reporterSubjectDigest: caller.digest,
            principalClass,
            active,
            state: active ? "ACTIVE" : "CANCELLED",
            eligible: true,
            updatedAt: at,
          },
        });
        await ledger.doc(stateId).set({
          data: {
            ...base,
            kind: "TARGET_POLICY_STATE",
            activeDistinctEligibleReporters: nextCount,
            updatedAt: at,
          },
        });
        await ledger.doc(commandId).set({
          data: {
            ...base,
            kind: "AUDIT",
            principalClass,
            reporterSubjectDigest: caller.digest,
            command,
            createdAt: at,
            active,
            duplicate: active === wasActive,
          },
        });
        if (autoHide) {
          const epoch = await readDoc(control, "global:read-epoch");
          if (
            !Number.isSafeInteger(epoch?.epoch) ||
            epoch.dataOrigin !== origin
          )
            throw new Error("epoch unavailable");
          await tx
            .collection("v2ShadowPublicMapLeads")
            .doc(`lead:${publicLeadId}:${target.servedVersion}`)
            .set({
              data: {
                ...target,
                lifecycleState: "HIDDEN",
                visibility: "HIDDEN",
              },
            });
          await tx
            .collection("v2ShadowBoardInstances")
            .doc(instance.boardInstanceId)
            .set({
              data: {
                ...instance,
                moderationThresholdHidden: true,
                moderationPolicyVersion: policyVersion,
                moderationHiddenAt: at,
              },
            });
          await control
            .doc("global:read-epoch")
            .set({ data: { ...epoch, epoch: epoch.epoch + 1 } });
          await ledger.doc(`hide:${hash(publicLeadId, policyVersion)}`).set({
            data: {
              ...base,
              kind: "AUDIT",
              command: "AUTO_HIDE",
              createdAt: at,
              activeDistinctEligibleReporters: nextCount,
              reviewRequired: true,
              noResurrection: true,
            },
          });
        }
        return {
          ok: true,
          active,
          hidden: visibility !== "VISIBLE",
          policyVersion,
        };
      });
    } catch {
      return fail("SERVICE_UNAVAILABLE");
    }
  };
