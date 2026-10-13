export const localDatabase = (schemas = []) => {
  const tables = new Map();
  const accesses = [];
  let queue = Promise.resolve();
  let failWrite = null;
  let writes = 0;
  const table = (name) => {
    if (!tables.has(name)) tables.set(name, new Map());
    return tables.get(name);
  };
  class Point {
    constructor(longitude, latitude) {
      this.longitude = longitude;
      this.latitude = latitude;
    }
  }
  class LineString {
    constructor(points) {
      this.points = points;
    }
  }
  class Polygon {
    constructor(lines) {
      this.lines = lines;
    }
  }
  const property = (o, key) => key.split(".").reduce((v, k) => v?.[k], o);
  const matching = (row, key, v) => {
    if (v?.comparison === "gt") return property(row, key) > v.value;
    if (v?.comparison === "lt") return property(row, key) < v.value;
    if (v?.geo === "within") {
      const p = property(row, key);
      const points = v.geometry.lines[0].points;
      return (
        p &&
        p.longitude >= points[0].longitude &&
        p.longitude <= points[2].longitude &&
        p.latitude >= points[0].latitude &&
        p.latitude <= points[2].latitude
      );
    }
    if (v?.geo === "near") {
      const p = property(row, key);
      if (!p) return false;
      const dx = (p.longitude - v.geometry.longitude) * 95_000;
      const dy = (p.latitude - v.geometry.latitude) * 111_000;
      return Math.hypot(dx, dy) <= v.maxDistance;
    }
    return property(row, key) === v;
  };
  const query = (
    name,
    conditions = {},
    offset = 0,
    max = 100,
    sort = null,
  ) => ({
    where: (c) => query(name, c, offset, max, sort),
    skip: (n) => query(name, conditions, n, max, sort),
    limit: (n) => query(name, conditions, offset, n, sort),
    orderBy: (k, d) => query(name, conditions, offset, max, [k, d]),
    async update({ data }) {
      accesses.push({ name, operation: "update", conditions });
      let updated = 0;
      for (const [id, value] of table(name)) {
        if (
          !Object.entries(conditions).every(([k, e]) =>
            matching({ ...value, _id: id }, k, e),
          )
        )
          continue;
        writes += 1;
        if (failWrite === writes)
          throw new Error("injected crash before commit");
        const next = structuredClone(value);
        for (const [k, v] of Object.entries(data))
          next[k] =
            v?.update === "inc" ? next[k] + v.value : structuredClone(v);
        table(name).set(id, next);
        updated++;
      }
      return { stats: { updated } };
    },
    async get() {
      accesses.push({ name, operation: "query" });
      let values = [...table(name).entries()]
        .map(([id, v]) => ({ ...v, _id: id }))
        .filter((v) =>
          Object.entries(conditions).every(([k, e]) => matching(v, k, e)),
        );
      if (sort)
        values.sort(
          (a, b) =>
            (a[sort[0]] > b[sort[0]] ? 1 : -1) * (sort[1] === "desc" ? -1 : 1),
        );
      return { data: structuredClone(values.slice(offset, offset + max)) };
    },
  });
  const db = {
    Geo: { Point, LineString, Polygon },
    command: {
      gt: (value) => ({ comparison: "gt", value }),
      lt: (value) => ({ comparison: "lt", value }),
      inc: (value) => ({ update: "inc", value }),
      geoWithin: (v) => ({ geo: "within", ...v }),
      geoNear: (v) => ({ geo: "near", ...v }),
    },
    collection: (name) => ({
      ...query(name),
      add: async ({ data }) => {
        const { _id: id, ...value } = data;
        if (table(name).has(id)) throw new Error("E11000 duplicate key");
        writes += 1;
        if (failWrite === writes)
          throw new Error("injected crash before commit");
        accesses.push({ name, operation: "add", id });
        table(name).set(id, structuredClone(value));
        return { _id: id };
      },
      doc: (id) => ({
        get: async () => {
          accesses.push({ name, operation: "get", id });
          if (!table(name).has(id)) throw new Error("document not found");
          return { data: structuredClone(table(name).get(id)) };
        },
        set: async ({ data }) => {
          writes += 1;
          accesses.push({ name, operation: "set", id });
          if (failWrite === writes)
            throw new Error("injected crash before commit");
          for (const index of schemas.find((s) => s.name === name)?.indexes ??
            []) {
            if (!index.unique) continue;
            const keys = Object.keys(index.keys);
            if (
              [...table(name).entries()].some(
                ([otherId, row]) =>
                  otherId !== id &&
                  keys.every(
                    (key) =>
                      JSON.stringify(property(row, key) ?? null) ===
                      JSON.stringify(property(data, key) ?? null),
                  ),
              )
            )
              throw new Error(`UNIQUE_INDEX_CONFLICT:${name}:${index.name}`);
          }
          table(name).set(id, structuredClone(data));
        },
      }),
    }),
    runTransaction: (work) => {
      const result = queue.then(async () => {
        const before = structuredClone(tables);
        try {
          return await work({
            ...db,
            collection: (name) => ({ doc: db.collection(name).doc }),
          });
        } catch (error) {
          tables.clear();
          for (const [k, v] of before) tables.set(k, v);
          throw error;
        }
      });
      queue = result.catch(() => {});
      return result;
    },
  };
  return {
    db,
    table,
    tables,
    accesses,
    injectCrashAfter: (n) => {
      failWrite = writes + n;
    },
    clearCrash: () => {
      failWrite = null;
    },
  };
};
