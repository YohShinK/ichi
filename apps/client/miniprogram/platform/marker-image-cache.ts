export interface MarkerImageAsset {
  readonly renderKey: string;
  readonly iconPath: string;
  readonly width: number;
  readonly height: number;
  readonly anchor: {
    readonly x: number;
    readonly y: number;
  };
}

/**
 * Small in-memory LRU for generated marker files. The key belongs to the
 * visual state only; callers must never include coordinates or camera scale.
 */
export class MarkerImageCache {
  private readonly values = new Map<string, MarkerImageAsset>();
  private readonly pending = new Map<string, Promise<MarkerImageAsset>>();
  private hits = 0;
  private misses = 0;
  private coalesced = 0;
  private pendingPeak = 0;

  get diagnostics() {
    return {
      hits: this.hits,
      misses: this.misses,
      coalesced: this.coalesced,
      entries: this.values.size,
      pending: this.pending.size,
      pendingPeak: this.pendingPeak,
    };
  }

  constructor(private readonly maximumEntries = 192) {}

  get size(): number {
    return this.values.size;
  }

  has(renderKey: string): boolean {
    return this.values.has(renderKey);
  }

  getOrCreate(
    renderKey: string,
    create: () => Promise<MarkerImageAsset>,
  ): Promise<MarkerImageAsset> {
    const cached = this.values.get(renderKey);
    if (cached) {
      this.hits += 1;
      this.values.delete(renderKey);
      this.values.set(renderKey, cached);
      return Promise.resolve(cached);
    }
    const inFlight = this.pending.get(renderKey);
    if (inFlight) {
      this.coalesced += 1;
      return inFlight;
    }

    this.misses += 1;

    const request = create()
      .then((asset) => {
        if (asset.renderKey !== renderKey)
          throw new Error("marker-image-cache:render-key-mismatch");
        this.values.set(renderKey, asset);
        while (this.values.size > this.maximumEntries) {
          const oldest = this.values.keys().next().value as string | undefined;
          if (oldest === undefined) break;
          this.values.delete(oldest);
        }
        return asset;
      })
      .finally(() => {
        this.pending.delete(renderKey);
      });
    this.pending.set(renderKey, request);
    this.pendingPeak = Math.max(this.pendingPeak, this.pending.size);
    return request;
  }

  clear(): void {
    this.values.clear();
    this.pending.clear();
  }

  /** Benchmark counters only; leaves cached files and in-flight work intact. */
  resetDiagnostics(): void {
    this.hits = 0;
    this.misses = 0;
    this.coalesced = 0;
    this.pendingPeak = this.pending.size;
  }
}
