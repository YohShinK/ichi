import {
  CandidatePublicMapService,
  getWxCandidateEnvVersion,
  type CandidateCloudApi,
} from "./public-map-candidate-service.js";
import type {
  CandidateUploadView,
  MapContributionConsentView,
} from "./candidate-upload-service.js";
import {
  SharedUploadAuthorizationQueue,
  type SharingIntentStorage,
} from "./map-upload-sharing.js";

export const PRODUCTION_MAP_TERMS = {
  version: "map-contribution-20261003-v3",
  scopeDigest:
    "5242636e393cec66b6a1ce75abe3dd3aa7817a3f1eeb68992d54f2c1c83767d6",
} as const;
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
export const UPLOAD_SHARING_DISCLOSURE_VERSION =
  "upload-confirmation-map-sharing-20261003-v2";
export class ProductionMapContributionService {
  private readonly sharingQueue: SharedUploadAuthorizationQueue;
  private readonly acknowledgedUploads = new Set<string>();
  constructor(
    private readonly api: CandidateCloudApi | null,
    storage: SharingIntentStorage | null = null,
  ) {
    this.sharingQueue = new SharedUploadAuthorizationQueue(
      storage,
      `ichi.map-shared-uploads.${PRODUCTION_MAP_TERMS.version}.${PRODUCTION_MAP_TERMS.scopeDigest}`,
      async (recordId) => {
        const r = await this.call("finalize-board-observation", {
          action: "confirm-upload-sharing",
          recordId,
          uploadSharing: {
            disclosureVersion: UPLOAD_SHARING_DISCLOSURE_VERSION,
            rightsAttested: true,
          },
        });
        const saved =
          record(r) &&
          r.ok === true &&
          record(r.data) &&
          r.data.recordId === recordId &&
          r.data.uploadSharingAcknowledged === true;
        if (saved) this.acknowledgedUploads.add(recordId);
        return saved;
      },
    );
  }
  rememberSharedUpload(recordId: string): boolean {
    this.acknowledgedUploads.delete(recordId);
    return this.sharingQueue.remember(recordId);
  }
  sharedUploadAcknowledged(recordId: string): boolean {
    return this.acknowledgedUploads.has(recordId);
  }
  acknowledgeServerUpload(recordId: string): void {
    this.acknowledgedUploads.add(recordId);
  }
  flushSharedUploads(): Promise<void> {
    return this.sharingQueue.flush();
  }
  private async call(
    name: string,
    data: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      return (await this.api?.callFunction({ name, data }))?.result ?? null;
    } catch {
      return null;
    }
  }
  private metadataSync: Promise<void> | null = null;
  private syncOwnedMapMetadata(): void {
    if (this.metadataSync) return;
    this.metadataSync = (async () => {
      for (let n = 0; n < 10; n++) {
        const r = await this.call("bind-wechat-profile", {
          action: "sync-map-metadata",
        });
        if (
          !record(r) ||
          r.ok !== true ||
          !record(r.data) ||
          r.data.deferred === true ||
          r.data.hasMore !== true
        )
          break;
      }
    })().finally(() => {
      this.metadataSync = null;
    });
  }
  async getMapContributionConsent(): Promise<MapContributionConsentView | null> {
    let r = await this.call("manage-map-contribution-consent", {
      command: "GET",
    });
    // A transient CloudBase failure must not turn a valid terms policy into a
    // persistent unavailable screen. Only the read retries; ACCEPT never does.
    if (
      r === null ||
      (record(r) && r.ok === false && r.code === "SERVICE_UNAVAILABLE")
    )
      r = await this.call("manage-map-contribution-consent", {
        command: "GET",
      });
    if (
      !record(r) ||
      r.ok !== true ||
      r.termsVersion !== PRODUCTION_MAP_TERMS.version ||
      r.scopeDigest !== PRODUCTION_MAP_TERMS.scopeDigest ||
      typeof r.accepted !== "boolean"
    )
      return null;
    if (r.accepted) this.syncOwnedMapMetadata();
    return {
      termsVersion: r.termsVersion,
      scopeDigest: r.scopeDigest,
      accepted: r.accepted,
      acceptedAt: null,
      status: r.accepted ? "ACCEPTED" : "NOT_ACCEPTED",
    };
  }
  async acceptMapContributionTerms(
    current: MapContributionConsentView,
    actionId: string,
  ): Promise<boolean> {
    if (
      current.termsVersion !== PRODUCTION_MAP_TERMS.version ||
      current.scopeDigest !== PRODUCTION_MAP_TERMS.scopeDigest ||
      !/^[A-Za-z0-9_-]{8,128}$/u.test(actionId)
    )
      return false;
    const r = await this.call("manage-map-contribution-consent", {
      command: "ACCEPT",
      termsVersion: current.termsVersion,
      scopeDigest: current.scopeDigest,
      actionId,
    });
    const accepted =
      record(r) &&
      r.ok === true &&
      r.accepted === true &&
      r.termsVersion === current.termsVersion &&
      r.scopeDigest === current.scopeDigest;
    if (accepted) this.syncOwnedMapMetadata();
    return accepted;
  }
  // V1's existing records list and delete functions remain the record authority.
  async listMyUploads(): Promise<readonly CandidateUploadView[]> {
    return [];
  }
  async deleteMyUpload(recordRef: string, actionId: string): Promise<boolean> {
    void recordRef;
    void actionId;
    return false;
  }
  async submitSynthetic(): Promise<null> {
    return null;
  }
}
const cloudApi = (): CandidateCloudApi | null =>
  typeof wx !== "undefined" &&
  (wx as unknown as { cloud?: CandidateCloudApi }).cloud?.callFunction
    ? (wx as unknown as { cloud: CandidateCloudApi }).cloud
    : null;
export const createWxProductionPublicMapService =
  (): CandidatePublicMapService =>
    new CandidatePublicMapService(
      cloudApi(),
      getWxCandidateEnvVersion(),
      "production",
    );
export const createWxProductionContributionService =
  (): ProductionMapContributionService =>
    new ProductionMapContributionService(
      cloudApi(),
      typeof wx === "undefined"
        ? null
        : {
            getItem: (key) => {
              const value: unknown = wx.getStorageSync(key);
              if (!value) return null;
              if (typeof value !== "string") throw new Error("INVALID_STORAGE");
              return value;
            },
            setItem: (key, value) => wx.setStorageSync(key, value),
          },
    );
