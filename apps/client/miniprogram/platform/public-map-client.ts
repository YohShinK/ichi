import {
  clonePublicDetail,
  clonePublicMarker,
  publicLeadWithinDeadline,
  type PublicDetail,
  type PublicDetailRequest,
  type PublicDetailResult,
  type PublicMapError,
  type PublicMapErrorCode,
  type PublicMapQuery,
  type PublicMapService,
  type PublicMarker,
} from "./public-map-contract.js";
import {
  PublicMapMemoryCache,
  PUBLIC_MAP_CACHE_TTL_MS,
} from "./public-map-cache.js";
import {
  createPublicMapQueryIdentity,
  createPublicViewportRequest,
  normalizePublicMapQuery,
} from "./public-map-query.js";

export type PublicMapPhase =
  | "INITIAL_IDLE"
  | "INITIAL_LOADING"
  | "LOADED"
  | "EMPTY"
  | "INITIAL_ERROR"
  | "REFRESHING"
  | "VIEWPORT_REFRESHING"
  | "PAGINATING"
  | "PAGINATION_ERROR"
  | "STALE_CACHE"
  | "RATE_LIMITED"
  | "SERVICE_UNAVAILABLE"
  | "SCHEMA_UNSUPPORTED"
  | "UNAUTHORIZED"
  | "CURSOR_RECOVERY";

export type PublicDetailPhase =
  "IDLE" | "LOADING" | "LOADED" | "ERROR" | "UNAVAILABLE";

export interface PublicMapClientError {
  readonly code: PublicMapErrorCode;
  readonly message: string;
  readonly recovery:
    | "RETRY"
    | "RETRY_AFTER"
    | "RECOVER_IDENTITY"
    | "FRESH_QUERY"
    | "DISMISS_DETAIL"
    | "NONE";
  readonly retryAfterSeconds: number | null;
  readonly retainsData: boolean;
}

export interface PublicMapDetailState {
  readonly phase: PublicDetailPhase;
  readonly selectedPublicLeadId: string | null;
  readonly selectionGeneration: number;
  readonly item: PublicDetail | null;
  readonly error: PublicMapClientError | null;
}

export interface PublicMapClientState {
  readonly phase: PublicMapPhase;
  readonly query: PublicMapQuery;
  readonly queryIdentity: string;
  readonly generation: number;
  readonly items: readonly PublicMarker[];
  readonly nextCursor: string | null;
  readonly truncated: boolean;
  readonly serverAsOf: string | null;
  readonly schemaVersion: string | null;
  readonly cacheUpdatedAtMs: number | null;
  readonly clientCacheStale: boolean;
  readonly error: PublicMapClientError | null;
  readonly detail: PublicMapDetailState;
}

type StateListener = (state: PublicMapClientState) => void;

export const PUBLIC_MAP_PREPARED_DETAIL_TTL_MS = PUBLIC_MAP_CACHE_TTL_MS;
export const PUBLIC_MAP_PREPARED_DETAIL_LIMIT = 16;
interface PreparedPublicDetail {
  readonly item: PublicDetail;
  readonly receivedAtMs: number;
  readonly generation: number;
  readonly preparationGeneration: number;
}
interface PreparedDetailRequest {
  readonly generation: number;
  readonly preparationGeneration: number;
  readonly promise: Promise<PublicDetailResult | null>;
}

const initialDetailState = (): PublicMapDetailState => ({
  phase: "IDLE",
  selectedPublicLeadId: null,
  selectionGeneration: 0,
  item: null,
  error: null,
});

const phaseForInitialError = (code: PublicMapErrorCode): PublicMapPhase => {
  switch (code) {
    case "UNAUTHORIZED":
      return "UNAUTHORIZED";
    case "RATE_LIMITED":
      return "RATE_LIMITED";
    case "SERVICE_UNAVAILABLE":
      return "SERVICE_UNAVAILABLE";
    case "SCHEMA_UNSUPPORTED":
      return "SCHEMA_UNSUPPORTED";
    default:
      return "INITIAL_ERROR";
  }
};

