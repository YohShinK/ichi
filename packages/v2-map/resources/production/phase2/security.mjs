import { createHmac, timingSafeEqual } from "node:crypto";
import { secretReady } from "../shared/security.mjs";

export const PRIVATE_READS = [
  "observationCandidates",
  "drawSubmissions",
  "deletionJobs",
  "accounts",
  "wechatIdentities",
  "profiles",
];
export const MAP_WRITES = [
  "mapSourceBridgeState",
  "mapSourceOutbox",
  "mapPlayerSourcePermissions",
  "mapSourceBridgeControl",
  "boardObservations",
  "boardInstances",
  "boardAssociations",
  "mapContributions",
  "mapContributionConsents",
  "mapProjectionOutbox",
  "publicMapLeads",
  "mapControlState",
  "mapModerationLedger",
  "mapAuditEvents",
  "mapAssistanceRequests",
  "mapAssistanceEvidence",
  "mapAccountPolicies",
];
export const bridgeDatabase = (db) => {
  const wrap = (source, transactional = false) => {
    let operations = 0;
    const cache = new Map();
    const count = () => {
      if (++operations > 95)
        throw new Error("TRANSACTION_OPERATION_BUDGET_EXCEEDED");
    };
    const collection = (name) => {
      if (![...PRIVATE_READS, ...MAP_WRITES].includes(name))
        throw new Error("COLLECTION_NOT_ALLOWED");
      const raw = source.collection(name);
      const doc = (id) => ({
        get: async () => {
          const key = `${name}\0${id}`;
          if (transactional && cache.has(key)) return cache.get(key);
          if (transactional) count();
          try {
            const result = await raw.doc(id).get();
            cache.set(key, result);
            return result;
          } catch (error) {
            if (
              !/not exist|not found|-502005/u.test(
                String(error?.message ?? error),
              )
            )
              throw error;
            const result = { data: null };
            cache.set(key, result);
            return result;
          }
        },
        ...(PRIVATE_READS.includes(name)
          ? {}
          : {
              set: async (data) => {
                if (transactional) count();
                const result = await raw.doc(id).set(data);
                cache.set(`${name}\0${id}`, { data: data.data });
                return result;
              },
            }),
      });
      if (transactional) return { doc };
      // Queries are available outside transactions; private queries are read-only.
      const query = (q) => ({
        get: () => q.get(),
        where: (...args) => query(q.where(...args)),
        orderBy: (...args) => query(q.orderBy(...args)),
        limit: (...args) => query(q.limit(...args)),
      });
      return { doc, ...query(raw) };
    };
    return { collection, Geo: db.Geo, command: db.command };
  };
  return {
    ...wrap(db),
    runTransaction: (work) => db.runTransaction((tx) => work(wrap(tx, true))),
  };
};
export const CONTRACT = "ichi:source-bridge:phase2:v1";
export const signedRequest = (key, operation, eventId, nowMs) => {
  if (!secretReady(key)) throw new Error("BRIDGE_KEY_UNAVAILABLE");
  const issuedAt = nowMs,
    expiresAt = nowMs + 60_000;
  const signature = createHmac("sha256", key)
    .update([CONTRACT, operation, eventId, issuedAt, expiresAt].join("\0"))
    .digest("hex");
  return {
    contract: CONTRACT,
    operation,
    eventId,
    issuedAt,
    expiresAt,
    signature,
  };
};
export const requestValid = (key, e, operation, nowMs) => {
  if (
    !secretReady(key) ||
    !e ||
    Object.keys(e).some(
      (k) =>
        ![
          "contract",
          "operation",
          "eventId",
          "issuedAt",
          "expiresAt",
          "signature",
          // Actual CloudBase cloud.callFunction adds tcbContext to event.
          // Never read this field for identity or permission; the six signed
          // fields and HMAC remain the sole system-request authority.
          "userInfo",
          "tcbContext",
        ].includes(k),
    ) ||
    e.contract !== CONTRACT ||
    e.operation !== operation ||
    !/^[a-f0-9]{64}$/u.test(e.eventId ?? "") ||
    !Number.isSafeInteger(e.issuedAt) ||
    !Number.isSafeInteger(e.expiresAt) ||
    e.issuedAt > nowMs + 5000 ||
    e.expiresAt <= nowMs ||
    e.expiresAt - e.issuedAt !== 60_000 ||
    !/^[a-f0-9]{64}$/u.test(e.signature ?? "")
  )
    return false;
  const expected = signedRequest(
    key,
    operation,
    e.eventId,
    e.issuedAt,
  ).signature;
  return timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(e.signature, "hex"),
  );
};

// Diagnose transport shape without returning values, signatures or identities.
export const requestFailureCode = (e, nowMs) => {
  const signedFields = [
    "contract",
    "operation",
    "eventId",
    "issuedAt",
    "expiresAt",
    "signature",
    "userInfo",
    "tcbContext",
  ];
  const extra = Object.keys(e ?? {}).filter((k) => !signedFields.includes(k));
  if (extra.length)
    return (
      "UNAUTHORIZED_EXTRA_" +
      extra
        .map((k) => (/^[A-Za-z_]{1,24}$/u.test(k) ? k.toUpperCase() : "FIELD"))
        .join("_")
    ).slice(0, 100);
  if (e?.issuedAt > nowMs + 5000 || e?.expiresAt <= nowMs)
    return "UNAUTHORIZED_TIMING";
  return "UNAUTHORIZED_SIGNED_FIELDS";
};
