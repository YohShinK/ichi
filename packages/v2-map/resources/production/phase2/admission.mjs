import { read, put, rows } from "../shared/security.mjs";
import { stable } from "./source.mjs";
import { signedRequest } from "./security.mjs";

export const V2_ADMISSION_CONTRACT = "V2_ADMISSION_AUTO_MAP_V1";
const keyOf = (name, id) => `${name}\0${id}`;
const formal = new Set([
  "boardObservations",
  "boardInstances",
  "boardAssociations",
  "mapContributions",
  "mapPlayerSourcePermissions",
  "publicMapLeads",
  "mapProjectionOutbox",
]);
const valueAt = (row, key) =>
  key.split(".").reduce((v, part) => v?.[part], row);

// SOURCE/RESOLVE/PROJECT execute privately before V2 admission. This database
// captures their complete read/write set without writing any real document.
export const admissionPreviewDatabase = (source) => {
  const originals = new Map(),
    writes = new Map();
  const original = async (name, id) => {
    const key = keyOf(name, id);
    if (!originals.has(key))
      originals.set(key, {
        name,
        id,
        data: await read(source.collection(name), id),
      });
    return originals.get(key).data;
  };
  const get = async (name, id) => {
    const key = keyOf(name, id);
    return writes.has(key) ? writes.get(key).data : original(name, id);
  };
  const collection = (name) => {
    const query = (raw, conditions = {}, limit = Infinity, sort = null) => ({
      where: (c) => query(raw.where(c), c, limit, sort),
      limit: (n) => query(raw.limit(n), conditions, n, sort),
      orderBy: (k, d) => query(raw.orderBy(k, d), conditions, limit, [k, d]),
      get: async () => {
        const values = new Map(
          rows(await raw.get()).map((row) => [row._id, row]),
        );
        for (const { name: changed, id, data } of writes.values()) {
          if (changed !== name) continue;
          // The only modified collection queried during admission is the
          // contribution set, with scalar equality filters. Never approximate
          // a geo/query operator for staged data.
          if (Object.values(conditions).some((v) => v && typeof v === "object"))
            throw new Error("STAGED_QUERY_OPERATOR_UNSUPPORTED");
          if (
            Object.entries(conditions).every(([k, v]) => valueAt(data, k) === v)
          )
            values.set(id, { ...data, _id: id });
          else values.delete(id);
        }
        const result = [...values.values()];
        if (sort)
          result.sort(
            (a, b) =>
              (valueAt(a, sort[0]) > valueAt(b, sort[0]) ? 1 : -1) *
              (sort[1] === "desc" ? -1 : 1),
          );
        return { data: result.slice(0, limit) };
      },
    });
    return {
      ...query(source.collection(name)),
      doc: (id) => ({
        get: async () => ({ data: await get(name, id) }),
        set: async ({ data }) => {
          await original(name, id);
          writes.set(keyOf(name, id), { name, id, data });
        },
      }),
    };
  };
  const db = {
    collection,
    Geo: source.Geo,
    command: source.command,
    runTransaction: async (work) => {
      const before = new Map(writes);
      try {
        return await work(db);
      } catch (error) {
        writes.clear();
        for (const [k, v] of before) writes.set(k, v);
        throw error;
      }
    },
  };
  return { db, originals, writes, get };
};

