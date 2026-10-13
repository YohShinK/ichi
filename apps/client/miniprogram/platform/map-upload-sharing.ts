export interface SharingIntentStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

// Only an explicit upload confirmation adds an intent. Consent and history reads
// never create one. Keep it across verification, network failures and app restarts.
export class SharedUploadAuthorizationQueue {
  private flushing: Promise<void> | null = null;
  private queuedFlush: Promise<void> | null = null;
  constructor(
    private readonly storage: SharingIntentStorage | null,
    private readonly key: string,
    private readonly authorize: (recordId: string) => Promise<boolean>,
  ) {}
  private ids(): string[] {
    const data: unknown = JSON.parse(this.storage?.getItem(this.key) || "[]");
    if (!Array.isArray(data) || data.length > 250)
      throw new Error("INVALID_SHARING_INTENTS");
    return [...new Set(data)].filter(
      (id): id is string =>
        typeof id === "string" && /^record_[a-f0-9]{32}$/u.test(id),
    );
  }
  remember(recordId: string): boolean {
    if (!this.storage || !/^record_[a-f0-9]{32}$/u.test(recordId)) return false;
    try {
      const ids = this.ids();
      if (ids.includes(recordId)) return true;
      if (ids.length >= 250) return false;
      this.storage.setItem(this.key, JSON.stringify([...ids, recordId]));
      return true;
    } catch {
      return false;
    }
  }
  flush(): Promise<void> {
    if (this.flushing) {
      // Verification can finish after this batch already read an unverified
      // source. Coalesce concurrent triggers into a fresh, serial batch.
      if (!this.queuedFlush) {
        this.queuedFlush = this.flushing.then(() => {
          this.queuedFlush = null;
          return this.flushing ?? this.flush();
        });
      }
      return this.queuedFlush;
    }
    this.flushing = this.drain().finally(() => {
      this.flushing = null;
    });
    return this.flushing;
  }
  private async drain(): Promise<void> {
    if (!this.storage) return;
    try {
      for (const id of this.ids().slice(0, 20)) {
        const authorized = await this.authorize(id);
        // Reread to preserve an upload confirmed while this request was pending.
        const remaining = this.ids().filter((pending) => pending !== id);
        // Pending sources must not permanently block records after the first 20.
        this.storage.setItem(
          this.key,
          JSON.stringify(authorized ? remaining : [...remaining, id]),
        );
      }
    } catch {
      // A failed write retains the intent. A later trusted GET handles replay.
    }
  }
}
