import { createHash, createHmac } from "node:crypto";

export const hash = (...parts) =>
  createHash("sha256").update(parts.join("\0")).digest("hex");
export const read = async (collection, id) => {
  try {
    const result = await collection.doc(id).get();
    const value = Array.isArray(result?.data) ? result.data[0] : result?.data;
    if (!value) return null;
    const data = { ...value };
    delete data._id;
    delete data._openid;
    return data;
  } catch (error) {
    if (/not exist|not found|-502005/u.test(String(error?.message ?? error)))
      return null;
    throw error;
  }
};
export const put = (collection, id, data) => collection.doc(id).set({ data });
export const rows = (result) =>
  Array.isArray(result?.data) ? result.data : [];
export const secretReady = (secret) =>
  typeof secret === "string" && Buffer.byteLength(secret) >= 32;

// Per-entry capabilities select only literal SDK collection calls below.
// V1 identity/Account capabilities expose doc.get only, even in transactions.
export const guardedDatabase = (db, allowed) => {
  const names = new Set(allowed);
  const guard = (source, transactional = false) => {
    let operations = 0;
    const cache = new Map();
    const count = () => {
      if (++operations > 95)
        throw new Error("TRANSACTION_OPERATION_BUDGET_EXCEEDED");
    };
    const collection = (name) => {
      const raw = literalCollection(name);
      if (!transactional) return raw;
      // CloudBase transactions support doc operations only. Cache snapshot reads and own writes.
      return {
        doc: (id) => ({
          get: async () => {
            const key = `${name}\0${id}`;
            if (cache.has(key)) return cache.get(key);
            count();
            try {
              const result = await raw.doc(id).get();
              cache.set(key, result);
              return result;
            } catch (error) {
              if (
                /not exist|not found|-502005/u.test(
                  String(error?.message ?? error),
                )
              ) {
                const result = { data: null };
                cache.set(key, result);
                return result;
              }
              throw error;
            }
          },
          ...(name === "accounts" || name === "wechatIdentities"
            ? {}
            : {
                set: async (data) => {
                  count();
                  const result = await raw.doc(id).set(data);
                  cache.set(`${name}\0${id}`, { data: data.data });
                  return result;
                },
              }),
        }),
      };
    };
    const literalCollection = (name) => {
      if (!names.has(name)) throw new Error("COLLECTION_NOT_ALLOWED");
      if (name === "accounts")
        return {
          doc: (id) => ({
            get: () => source.collection("accounts").doc(id).get(),
          }),
        };
      if (name === "wechatIdentities")
        return {
          doc: (id) => ({
            get: () => source.collection("wechatIdentities").doc(id).get(),
          }),
        };
      switch (name) {
        case "boardObservations":
          return source.collection("boardObservations");
        case "boardInstances":
          return source.collection("boardInstances");
        case "boardAssociations":
          return source.collection("boardAssociations");
        case "mapContributions":
          return source.collection("mapContributions");
        case "mapContributionConsents":
          return source.collection("mapContributionConsents");
        case "mapSourceOutbox":
          return source.collection("mapSourceOutbox");
        case "mapProjectionOutbox":
          return source.collection("mapProjectionOutbox");
        case "publicMapLeads":
          return source.collection("publicMapLeads");
        case "publicMapQuerySnapshots":
          return source.collection("publicMapQuerySnapshots");
        case "mapControlState":
          return source.collection("mapControlState");
        case "mapModerationLedger":
          return source.collection("mapModerationLedger");
        case "mapAuditEvents":
          return source.collection("mapAuditEvents");
        case "mapAssistanceRequests":
          return source.collection("mapAssistanceRequests");
        case "mapAssistanceEvidence":
          return source.collection("mapAssistanceEvidence");
        case "mapAccountPolicies":
          return source.collection("mapAccountPolicies");
        default:
          throw new Error("COLLECTION_NOT_ALLOWED");
      }
    };
    return { command: db.command, Geo: db.Geo, collection };
  };
  return {
    ...guard(db),
    runTransaction: (work) => db.runTransaction((tx) => work(guard(tx, true))),
  };
};

export const trustedAccount = async (cloud, db, env) => {
  const context = cloud.getWXContext();
  if (
    !context?.APPID ||
    !context.OPENID ||
    !secretReady(env.IDENTITY_HMAC_KEY) ||
    !secretReady(env.ICHI_V2_ACCOUNT_AUTHORITY_HMAC_KEY)
  )
    return null;
  // Exactly the V1 hashIdentity namespace. No client identity claims are used.
  const identityId = createHmac("sha256", env.IDENTITY_HMAC_KEY)
    .update(`${context.APPID}:${context.OPENID}`)
    .digest("hex");
  const mapping = await read(db.collection("wechatIdentities"), identityId);
  if (typeof mapping?.accountId !== "string" || !mapping.accountId) return null;
  const account = await read(db.collection("accounts"), mapping.accountId);
  if (account?.status !== "active") return null;
  return {
    accountId: mapping.accountId,
    digest: createHmac("sha256", env.ICHI_V2_ACCOUNT_AUTHORITY_HMAC_KEY)
      .update(`ichi:map:account:v1\0${mapping.accountId}`)
      .digest("hex"),
  };
};

