export const shadowDb = (seed = {}) => {
  const tables = new Map(
    Object.entries(seed).map(([name, docs]) => [
      name,
      new Map(Object.entries(docs)),
    ]),
  );
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
  class Polygon {
    constructor(points) {
      this.points = points;
    }
  }
  class LineString {
    constructor(points) {
      this.points = points;
    }
  }
  const query = (
    name,
    conditions = {},
    offset = 0,
    max = 100,
    order = null,
  ) => ({
    where: (next) => query(name, next, offset, max, order),
    skip: (next) => query(name, conditions, next, max, order),
    limit: (next) => query(name, conditions, offset, next, order),
    orderBy: (field, direction) =>
      query(name, conditions, offset, max, [field, direction]),
    get: async () => {
      let rows = [...table(name).values()].filter((value) =>
        Object.entries(conditions).every(([key, expected]) => {
          if (expected?.geo) return true;
          return value[key] === expected;
        }),
      );
      if (order)
        rows = rows.sort((a, b) =>
          order[1] === "desc"
            ? b[order[0]] - a[order[0]]
            : a[order[0]] - b[order[0]],
        );
      return {
        data: rows
          .slice(offset, offset + max)
          .map((value) => structuredClone(value)),
      };
    },
  });
  const collection = (name) => ({
    ...query(name),
    doc: (id) => ({
      get: async () => {
        if (!table(name).has(id)) throw new Error("document not found");
        return { data: structuredClone(table(name).get(id)) };
      },
      set: async ({ data }) => {
        table(name).set(id, structuredClone(data));
      },
    }),
  });
  const db = {
    collection,
    runTransaction: async (callback) => callback(db),
    Geo: { Point, Polygon, LineString },
    command: {
      geoWithin: (value) => ({ geo: value }),
      geoNear: (value) => ({ geo: value }),
    },
  };
  return { db, tables, table };
};
