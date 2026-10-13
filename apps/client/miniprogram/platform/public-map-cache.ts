import {
  clonePublicDetail,
  clonePublicMarker,
  publicLeadWithinDeadline,
  containsForbiddenPrivateMapField,
  type PublicDetail,
  type PublicMarker,
} from "./public-map-contract.js";

export const PUBLIC_MAP_CACHE_TTL_MS = 120_000;

export interface PublicMapCacheSnapshot {
  readonly queryIdentity: string;
  readonly schemaVersion: string;
  readonly asOf: string;
  readonly items: readonly PublicMarker[];
  readonly nextCursor: string | null;
  readonly truncated: boolean;
  readonly cachedAtMs: number;
  readonly stale: boolean;
}

interface StoredPublicMapSnapshot extends Omit<
  PublicMapCacheSnapshot,
  "stale"
> {
  readonly cursorExpiresAtMs: number;
}

export class PublicMapMemoryCache {
  readonly #snapshots = new Map<string, StoredPublicMapSnapshot>();
  readonly #details = new Map<string, PublicDetail>();
  readonly #ttlMs: number;

  constructor(ttlMs = PUBLIC_MAP_CACHE_TTL_MS) {
    this.#ttlMs = ttlMs;
  }

  writeSnapshot(input: {
    readonly queryIdentity: string;
    readonly schemaVersion: string;
    readonly asOf: string;
    readonly items: readonly PublicMarker[];
    readonly nextCursor: string | null;
    readonly truncated?: boolean;
    readonly cachedAtMs: number;
  }): void {
    const items = input.items.map(clonePublicMarker);
    if (containsForbiddenPrivateMapField(items))
      throw new Error("PRIVATE_MAP_CACHE_FIELD_REJECTED");
    this.#snapshots.set(input.queryIdentity, {
      queryIdentity: input.queryIdentity,
      schemaVersion: input.schemaVersion,
      asOf: input.asOf,
      items,
      nextCursor: input.nextCursor,
      truncated: input.truncated ?? false,
      cachedAtMs: input.cachedAtMs,
      cursorExpiresAtMs: input.cachedAtMs + this.#ttlMs,
    });
  }

  readSnapshot(
    queryIdentity: string,
    nowMs: number,
  ): PublicMapCacheSnapshot | null {
    const stored = this.#snapshots.get(queryIdentity);
    if (!stored) return null;
    const stale = nowMs >= stored.cachedAtMs + this.#ttlMs;
    return {
      queryIdentity: stored.queryIdentity,
      schemaVersion: stored.schemaVersion,
      asOf: stored.asOf,
      items: stored.items
        .filter((item) => publicLeadWithinDeadline(item, nowMs))
        .map(clonePublicMarker),
      nextCursor:
        stale || nowMs >= stored.cursorExpiresAtMs ? null : stored.nextCursor,
      truncated: stored.truncated,
      cachedAtMs: stored.cachedAtMs,
      stale,
    };
  }

  writeDetail(detail: PublicDetail): void {
    const safe = clonePublicDetail(detail);
    if (containsForbiddenPrivateMapField(safe))
      throw new Error("PRIVATE_MAP_CACHE_FIELD_REJECTED");
    this.#details.set(detail.publicLeadId, safe);
  }

  readDetail(publicLeadId: string, nowMs = Date.now()): PublicDetail | null {
    const detail = this.#details.get(publicLeadId);
    return detail && publicLeadWithinDeadline(detail, nowMs)
      ? clonePublicDetail(detail)
      : null;
  }

  invalidateDetail(publicLeadId: string): void {
    this.#details.delete(publicLeadId);
  }

  removePublicLead(publicLeadId: string): void {
    this.#details.delete(publicLeadId);
    for (const [queryIdentity, snapshot] of this.#snapshots) {
      const items = snapshot.items.filter(
        (item) => item.publicLeadId !== publicLeadId,
      );
      if (items.length === snapshot.items.length) continue;
      this.#snapshots.set(queryIdentity, { ...snapshot, items });
    }
  }
}