export const admitSourceAtomically = async ({
  db,
  env,
  before,
  work,
  nowMs,
  newId,
  stagedWorker,
  readControl,
}) => {
  const preview = admissionPreviewDatabase(db);
  const run = stagedWorker({
    cloud: { database: () => preview.db },
    env,
    now: () => nowMs,
    newId,
  });
  let current = work;
  for (let i = 0; i < 6 && current.status === "PENDING"; i++) {
    const result = await run(
      signedRequest(
        env.ICHI_V2_SOURCE_BRIDGE_HMAC_KEY,
        "PROCESS",
        work.eventId,
        nowMs,
      ),
    );
    if (!result.ok) throw new Error(result.code);
    current = await preview.get("mapSourceOutbox", work.eventId);
  }
  if (current.status === "PENDING")
    throw new Error("ADMISSION_DID_NOT_CONVERGE");
  const observationKey = current.observationVersionId
    ? keyOf("boardObservations", `observation:${current.observationVersionId}`)
    : null;
  const createdSource =
    observationKey &&
    preview.writes.has(observationKey) &&
    !preview.originals.get(observationKey)?.data;
  const published = [...preview.writes.values()].some(
    ({ name, data }) =>
      name === "publicMapLeads" &&
      data.kind === "HEAD" &&
      data.lifecycleState === "PUBLIC",
  );
  const admitted =
    current.status === "APPLIED" && !current.rejection && published;
  // Rejected new inputs stay in V1/operational work queues. For existing V2,
  // preserve automatic retirement/invalidation, but never leave a new source
  // waiting for an approval after V2 admission.
  if (createdSource && !admitted) {
    for (const [key, write] of preview.writes) {
      if (!formal.has(write.name)) continue;
      const previous = preview.originals.get(key)?.data;
      if (!previous) {
        preview.writes.delete(key);
        continue;
      }
      if (write.name === "boardObservations") {
        write.data =
          previous.kind === "LINEAGE_HEAD"
            ? { ...previous, lifecycleState: "SUPERSEDED" }
            : previous;
      } else if (write.name === "mapContributions") {
        write.data = {
          ...previous,
          lifecycle: "INVALIDATED",
          publicHideIntent: true,
        };
      } else if (write.name === "publicMapLeads") {
        write.data = {
          ...previous,
          lifecycleState: "HIDDEN",
          hideReason: "V1_TO_V2_ADMISSION_BLOCKED",
        };
      } else if (write.name === "boardInstances") {
        write.data = {
          ...previous,
          activePublicLeadId: null,
          activeServedVersion: 0,
          currentSupportObservationVersionId: null,
          retiredIds: [
            ...new Set([
              ...(previous.retiredIds ?? []),
              ...(previous.activePublicLeadId
                ? [previous.activePublicLeadId]
                : []),
            ]),
          ],
        };
      } else write.data = previous;
    }
    const stateKey = keyOf("mapSourceBridgeState", `source:${work.lineageId}`);
    const state = preview.writes.get(stateKey);
    if (state)
      state.data = {
        ...state.data,
        currentAuthorizedObservationId:
          preview.originals.get(stateKey)?.data
            ?.currentAuthorizedObservationId ?? null,
        admissionState: "BLOCKED",
        lastDecision:
          current.resolution ?? current.rejection ?? "V2_ADMISSION_NOT_PUBLIC",
      };
    current = {
      ...current,
      status: current.status === "MANUAL_REVIEW" ? "MANUAL_REVIEW" : "SKIPPED",
      rejection:
        current.resolution ?? current.rejection ?? "V2_ADMISSION_NOT_PUBLIC",
    };
    preview.writes.set(keyOf("mapSourceOutbox", work.eventId), {
      name: "mapSourceOutbox",
      id: work.eventId,
      data: current,
    });
  }
  const eventWrite = preview.writes.get(keyOf("mapSourceOutbox", work.eventId));
  if (eventWrite)
    eventWrite.data = {
      ...eventWrite.data,
      admissionContract: V2_ADMISSION_CONTRACT,
      admitted,
    };
  // The guarded CloudBase transaction has a hard 95-operation budget.
  if (preview.originals.size + preview.writes.size > 90)
    throw new Error("ADMISSION_TRANSACTION_BUDGET_EXCEEDED");
  return db.runTransaction(async (tx) => {
    const control = await readControl(tx);
    if (stable(control) !== stable(before))
      return { ok: false, code: "STALE_ADMISSION" };
    for (const { name, id, data } of preview.originals.values())
      if (stable(await read(tx.collection(name), id)) !== stable(data))
        return { ok: false, code: "STALE_ADMISSION" };
    for (const { name, id, data } of preview.writes.values())
      await put(tx.collection(name), id, data);
    return {
      ok: true,
      status: current.status,
      stage: current.stage,
      admitted,
      admissionContract: V2_ADMISSION_CONTRACT,
    };
  });
};