export const mapPublicMapError = (
  error: PublicMapError,
  context: "INITIAL" | "REFRESH" | "PAGINATION" | "DETAIL",
  retainsData: boolean,
): PublicMapClientError => {
  const mapping: Record<
    PublicMapErrorCode,
    Pick<PublicMapClientError, "message" | "recovery">
  > = {
    INVALID_REQUEST: { message: "请求暂时无法处理。", recovery: "RETRY" },
    INVALID_VIEWPORT: {
      message: "当前地图范围无效，请重新选择范围。",
      recovery: "FRESH_QUERY",
    },
    UNAUTHORIZED: {
      message: "账号状态需要恢复后才能读取地图。",
      recovery: "RECOVER_IDENTITY",
    },
    RATE_LIMITED: {
      message: "请求较多，请稍后再试。",
      recovery: "RETRY_AFTER",
    },
    CURSOR_INVALID: {
      message: "分页位置已失效，正在重新载入。",
      recovery: "FRESH_QUERY",
    },
    CURSOR_EXPIRED: {
      message: "分页位置已过期，正在重新载入。",
      recovery: "FRESH_QUERY",
    },
    LEAD_UNAVAILABLE: {
      message: "这条线索已不可用。",
      recovery: "DISMISS_DETAIL",
    },
    SCHEMA_UNSUPPORTED: {
      message: "当前客户端版本暂不支持地图数据。",
      recovery: "NONE",
    },
    SERVICE_UNAVAILABLE: {
      message: "地图服务暂时不可用。",
      recovery: "RETRY",
    },
  };
  const selected = mapping[error.code];
  return {
    code: error.code,
    message: selected.message,
    recovery:
      context === "DETAIL" && error.code === "LEAD_UNAVAILABLE"
        ? "DISMISS_DETAIL"
        : selected.recovery,
    retryAfterSeconds: error.retryAfterSeconds,
    retainsData,
  };
};

const appendUniqueMarkers = (
  current: readonly PublicMarker[],
  incoming: readonly PublicMarker[],
): readonly PublicMarker[] => {
  const markers = new Map(
    current.map((marker) => [marker.publicLeadId, clonePublicMarker(marker)]),
  );
  for (const marker of incoming)
    markers.set(marker.publicLeadId, clonePublicMarker(marker));
  return [...markers.values()];
};

