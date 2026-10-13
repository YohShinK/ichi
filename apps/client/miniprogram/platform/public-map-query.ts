import {
  PUBLIC_MAP_SCHEMA_VERSION,
  PUBLIC_MAP_NETWORK_SCHEMA_VERSION,
  type PublicMapQuery,
  PUBLIC_OPPORTUNITY_STATUSES,
  type PublicViewportRequest,
} from "./public-map-contract.js";

const OPPORTUNITY_ORDER = PUBLIC_OPPORTUNITY_STATUSES;

const normalizeCoordinate = (value: number): number => Number(value.toFixed(6));

export const normalizePublicMapQuery = (
  query: PublicMapQuery,
): PublicMapQuery => {
  const selected = new Set(query.opportunityStatuses);
  return {
    bbox: {
      west: normalizeCoordinate(query.bbox.west),
      south: normalizeCoordinate(query.bbox.south),
      east: normalizeCoordinate(query.bbox.east),
      north: normalizeCoordinate(query.bbox.north),
    },
    zoom: Number(query.zoom.toFixed(2)),
    mode: query.mode,
    opportunityStatuses: OPPORTUNITY_ORDER.filter((level) =>
      selected.has(level),
    ),
    includeLowFreshness: query.includeLowFreshness,
    supportedSchemaVersions: [...new Set(query.supportedSchemaVersions)].sort(),
  };
};

export const createPublicMapQueryIdentity = (query: PublicMapQuery): string =>
  JSON.stringify(normalizePublicMapQuery(query));

export const createDefaultPublicMapQuery = (): PublicMapQuery => ({
  bbox: {
    west: 121.38,
    south: 31.14,
    east: 121.58,
    north: 31.3,
  },
  zoom: 12,
  mode: "MAP",
  opportunityStatuses: [],
  includeLowFreshness: true,
  supportedSchemaVersions: [
    PUBLIC_MAP_SCHEMA_VERSION,
    PUBLIC_MAP_NETWORK_SCHEMA_VERSION,
  ],
});

export const createPublicViewportRequest = (input: {
  readonly query: PublicMapQuery;
  readonly limit: number;
  readonly cursor: string | null;
  readonly asOf: string | null;
  readonly requestId: string;
  readonly generation: number;
}): PublicViewportRequest => ({
  ...normalizePublicMapQuery(input.query),
  limit: input.limit,
  cursor: input.cursor,
  asOf: input.asOf,
  requestId: input.requestId,
  generation: input.generation,
});