export const accountPolicy = async (db, accountId, nowMs) => {
  const p = await read(
    db.collection("mapAccountPolicies"),
    `account:${accountId}`,
  );
  return p?.accountId === accountId &&
    p.kind === "ACCOUNT_POLICY" &&
    p.authorityVersion === "production-account-policy-v1" &&
    Date.parse(p.expiresAt) > nowMs
    ? p
    : null;
};
export const hasMaintenanceAuthority = async (db, caller, nowMs) => {
  const p = await accountPolicy(db, caller.accountId, nowMs);
  return (
    Array.isArray(p?.roles) &&
    p.roles.some((role) => ["MAP_ADMIN", "MAP_MAINTAINER"].includes(role))
  );
};

export const consumeRate = async (db, caller, operation, nowMs) => {
  const window = Math.floor(nowMs / 60_000);
  const id = `rate:${hash(caller.digest, operation)}`;
  const limit = operation === "detail" ? 60 : 30;
  if (operation === "query" || operation === "detail") {
    const c = db.collection("mapControlState");
    const data = {
      kind: "RATE",
      window,
      count: 1,
      expiresAt: new Date((window + 1) * 60_000).toISOString(),
    };
    // Public reads share one account counter. Conditional atomic updates avoid
    // transaction contention without relaxing its durable, exact quota.
    for (let attempt = 0; attempt < 3; attempt++) {
      const rate = await read(c, id);
      if (!rate) {
        try {
          await c.add({ data: { _id: id, ...data } });
          return true;
        } catch (error) {
          if (
            !/duplicate|already exists|E11000/iu.test(
              String(error?.message ?? error),
            )
          )
            throw error;
          continue;
        }
      }
      if (
        rate.kind !== "RATE" ||
        !Number.isSafeInteger(rate.window) ||
        rate.window > window ||
        !Number.isSafeInteger(rate.count) ||
        rate.count < 0
      )
        return false;
      if (rate.window === window && rate.count >= limit) return false;
      const result = await c
        .where({
          _id: id,
          kind: "RATE",
          window: rate.window,
          count: rate.window === window ? db.command.lt(limit) : rate.count,
        })
        .update({
          data: rate.window === window ? { count: db.command.inc(1) } : data,
        });
      const updated = result?.stats?.updated ?? result?.updated;
      if (updated === 1) return true;
      if (updated !== 0) throw new Error("READ_RATE_UPDATE_RECEIPT_INVALID");
    }
    throw new Error("READ_RATE_CAS_RETRY_EXHAUSTED");
  }
  return db.runTransaction(async (tx) => {
    const c = tx.collection("mapControlState");
    const rate = await read(c, id);
    const count = rate?.window === window ? rate.count : 0;
    if (!Number.isSafeInteger(count) || count < 0) return false;
    if (count >= limit) return false;
    await put(c, id, {
      kind: "RATE",
      window,
      count: count + 1,
      expiresAt: new Date((window + 1) * 60_000).toISOString(),
    });
    return true;
  });
};

export const readControl = async (db, parallel = false) => {
  const c = db.collection("mapControlState");
  // CloudBase may reject concurrent doc reads in a function transaction with
  // -501001. Keep the same snapshot checks and issue each read sequentially.
  const ids = [
    "global:read-stop",
    "global:read-epoch",
    "global:features",
    "global:policy",
  ];
  // Only explicitly selected ordinary reads may overlap. The transaction
  // capability never exposes runTransaction, so its reads remain sequential.
  const [stop, epoch, features, policy] =
    parallel && typeof db.runTransaction === "function"
      ? await Promise.all(ids.map((id) => read(c, id)))
      : [
          await read(c, ids[0]),
          await read(c, ids[1]),
          await read(c, ids[2]),
          await read(c, ids[3]),
        ];
  if (
    stop?.stopped !== false ||
    !Number.isSafeInteger(epoch?.epoch) ||
    epoch.epoch < 1 ||
    features?.kind !== "FEATURES" ||
    policy?.kind !== "POLICY"
  )
    return null;
  return {
    epoch: epoch.epoch,
    mutationRevision: epoch.mutationRevision ?? 0,
    features,
    policy,
  };
};
export const invalidateEpoch = async (tx) => {
  const c = tx.collection("mapControlState");
  const epoch = await read(c, "global:read-epoch");
  if (!Number.isSafeInteger(epoch?.epoch) || epoch.epoch < 1)
    throw new Error("CONTROL_UNAVAILABLE");
  await put(c, "global:read-epoch", {
    ...epoch,
    kind: "READ_EPOCH",
    epoch: epoch.epoch + 1,
  });
};
export const audit = async (tx, caller, operation, actionId, result, nowMs) =>
  put(
    tx.collection("mapAuditEvents"),
    hash(caller.digest, operation, actionId),
    {
      kind: "COMMAND_RECEIPT",
      actorDigest: caller.digest,
      operation,
      actionHash: hash(actionId),
      result,
      createdAt: new Date(nowMs).toISOString(),
      policyVersion: "map-production-phase1-v1",
    },
  );