export class PublicMapClient {
  readonly #service: PublicMapService;
  readonly #cache: PublicMapMemoryCache;
  readonly #now: () => number;
  readonly #listeners = new Set<StateListener>();
  readonly #suppressedPublicLeadIds = new Set<string>();
  readonly #expiredNetworkVersions = new Map<string, number>();
  readonly #deletedPublicLeadIds = new Set<string>();
  readonly #pageLimit: number;
  readonly #preparedDetails = new Map<string, PreparedPublicDetail>();
  readonly #preparedDetailRequests = new Map<string, PreparedDetailRequest>();
  #preparationGeneration = 0;
  #generation = 0;
  #requestSequence = 0;
  #activePageRequestId: string | null = null;
  #selectionGeneration = 0;
  #activeDetailRequest: {
    readonly id: string;
    readonly promise: Promise<void>;
  } | null = null;
  readonly #onDetailTiming:
    | ((sample: {
        readonly requestToReceiveMs: number;
        readonly receiveToStateMs: number;
      }) => void)
    | undefined;
  #state: PublicMapClientState;
  #expiryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(input: {
    readonly service: PublicMapService;
    readonly initialQuery: PublicMapQuery;
    readonly cache?: PublicMapMemoryCache;
    readonly now?: () => number;
    readonly pageLimit?: number;
    /** Local timings only: the state commit does not prove native rendering. */
    readonly onDetailTiming?: (sample: {
      readonly requestToReceiveMs: number;
      readonly receiveToStateMs: number;
    }) => void;
  }) {
    const query = normalizePublicMapQuery(input.initialQuery);
    this.#service = input.service;
    this.#cache = input.cache ?? new PublicMapMemoryCache();
    this.#now = input.now ?? Date.now;
    this.#pageLimit = input.pageLimit ?? 50;
    this.#onDetailTiming = input.onDetailTiming;
    this.#state = {
      phase: "INITIAL_IDLE",
      query,
      queryIdentity: createPublicMapQueryIdentity(query),
      generation: 0,
      items: [],
      nextCursor: null,
      truncated: false,
      serverAsOf: null,
      schemaVersion: null,
      cacheUpdatedAtMs: null,
      clientCacheStale: false,
      error: null,
      detail: initialDetailState(),
    };
  }

  get state(): PublicMapClientState {
    this.#expireDeadlines();
    return this.#state;
  }

  subscribe(listener: StateListener): () => void {
    this.#listeners.add(listener);
    listener(this.#state);
    return () => this.#listeners.delete(listener);
  }

  suppressPublicLead(
    publicLeadId: string,
    options: { readonly noResurrection: boolean },
  ): void {
    this.#suppressedPublicLeadIds.add(publicLeadId);
    if (options.noResurrection) this.#deletedPublicLeadIds.add(publicLeadId);
    this.#cache.removePublicLead(publicLeadId);
    this.#preparedDetails.delete(publicLeadId);
    this.#preparedDetailRequests.delete(publicLeadId);
    const selected =
      this.#state.detail.selectedPublicLeadId === publicLeadId ||
      this.#state.detail.item?.publicLeadId === publicLeadId;
    if (selected) this.#selectionGeneration += 1;
    this.#setState({
      items: this.#withoutSuppressed(this.#state.items),
      ...(selected
        ? {
            detail: {
              phase: "UNAVAILABLE" as const,
              selectedPublicLeadId: null,
              selectionGeneration: this.#selectionGeneration,
              item: null,
              error: null,
            },
          }
        : {}),
    });
  }

  isDeletedPublicLead(publicLeadId: string): boolean {
    return this.#deletedPublicLeadIds.has(publicLeadId);
  }

  isPublicLeadUnavailable(publicLeadId: string): boolean {
    return (
      this.#suppressedPublicLeadIds.has(publicLeadId) ||
      (this.#expiredNetworkVersions.has(publicLeadId) &&
        !this.#state.items.some(
          (item) =>
            item.publicLeadId === publicLeadId && this.#withinDeadline(item),
        ))
    );
  }

  async loadInitial(): Promise<void> {
    if (this.#state.phase !== "INITIAL_IDLE") return;
    await this.#loadRoot(this.#state.query, "INITIAL");
  }

  async changeQuery(query: PublicMapQuery): Promise<void> {
    await this.#loadRoot(query, "QUERY_CHANGE");
  }

  async refresh(): Promise<void> {
    if (
      this.#state.phase === "INITIAL_LOADING" ||
      this.#state.phase === "REFRESHING" ||
      this.#state.phase === "CURSOR_RECOVERY"
    )
      return;
    await this.#loadRoot(this.#state.query, "REFRESH");
  }

  async recoverIdentity(): Promise<void> {
    if (
      this.#state.phase === "INITIAL_LOADING" ||
      this.#state.phase === "REFRESHING" ||
      this.#state.phase === "CURSOR_RECOVERY"
    )
      return;
    await this.#loadRoot(this.#state.query, "IDENTITY_RECOVERY");
  }

  async loadNextPage(): Promise<void> {
    const cursor = this.#state.nextCursor;
    if (!cursor || this.#state.phase === "PAGINATING") return;
    const generation = this.#generation;
    const queryIdentity = this.#state.queryIdentity;
    const requestId = this.#nextRequestId("page");
    this.#activePageRequestId = requestId;
    this.#setState({ phase: "PAGINATING", error: null });
    const result = await this.#service
      .query(
        createPublicViewportRequest({
          query: this.#state.query,
          limit: this.#pageLimit,
          cursor,
          asOf: this.#state.serverAsOf,
          requestId,
          generation,
        }),
      )
      .catch(() => this.#networkError(requestId, generation));
    if (
      generation !== this.#generation ||
      queryIdentity !== this.#state.queryIdentity ||
      requestId !== this.#activePageRequestId ||
      cursor !== this.#state.nextCursor
    )
      return;
    this.#activePageRequestId = null;
    if (!result.ok) {
      if (
        result.code === "CURSOR_INVALID" ||
        result.code === "CURSOR_EXPIRED"
      ) {
        this.#setState({
          phase: "CURSOR_RECOVERY",
          nextCursor: null,
          error: mapPublicMapError(result, "PAGINATION", true),
        });
        await this.#loadRoot(this.#state.query, "CURSOR_RECOVERY");
        return;
      }
      this.#setState({
        phase: "PAGINATION_ERROR",
        error: mapPublicMapError(result, "PAGINATION", true),
      });
      return;
    }
    const items = this.#withoutSuppressed(
      appendUniqueMarkers(this.#state.items, result.items),
    );
    this.#prepareQueryDetails(result.preparedDetails, items);
    this.#cache.writeSnapshot({
      queryIdentity,
      schemaVersion: result.schemaVersion,
      asOf: result.asOf,
      items,
      nextCursor: result.nextCursor,
      truncated: result.truncated,
      cachedAtMs: this.#now(),
    });
    this.#setState({
      phase: items.length === 0 ? "EMPTY" : "LOADED",
      items,
      nextCursor: result.nextCursor,
      truncated: result.truncated,
      serverAsOf: result.asOf,
      schemaVersion: result.schemaVersion,
      cacheUpdatedAtMs: this.#now(),
      clientCacheStale: false,
      error: null,
    });
  }

  async retryPagination(): Promise<void> {
    if (this.#state.phase !== "PAGINATION_ERROR") return;
    await this.loadNextPage();
  }

  /** Public-only preparation lives briefly in memory and never pre-opens a card. */
  async readLeadForPicker(
    publicLeadId: string,
    options: {
      readonly forceRefresh?: boolean;
      readonly allowRenderedLead?: boolean;
    } = {},
  ): Promise<PublicDetail | null> {
    const marker = this.#state.items.find(
      (item) => item.publicLeadId === publicLeadId,
    );
    if (
      (!marker && !options.allowRenderedLead) ||
      (marker && !this.#withinDeadline(marker)) ||
      this.#suppressedPublicLeadIds.has(publicLeadId)
    )
      return null;
    const active = this.#currentPreparedRequest(publicLeadId);
    if (!active && !options.forceRefresh) {
      const prepared = this.#readPreparedDetail(publicLeadId);
      if (prepared) return prepared;
    }
    const result = await (active?.promise ??
      this.#startPreparedDetailRead(
        publicLeadId,
        options.allowRenderedLead === true,
      ));
    return result?.ok ? clonePublicDetail(result.item) : null;
  }

  /** At most two visible leads, no queue or whole-map detail fan-out. */
  async prefetchVisibleDetails(ids: readonly string[]): Promise<void> {
    const capacity = Math.max(0, 2 - this.#preparedDetailRequests.size);
    const targets = [...new Set(ids)]
      .slice(0, 2)
      .filter(
        (id) =>
          this.#state.items.some((item) => item.publicLeadId === id) &&
          !this.#suppressedPublicLeadIds.has(id) &&
          !this.#readPreparedDetail(id) &&
          !this.#currentPreparedRequest(id),
      )
      .slice(0, capacity);
    await Promise.all(targets.map((id) => this.readLeadForPicker(id)));
  }

  invalidatePreparedDetails(): void {
    this.#preparationGeneration++;
    this.#preparedDetails.clear();
    this.#preparedDetailRequests.clear();
  }

  #currentPreparedRequest(id: string): PreparedDetailRequest | null {
    const active = this.#preparedDetailRequests.get(id);
    return active?.generation === this.#generation &&
      active.preparationGeneration === this.#preparationGeneration
      ? active
      : null;
  }

  #readPreparedDetail(id: string): PublicDetail | null {
    const prepared = this.#preparedDetails.get(id);
    const marker = this.#state.items.find((item) => item.publicLeadId === id);
    const age = prepared ? this.#now() - prepared.receivedAtMs : Infinity;
    if (
      !prepared ||
      !this.#withinDeadline(prepared.item) ||
      !marker ||
      this.#state.clientCacheStale ||
      this.#suppressedPublicLeadIds.has(id) ||
      prepared.generation !== this.#generation ||
      prepared.preparationGeneration !== this.#preparationGeneration ||
      age < 0 ||
      age >= PUBLIC_MAP_PREPARED_DETAIL_TTL_MS ||
      prepared.item.servedVersion < marker.servedVersion ||
      prepared.item.policyVersion !== marker.policyVersion ||
      prepared.item.projectionVersion !== marker.projectionVersion ||
      !this.#state.query.supportedSchemaVersions.includes(
        this.#state.schemaVersion ?? "",
      )
    ) {
      this.#preparedDetails.delete(id);
      return null;
    }
    return clonePublicDetail(prepared.item);
  }

  #storePreparedDetail(
    item: PublicDetail,
    generation: number,
    preparationGeneration: number,
    markers: readonly PublicMarker[] = this.#state.items,
  ): void {
    if (
      generation !== this.#generation ||
      preparationGeneration !== this.#preparationGeneration ||
      this.#suppressedPublicLeadIds.has(item.publicLeadId) ||
      !this.#withinDeadline(item) ||
      !markers.some((marker) => marker.publicLeadId === item.publicLeadId)
    )
      return;
    this.#preparedDetails.delete(item.publicLeadId);
    this.#preparedDetails.set(item.publicLeadId, {
      item: clonePublicDetail(item),
      receivedAtMs: this.#now(),
      generation,
      preparationGeneration,
    });
    while (this.#preparedDetails.size > PUBLIC_MAP_PREPARED_DETAIL_LIMIT)
      this.#preparedDetails.delete(this.#preparedDetails.keys().next().value!);
  }

  #prepareQueryDetails(
    details: readonly PublicDetail[] | undefined,
    markers: readonly PublicMarker[],
  ): void {
    if (!details || details.length > 2) return;
    for (const detail of details) {
      const marker = markers.find(
        (m) => m.publicLeadId === detail.publicLeadId,
      );
      if (
        !marker ||
        detail.servedVersion < marker.servedVersion ||
        detail.policyVersion !== marker.policyVersion ||
        detail.projectionVersion !== marker.projectionVersion ||
        this.#suppressedPublicLeadIds.has(detail.publicLeadId)
      )
        continue;
      this.#storePreparedDetail(
        detail,
        this.#generation,
        this.#preparationGeneration,
        markers,
      );
    }
  }

  #startPreparedDetailRead(
    publicLeadId: string,
    allowRenderedLead = false,
  ): Promise<PublicDetailResult | null> {
    const generation = this.#generation;
    const preparationGeneration = this.#preparationGeneration;
    const promise = this.#readPreparedDetailFromService(
      publicLeadId,
      generation,
      preparationGeneration,
      allowRenderedLead,
    );
    const active = { generation, preparationGeneration, promise };
    this.#preparedDetailRequests.set(publicLeadId, active);
    const clearActive = () => {
      if (this.#preparedDetailRequests.get(publicLeadId) === active)
        this.#preparedDetailRequests.delete(publicLeadId);
    };
    void promise.then(clearActive, clearActive);
    return promise;
  }

  async #readPreparedDetailFromService(
    publicLeadId: string,
    generation: number,
    preparationGeneration: number,
    allowRenderedLead: boolean,
  ): Promise<PublicDetailResult | null> {
    const requestId = this.#nextRequestId("detail");
    const request = {
      publicLeadId,
      requestId,
      generation,
      supportedSchemaVersions: [...this.#state.query.supportedSchemaVersions],
    };
    const isCurrent = () =>
      generation === this.#generation &&
      preparationGeneration === this.#preparationGeneration &&
      !this.#suppressedPublicLeadIds.has(publicLeadId);
    let result = await this.#service.detail(request).catch(() => null);
    if (
      (!result || (!result.ok && result.code === "SERVICE_UNAVAILABLE")) &&
      isCurrent()
    )
      result = await this.#service.detail(request).catch(() => null);
    const current = this.#state.items.find(
      (item) => item.publicLeadId === publicLeadId,
    );
    if (
      !result ||
      !isCurrent() ||
      (!current && !allowRenderedLead) ||
      result.requestId !== requestId ||
      result.generation !== generation
    )
      return null;
    if (!result.ok) {
      if (result.code === "LEAD_UNAVAILABLE") {
        if (current && !this.#withinDeadline(current)) this.#expireDeadlines();
        else this.suppressPublicLead(publicLeadId, { noResurrection: false });
      }
      return result;
    }
    if (
      result.item.publicLeadId !== publicLeadId ||
      (current &&
        (result.item.servedVersion < current.servedVersion ||
          result.item.policyVersion !== current.policyVersion ||
          result.item.projectionVersion !== current.projectionVersion)) ||
      !this.#state.query.supportedSchemaVersions.includes(result.schemaVersion)
    )
      return null;
    if (!this.#withinDeadline(result.item)) {
      this.#expiredNetworkVersions.set(
        publicLeadId,
        Math.max(
          result.item.servedVersion,
          this.#expiredNetworkVersions.get(publicLeadId) ?? -1,
        ),
      );
      this.#cache.removePublicLead(publicLeadId);
      this.#preparedDetails.delete(publicLeadId);
      this.#expireDeadlines();
      return null;
    }
    this.#storePreparedDetail(result.item, generation, preparationGeneration);
    return result;
  }

  selectLead(publicLeadId: string): Promise<void> {
    if (
      ["LOADING", "LOADED"].includes(this.#state.detail.phase) &&
      this.#state.detail.selectedPublicLeadId === publicLeadId &&
      this.#activeDetailRequest?.id === publicLeadId
    )
      return this.#activeDetailRequest.promise;
    const promise = this.#selectLead(publicLeadId);
    const active = { id: publicLeadId, promise };
    this.#activeDetailRequest = active;
    const clearActive = () => {
      if (this.#activeDetailRequest === active)
        this.#activeDetailRequest = null;
    };
    void promise.then(clearActive, clearActive);
    return promise;
  }

  async #selectLead(publicLeadId: string): Promise<void> {
    if (this.#suppressedPublicLeadIds.has(publicLeadId)) {
      this.#setState({
        detail: {
          phase: "UNAVAILABLE",
          selectedPublicLeadId: null,
          selectionGeneration: this.#selectionGeneration,
          item: null,
          error: null,
        },
      });
      return;
    }
    const selectionGeneration = ++this.#selectionGeneration;
    const rootGeneration = this.#generation;
    const preparationGeneration = this.#preparationGeneration;
    const prepared = this.#readPreparedDetail(publicLeadId);
    const shared = this.#currentPreparedRequest(publicLeadId);
    const requestId = this.#nextRequestId("detail");
    this.#setState({
      detail: {
        phase: prepared ? "LOADED" : "LOADING",
        selectedPublicLeadId: publicLeadId,
        selectionGeneration,
        item: prepared,
        error: null,
      },
    });
    const request: PublicDetailRequest = {
      publicLeadId,
      requestId,
      generation: selectionGeneration,
      supportedSchemaVersions: [...this.#state.query.supportedSchemaVersions],
    };
    const requestedAtMs = this.#now();
    let result = shared ? await shared.promise : null;
    if (
      !result &&
      selectionGeneration === this.#selectionGeneration &&
      this.#state.detail.selectedPublicLeadId === publicLeadId &&
      !this.#suppressedPublicLeadIds.has(publicLeadId)
    ) {
      result = await this.#service
        .detail(request)
        .catch(() => this.#networkError(requestId, selectionGeneration));
      if (
        result.requestId !== requestId ||
        result.generation !== selectionGeneration
      )
        result = this.#networkError(requestId, selectionGeneration);
    }
    if (!result) return;
    const receivedAtMs = this.#now();
    if (
      selectionGeneration !== this.#selectionGeneration ||
      this.#state.detail.selectedPublicLeadId !== publicLeadId ||
      this.#suppressedPublicLeadIds.has(publicLeadId)
    )
      return;
    if (!result.ok) {
      this.#preparedDetails.delete(publicLeadId);
      const error = mapPublicMapError(result, "DETAIL", false);
      if (result.code === "LEAD_UNAVAILABLE") {
        const marker = this.#state.items.find(
          (item) => item.publicLeadId === publicLeadId,
        );
        if (marker && !this.#withinDeadline(marker)) {
          this.#expireDeadlines();
          return;
        }
        this.#suppressedPublicLeadIds.add(publicLeadId);
        this.#cache.removePublicLead(publicLeadId);
        this.#setState({
          items: this.#withoutSuppressed(this.#state.items),
          detail: {
            phase: "UNAVAILABLE",
            selectedPublicLeadId: null,
            selectionGeneration,
            item: null,
            error,
          },
        });
        return;
      }
      this.#setState({
        detail: {
          phase: "ERROR",
          selectedPublicLeadId: publicLeadId,
          selectionGeneration,
          item: null,
          error,
        },
      });
      return;
    }
    const marker = this.#state.items.find(
      (item) => item.publicLeadId === publicLeadId,
    );
    if (
      !this.#withinDeadline(result.item) ||
      result.item.publicLeadId !== publicLeadId ||
      !this.#state.query.supportedSchemaVersions.includes(
        result.schemaVersion,
      ) ||
      (marker &&
        (result.item.servedVersion < marker.servedVersion ||
          result.item.policyVersion !== marker.policyVersion ||
          result.item.projectionVersion !== marker.projectionVersion))
    ) {
      this.#preparedDetails.delete(publicLeadId);
      this.#setState({
        detail: {
          phase: "ERROR",
          selectedPublicLeadId: publicLeadId,
          selectionGeneration,
          item: null,
          error: mapPublicMapError(
            this.#networkError(requestId, selectionGeneration),
            "DETAIL",
            false,
          ),
        },
      });
      return;
    }
    const item = clonePublicDetail(result.item);
    this.#storePreparedDetail(item, rootGeneration, preparationGeneration);
    this.#setState({
      detail: {
        phase: "LOADED",
        selectedPublicLeadId: publicLeadId,
        selectionGeneration,
        item,
        error: null,
      },
    });
    this.#onDetailTiming?.({
      requestToReceiveMs: Math.max(0, receivedAtMs - requestedAtMs),
      receiveToStateMs: Math.max(0, this.#now() - receivedAtMs),
    });
  }

  clearSelection(): void {
    this.#selectionGeneration += 1;
    this.#setState({
      detail: {
        ...initialDetailState(),
        selectionGeneration: this.#selectionGeneration,
      },
    });
  }

  async #loadRoot(
    queryInput: PublicMapQuery,
    reason:
      | "INITIAL"
      | "QUERY_CHANGE"
      | "REFRESH"
      | "CURSOR_RECOVERY"
      | "IDENTITY_RECOVERY",
  ): Promise<void> {
    const query = normalizePublicMapQuery(queryInput);
    const queryIdentity = createPublicMapQueryIdentity(query);
    const generation = ++this.#generation;
    this.invalidatePreparedDetails();
    const requestId = this.#nextRequestId("root");
    this.#activePageRequestId = null;
    const cached = this.#cache.readSnapshot(queryIdentity, this.#now());
    const sameQuery = queryIdentity === this.#state.queryIdentity;
    const hasCurrentItems = sameQuery && this.#state.items.length > 0;
    const retainedItems = this.#withoutSuppressed(
      hasCurrentItems ? this.#state.items : (cached?.items ?? []),
    );
    const retainedAsOf = hasCurrentItems
      ? this.#state.serverAsOf
      : (cached?.asOf ?? null);
    const hasRetainedData = retainedItems.length > 0;
    const phase: PublicMapPhase =
      reason === "CURSOR_RECOVERY"
        ? "CURSOR_RECOVERY"
        : reason === "QUERY_CHANGE"
          ? "VIEWPORT_REFRESHING"
          : reason === "REFRESH" || reason === "IDENTITY_RECOVERY"
            ? hasRetainedData
              ? "REFRESHING"
              : "INITIAL_LOADING"
            : hasRetainedData
              ? cached?.stale
                ? "STALE_CACHE"
                : "REFRESHING"
              : "INITIAL_LOADING";
    this.#setState({
      phase,
      query,
      queryIdentity,
      generation,
      items: retainedItems.map(clonePublicMarker),
      nextCursor: null,
      truncated: cached?.truncated ?? false,
      serverAsOf: retainedAsOf,
      schemaVersion: hasCurrentItems
        ? this.#state.schemaVersion
        : (cached?.schemaVersion ?? null),
      cacheUpdatedAtMs: hasCurrentItems
        ? this.#state.cacheUpdatedAtMs
        : (cached?.cachedAtMs ?? null),
      clientCacheStale: cached?.stale ?? false,
      error: null,
    });
    const result = await this.#service
      .query(
        createPublicViewportRequest({
          query,
          limit: this.#pageLimit,
          cursor: null,
          asOf: null,
          requestId,
          generation,
        }),
      )
      .catch(() => this.#networkError(requestId, generation));
    if (
      generation !== this.#generation ||
      queryIdentity !== this.#state.queryIdentity
    )
      return;
    if (!result.ok) {
      const retainsData = this.#state.items.length > 0;
      this.#setState({
        phase: retainsData ? "STALE_CACHE" : phaseForInitialError(result.code),
        clientCacheStale: retainsData,
        error: mapPublicMapError(
          result,
          reason === "REFRESH" ? "REFRESH" : "INITIAL",
          retainsData,
        ),
      });
      return;
    }
    const items = this.#withoutSuppressed(result.items);
    const cachedAtMs = this.#now();
    this.#prepareQueryDetails(result.preparedDetails, items);
    this.#cache.writeSnapshot({
      queryIdentity,
      schemaVersion: result.schemaVersion,
      asOf: result.asOf,
      items,
      nextCursor: result.nextCursor,
      truncated: result.truncated,
      cachedAtMs,
    });
    this.#setState({
      phase: items.length === 0 ? "EMPTY" : "LOADED",
      generation,
      items,
      nextCursor: result.nextCursor,
      truncated: result.truncated,
      serverAsOf: result.asOf,
      schemaVersion: result.schemaVersion,
      cacheUpdatedAtMs: cachedAtMs,
      clientCacheStale: false,
      error: null,
    });
  }

  #nextRequestId(kind: "root" | "page" | "detail"): string {
    this.#requestSequence += 1;
    return `v2-map-${kind}-${this.#requestSequence}`;
  }

  #networkError(requestId: string, generation: number): PublicMapError {
    return {
      ok: false,
      code: "SERVICE_UNAVAILABLE",
      requestId,
      generation,
      retryable: true,
      retryAfterSeconds: null,
    };
  }

  #withoutSuppressed(items: readonly PublicMarker[]): readonly PublicMarker[] {
    return items
      .filter(
        (item) =>
          !this.#suppressedPublicLeadIds.has(item.publicLeadId) &&
          this.#withinDeadline(item),
      )
      .map(clonePublicMarker);
  }

  #withinDeadline(item: PublicMarker | PublicDetail): boolean {
    return (
      publicLeadWithinDeadline(item, this.#now()) &&
      item.servedVersion >
        (this.#expiredNetworkVersions.get(item.publicLeadId) ?? -1)
    );
  }

  #expireDeadlines(): void {
    const items = this.#state.detail.item
      ? [...this.#state.items, this.#state.detail.item]
      : this.#state.items;
    const expired = items.filter((item) => !this.#withinDeadline(item));
    if (!expired.length) return;
    for (const item of expired) {
      this.#expiredNetworkVersions.set(
        item.publicLeadId,
        Math.max(
          item.servedVersion,
          this.#expiredNetworkVersions.get(item.publicLeadId) ?? -1,
        ),
      );
      this.#cache.removePublicLead(item.publicLeadId);
      this.#preparedDetails.delete(item.publicLeadId);
      this.#preparedDetailRequests.delete(item.publicLeadId);
    }
    const selected = expired.some(
      (item) => item.publicLeadId === this.#state.detail.selectedPublicLeadId,
    );
    if (selected) this.#selectionGeneration++;
    this.#setState({
      items: this.#withoutSuppressed(this.#state.items),
      ...(selected
        ? {
            detail: {
              phase: "UNAVAILABLE" as const,
              selectedPublicLeadId: null,
              selectionGeneration: this.#selectionGeneration,
              item: null,
              error: null,
            },
          }
        : {}),
    });
  }

  #scheduleDeadline(): void {
    if (this.#expiryTimer !== null) clearTimeout(this.#expiryTimer);
    this.#expiryTimer = null;
    const items = this.#state.detail.item
      ? [...this.#state.items, this.#state.detail.item]
      : this.#state.items;
    const deadlines = items
      .map((item) => Date.parse(item.publicUntil ?? ""))
      .filter(Number.isFinite);
    if (!deadlines.length) return;
    this.#expiryTimer = setTimeout(
      () => {
        this.#expiryTimer = null;
        this.#expireDeadlines();
        this.#scheduleDeadline();
      },
      Math.max(1, Math.min(2147483647, Math.min(...deadlines) - this.#now())),
    );
    (this.#expiryTimer as unknown as { unref?: () => void }).unref?.();
  }

  #setState(
    update: Partial<Omit<PublicMapClientState, "detail">> & {
      readonly detail?: PublicMapDetailState;
    },
  ): void {
    this.#state = { ...this.#state, ...update };
    this.#scheduleDeadline();
    for (const listener of this.#listeners) listener(this.#state);
  }
}
