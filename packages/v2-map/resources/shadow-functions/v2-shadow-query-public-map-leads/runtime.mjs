import { randomBytes } from "node:crypto";

import { PublicMapService } from "../../../src/public-api.js";
import { readDoc } from "../shared/db.mjs";
import {
  currentPublicRow,
  preparePublicRead,
  publicCore,
} from "../shared/public-read.mjs";
import { verifyCursorTag } from "../shared/security.mjs";

const fail = (code) => ({ ok: false, code });
const freshnessPolicy = {
  policyVersion: "v2-19-synthetic-freshness",
  recentMaxAgeMs: 3_600_000,
  agingMaxAgeMs: 86_400_000,
};
const snapshotDocId = (id) => `snapshot:${id}`;
const validBbox = (bbox) =>
  bbox &&
  Number.isFinite(bbox.west) &&
  Number.isFinite(bbox.east) &&
  Number.isFinite(bbox.south) &&
  Number.isFinite(bbox.north) &&
  bbox.west >= -180 &&
  bbox.east <= 180 &&
  bbox.south >= -90 &&
  bbox.north <= 90 &&
  bbox.west < bbox.east &&
  bbox.south < bbox.north;

const parseCursor = (cursor, secret) => {
  if (typeof cursor !== "string" || cursor.length > 256) return null;
  const [id, offset, tag, extra] = cursor.split(".");
  if (
    extra ||
    !/^[a-f0-9]{32}$/u.test(id || "") ||
    !Number.isSafeInteger(Number(offset)) ||
    Number(offset) < 0 ||
    !verifyCursorTag(`${id}.${offset}`, tag, secret)
  )
    return null;
  return id;
};

const fetchGeoCandidates = async (db, bbox) => {
  const polygon = new db.Geo.Polygon([
    new db.Geo.LineString([
      new db.Geo.Point(bbox.west, bbox.south),
      new db.Geo.Point(bbox.east, bbox.south),
      new db.Geo.Point(bbox.east, bbox.north),
      new db.Geo.Point(bbox.west, bbox.north),
      new db.Geo.Point(bbox.west, bbox.south),
    ]),
  ]);
  const rows = [];
  for (let offset = 0; offset <= 500; offset += 100) {
    const result = await db
      .collection("v2ShadowPublicMapLeads")
      .where({
        lifecycleState: "PUBLIC",
        "publicLocation.point": db.command.geoWithin({ geometry: polygon }),
      })
      .skip(offset)
      .limit(Math.min(100, 501 - offset))
      .get();
    const batch = Array.isArray(result?.data) ? result.data : [];
    rows.push(...batch);
    if (batch.length < Math.min(100, 501 - offset)) break;
  }
  return rows.filter((row) => {
    const p = row.publicLocation;
    return (
      p &&
      p.coordinateSystem === "GCJ02" &&
      p.longitude >= bbox.west &&
      p.longitude <= bbox.east &&
      p.latitude >= bbox.south &&
      p.latitude <= bbox.north
    );
  });
};

const createUnsafeMain =
  ({
    cloud,
    env,
    now = Date.now,
    newId = () => randomBytes(16).toString("hex"),
  }) =>
  async (event = {}) => {
    const prepared = await preparePublicRead({
      cloud,
      env,
      kind: "query",
      nowMs: now(),
    });
    if (!prepared.ok) return prepared;
    const { db, callerDigest, epoch } = prepared;
    if (!validBbox(event.bbox)) return fail("INVALID_VIEWPORT");
    if (
      !Number.isSafeInteger(event.limit) ||
      event.limit < 1 ||
      event.limit > 50
    ) {
      return fail("INVALID_REQUEST");
    }
    const secret = env.ICHI_V2_SHADOW_CURSOR_HMAC_KEY;
    let stored = null;
    const cursor = event.cursor ?? null;
    if (cursor !== null) {
      const id = parseCursor(cursor, secret);
      if (!id) return fail("CURSOR_INVALID");
      stored = await readDoc(
        db.collection("v2ShadowPublicMapQuerySnapshots"),
        snapshotDocId(id),
      );
      if (!stored || stored.expiresAtMs <= now()) return fail("CURSOR_EXPIRED");
      if (
        stored.epoch !== epoch ||
        stored.dataOrigin !== "SYNTHETIC_REHEARSAL"
      ) {
        return fail("CURSOR_INVALID");
      }
    }
    const versions = new Map();
    const current = new Map();
    if (!stored) {
      const rows = await fetchGeoCandidates(db, event.bbox);
      for (const row of rows) {
        const core = publicCore(row, prepared.opportunityPolicyVersion);
        if (core) {
          versions.set(`${core.publicLeadId}:${core.servedVersion}`, core);
          current.set(core.publicLeadId, core);
        }
      }
    } else {
      const [, offsetText] = cursor.split(".");
      const offset = Number(offsetText);
      for (const ref of stored.refs.slice(offset, offset + event.limit)) {
        const version = await readDoc(
          db.collection("v2ShadowPublicMapLeads"),
          `lead:${ref.publicLeadId}:${ref.servedVersion}`,
        );
        const latest = await currentPublicRow(db, ref.publicLeadId);
        const served = publicCore(version, prepared.opportunityPolicyVersion);
        const visible = publicCore(latest, prepared.opportunityPolicyVersion);
        if (served)
          versions.set(`${ref.publicLeadId}:${ref.servedVersion}`, served);
        if (visible) current.set(ref.publicLeadId, visible);
      }
    }
    let toPersist = null;
    const snapshots = {
      save: (value) => {
        toPersist = value;
      },
      get: (id) => (id === stored?.snapshotId ? stored : null),
      invalidate: () => {},
    };
    const service = new PublicMapService(
      {
        listVisibleWithin: () => [...current.values()],
        getVersion: (id, version) => versions.get(`${id}:${version}`) ?? null,
        getCurrent: (id) => current.get(id) ?? null,
      },
      snapshots,
      freshnessPolicy,
      {
        account: { currentAccount: () => ({ accountId: callerDigest }) },
        readControl: { readState: () => "ENABLED" },
        rateLimit: { consume: () => "ALLOWED" },
        cursorSecret: { currentSecret: () => secret },
      },
      undefined,
      now,
      newId,
    );
    const response = service.query({
      ...event,
      cursor,
      asOf: event.asOf ?? null,
    });
    if (!response.ok) return response;
    if (toPersist) {
      await db
        .collection("v2ShadowPublicMapQuerySnapshots")
        .doc(snapshotDocId(toPersist.snapshotId))
        .set({
          data: {
            ...toPersist,
            epoch,
            expiresAt: new Date(toPersist.expiresAtMs).toISOString(),
            dataOrigin: "SYNTHETIC_REHEARSAL",
          },
        });
    }
    const after = await readDoc(
      db.collection("v2ShadowControlState"),
      "global:read-epoch",
    );
    const stop = await readDoc(
      db.collection("v2ShadowControlState"),
      "global:read-stop",
    );
    if (after?.epoch !== epoch || stop?.stopped !== false)
      return fail("SERVICE_UNAVAILABLE");
    return response;
  };

export const createMain =
  (dependencies) =>
  async (event = {}) => {
    try {
      return await createUnsafeMain(dependencies)(event);
    } catch {
      return fail("SERVICE_UNAVAILABLE");
    }
  };
