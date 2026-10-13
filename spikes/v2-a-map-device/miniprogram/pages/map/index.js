const shanghaiData = require("../../data/shanghai-markers");
const { SHANGHAI_CENTER, SYNTHETIC_RECORDS, filterByViewport, toMapMarker } =
  shanghaiData;

const MAX_LOG_ENTRIES = 80;
const NETWORK_DELAYS_MS = Object.freeze({
  online: 250,
  weak: 2600,
  offline: 120,
});

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function formatCoordinate(value) {
  return Number(value).toFixed(5);
}

Page({
  data: {
    centerLatitude: SHANGHAI_CENTER.latitude,
    centerLongitude: SHANGHAI_CENTER.longitude,
    scale: 11,
    markers: [],
    records: [],
    markerCount: 0,
    selectedCity: "上海市",
    cityOptions: ["上海市"],
    listVisible: true,
    permissionState: "UNKNOWN",
    permissionMessage: "尚未请求定位权限",
    actualNetwork: "UNKNOWN",
    networkMode: "online",
    loadState: "IDLE",
    loadMessage: "等待加载本地合成数据",
    requestGeneration: 0,
    activeGeneration: 0,
    discardedResponses: 0,
    viewportSummary: "等待地图回报 viewport",
    lifecycleState: "CREATED",
    mapUpdatedCount: 0,
    logs: [],
  },

  onLoad() {
    this._generation = 0;
    this._activeGeneration = 0;
    this._logSequence = 0;
    this._pendingTimers = new Set();
    this._viewport = null;
    this._hasShown = false;
    this._lifecycleSnapshot = null;
    this._mapContext = null;
    this._hasLoggedMapUpdated = false;
    this._pendingProgrammaticReloadReason = null;
    this._networkStatusHandler = (result) => {
      const actualNetwork = result.isConnected
        ? String(result.networkType || "CONNECTED").toUpperCase()
        : "OFFLINE";
      this.setData({ actualNetwork });
      this.appendLog("NETWORK", "系统网络状态变化", {
        actualNetwork,
        isConnected: Boolean(result.isConnected),
      });
    };

    if (typeof wx.onNetworkStatusChange === "function") {
      wx.onNetworkStatusChange(this._networkStatusHandler);
    }
    if (typeof wx.getNetworkType === "function") {
      wx.getNetworkType({
        success: (result) => {
          this.setData({
            actualNetwork: String(
              result.networkType || "UNKNOWN",
            ).toUpperCase(),
          });
        },
      });
    }

    this.appendLog("LIFECYCLE", "独立地图验证页创建；生产连接=false", {
      fixtureCount: SYNTHETIC_RECORDS.length,
    });
    this.startMockLoad("INITIAL_LOAD", { ignoreViewport: true });
  },

  onReady() {
    this._mapContext = wx.createMapContext("device-map", this);
    this.setData({ lifecycleState: "READY" });
    this.appendLog("MAP", "原生 map context 已创建", {
      component: "<map>",
    });
    this.schedule(() => this.captureViewport("MAP_READY", false), 350);
  },

  onShow() {
    this.setData({ lifecycleState: "VISIBLE" });
    if (!this._hasShown) {
      this._hasShown = true;
      return;
    }
    this.restoreLifecycleState();
  },

  onHide() {
    this.invalidateActiveRequest("PAGE_HIDE");
    this.setData({ lifecycleState: "HIDDEN" });
    this.persistLifecycleState();
    this.appendLog("LIFECYCLE", "页面进入后台，viewport 已保存");
  },

  onUnload() {
    this.invalidateActiveRequest("PAGE_UNLOAD");
    for (const timer of this._pendingTimers) clearTimeout(timer);
    this._pendingTimers.clear();
    if (
      typeof wx.offNetworkStatusChange === "function" &&
      this._networkStatusHandler
    ) {
      wx.offNetworkStatusChange(this._networkStatusHandler);
    }
  },

  schedule(callback, delay) {
    const timer = setTimeout(() => {
      this._pendingTimers.delete(timer);
      callback();
    }, delay);
    this._pendingTimers.add(timer);
    return timer;
  },

  appendLog(type, message, detail) {
    const entry = {
      id: ++this._logSequence,
      time: new Date().toISOString().slice(11, 23),
      type,
      message,
      detail: detail ? JSON.stringify(detail) : "",
    };
    this.setData({
      logs: [entry, ...this.data.logs].slice(0, MAX_LOG_ENTRIES),
    });
  },

  invalidateActiveRequest(reason) {
    const generation = ++this._generation;
    this._activeGeneration = generation;
    this.setData({
      requestGeneration: generation,
      activeGeneration: generation,
    });
    this.appendLog("GENERATION", "使未完成响应失效", {
      reason,
      generation,
    });
  },

  startMockLoad(reason, options = {}) {
    const generation = ++this._generation;
    const networkMode = options.networkMode || this.data.networkMode;
    const delay = NETWORK_DELAYS_MS[networkMode];
    this._activeGeneration = generation;
    this.setData({
      requestGeneration: generation,
      activeGeneration: generation,
      loadState: "LOADING",
      loadMessage:
        networkMode === "weak"
          ? "弱网模拟：本地响应延迟 2.6 秒"
          : networkMode === "offline"
            ? "断网模拟：即将返回受控错误"
            : "正在加载本地合成数据",
    });
    this.appendLog("REQUEST", "开始本地 mock 请求", {
      generation,
      networkMode,
      reason,
    });

    this.schedule(() => {
      if (networkMode === "offline") {
        this.finishMockFailure(generation, "MOCK_OFFLINE", reason);
        return;
      }
      if (options.forceError) {
        this.finishMockFailure(generation, "MOCK_DATA_LOAD_ERROR", reason);
        return;
      }
      const records = options.ignoreViewport
        ? SYNTHETIC_RECORDS.slice()
        : filterByViewport(SYNTHETIC_RECORDS, this._viewport);
      this.finishMockSuccess(generation, records, reason);
    }, delay);
  },

  finishMockSuccess(generation, records, reason) {
    if (generation !== this._activeGeneration) {
      this.recordDiscard(generation, reason, "STALE_SUCCESS");
      return;
    }
    const markers = records.map(toMapMarker);
    this.setData({
      records,
      markers,
      markerCount: markers.length,
      loadState: "READY",
      loadMessage: `本地合成数据已加载：${markers.length} 个 marker`,
    });
    this.appendLog("RESPONSE", "应用本地 mock 响应", {
      generation,
      markerCount: markers.length,
      reason,
    });
  },

  finishMockFailure(generation, code, reason) {
    if (generation !== this._activeGeneration) {
      this.recordDiscard(generation, reason, code);
      return;
    }
    this.setData({
      records: [],
      markers: [],
      markerCount: 0,
      listVisible: true,
      loadState: code === "MOCK_OFFLINE" ? "OFFLINE" : "ERROR",
      loadMessage:
        code === "MOCK_OFFLINE"
          ? "当前为断网模拟；地图仍可操作，数据列表显示离线状态"
          : "本地 mock 数据加载失败；可点击正常重载恢复",
    });
    this.appendLog("ERROR", "受控 mock 请求失败", {
      code,
      generation,
      reason,
    });
  },

  recordDiscard(generation, reason, outcome) {
    const discardedResponses = this.data.discardedResponses + 1;
    this.setData({ discardedResponses });
    this.appendLog("DISCARD", "丢弃非当前 generation 响应", {
      activeGeneration: this._activeGeneration,
      discardedGeneration: generation,
      discardedResponses,
      outcome,
      reason,
    });
  },

  onReload() {
    this.startMockLoad("MANUAL_RELOAD");
  },

  onForceMockError() {
    this.startMockLoad("FORCED_ERROR", {
      forceError: true,
      networkMode: "online",
    });
  },

  onRunRace() {
    this.appendLog("RACE", "启动慢响应与快响应倒序测试");
    this.startMockLoad("RACE_SLOW", {
      networkMode: "weak",
      ignoreViewport: true,
    });
    this.schedule(() => {
      this.startMockLoad("RACE_FAST", {
        networkMode: "online",
        ignoreViewport: true,
      });
    }, 100);
  },

  onNetworkModeChange(event) {
    const networkMode = event.detail.value;
    this.setData({ networkMode });
    this.appendLog("NETWORK", "切换可控 mock 网络模式", { networkMode });
  },

  onRequestLocation() {
    this.setData({
      permissionState: "REQUESTING",
      permissionMessage: "正在请求定位权限",
    });
    this.appendLog("PERMISSION", "开始定位权限检查");
    wx.getSetting({
      success: (result) => {
        const authorization = result.authSetting["scope.userLocation"];
        if (authorization === true) {
          this.readCurrentLocation();
          return;
        }
        if (authorization === false) {
          this.applyLocationDenied("PREVIOUSLY_DENIED");
          return;
        }
        wx.authorize({
          scope: "scope.userLocation",
          success: () => this.readCurrentLocation(),
          fail: () => this.applyLocationDenied("USER_DENIED"),
        });
      },
      fail: (error) =>
        this.applyLocationUnavailable("GET_SETTING_FAILED", error),
    });
  },

  readCurrentLocation() {
    wx.getLocation({
      type: "gcj02",
      success: (location) => {
        this._pendingProgrammaticReloadReason = "LOCATION_GRANTED";
        this.setData({
          permissionState: "GRANTED",
          permissionMessage: "定位已允许；坐标仅保存在当前页面状态",
          centerLatitude: location.latitude,
          centerLongitude: location.longitude,
          scale: 14,
        });
        this.appendLog("PERMISSION", "定位允许并读取 GCJ-02", {
          latitude: formatCoordinate(location.latitude),
          longitude: formatCoordinate(location.longitude),
        });
      },
      fail: (error) => {
        const message = String(error && error.errMsg ? error.errMsg : error);
        if (/auth|deny|denied/i.test(message)) {
          this.applyLocationDenied("GET_LOCATION_DENIED");
          return;
        }
        this.applyLocationUnavailable("GET_LOCATION_FAILED", error);
      },
    });
  },

  applyLocationDenied(reason) {
    this.setData({
      permissionState: "DENIED",
      permissionMessage: "定位已拒绝；不会循环索权，可手选上海并使用列表",
      listVisible: true,
    });
    this.appendLog("PERMISSION", "定位拒绝，启用手选城市与列表 fallback", {
      reason,
    });
  },

  applyLocationUnavailable(reason, error) {
    this.setData({
      permissionState: "UNAVAILABLE",
      permissionMessage: "定位暂不可用；可手选上海并使用列表",
      listVisible: true,
    });
    this.appendLog("PERMISSION", "定位调用失败", {
      reason,
      error: String(error && error.errMsg ? error.errMsg : error || "UNKNOWN"),
    });
  },

  onOpenSettings() {
    wx.openSetting({
      success: (result) => {
        const granted = result.authSetting["scope.userLocation"] === true;
        this.setData({
          permissionState: granted ? "GRANTED" : "DENIED",
          permissionMessage: granted
            ? "设置中已允许定位，可再次点击请求定位"
            : "设置中仍未允许定位，继续使用手选城市与列表",
        });
        this.appendLog("PERMISSION", "用户从设置页返回", { granted });
      },
    });
  },

  onCityChange() {
    this.useShanghaiFallback("PICKER");
  },

  onUseShanghaiFallback() {
    this.useShanghaiFallback("BUTTON");
  },

  useShanghaiFallback(source) {
    this._viewport = null;
    this.setData({
      selectedCity: "上海市",
      centerLatitude: SHANGHAI_CENTER.latitude,
      centerLongitude: SHANGHAI_CENTER.longitude,
      scale: 11,
      listVisible: true,
    });
    this.appendLog("FALLBACK", "手选上海并显示列表", { source });
    this.startMockLoad("CITY_FALLBACK", { ignoreViewport: true });
  },

  onToggleList() {
    const listVisible = !this.data.listVisible;
    this.setData({ listVisible });
    this.appendLog(
      "FALLBACK",
      listVisible ? "打开列表 fallback" : "收起列表 fallback",
    );
  },

  onZoomIn() {
    const scale = clamp(this.data.scale + 1, 5, 18);
    this._pendingProgrammaticReloadReason = "ZOOM_IN";
    this.setData({ scale });
    this.appendLog("MAP", "程序化放大", { scale });
  },

  onZoomOut() {
    const scale = clamp(this.data.scale - 1, 5, 18);
    this._pendingProgrammaticReloadReason = "ZOOM_OUT";
    this.setData({ scale });
    this.appendLog("MAP", "程序化缩小", { scale });
  },

  onRegionChange(event) {
    if (event.type !== "end") return;
    const causedBy = event.causedBy || "UNKNOWN";
    this.appendLog("MAP", "regionchange end", {
      causedBy,
    });
    const pendingReason = this._pendingProgrammaticReloadReason;
    if (pendingReason) this._pendingProgrammaticReloadReason = null;
    const syncMapState = causedBy === "gesture";
    this.captureViewport(
      pendingReason || "REGION_CHANGE",
      syncMapState || Boolean(pendingReason),
      syncMapState,
    );
  },

  captureViewport(reason, reloadAfterCapture, syncMapState = false) {
    if (!this._mapContext) return;
    this._mapContext.getRegion({
      success: (region) => {
        const viewport = {
          southwest: {
            latitude: region.southwest.latitude,
            longitude: region.southwest.longitude,
          },
          northeast: {
            latitude: region.northeast.latitude,
            longitude: region.northeast.longitude,
          },
        };
        this._viewport = viewport;
        const viewportSummary = [
          `SW ${formatCoordinate(viewport.southwest.latitude)},${formatCoordinate(viewport.southwest.longitude)}`,
          `NE ${formatCoordinate(viewport.northeast.latitude)},${formatCoordinate(viewport.northeast.longitude)}`,
        ].join(" · ");
        this.setData({ viewportSummary });
        this.appendLog("VIEWPORT", "记录地图可视区域", {
          reason,
          southwest: viewport.southwest,
          northeast: viewport.northeast,
        });
        if (reloadAfterCapture) this.startMockLoad(reason);
      },
      fail: (error) => {
        this.appendLog("VIEWPORT", "读取 viewport 失败", {
          reason,
          error: String(error && error.errMsg ? error.errMsg : error),
        });
      },
    });
    if (syncMapState) {
      this._mapContext.getScale({
        success: (result) => {
          if (Math.abs(result.scale - this.data.scale) > 0.001) {
            this.setData({ scale: result.scale });
          }
        },
      });
      this._mapContext.getCenterLocation({
        success: (result) => {
          const centerChanged =
            Math.abs(result.latitude - this.data.centerLatitude) > 0.000001 ||
            Math.abs(result.longitude - this.data.centerLongitude) > 0.000001;
          if (centerChanged) {
            this.setData({
              centerLatitude: result.latitude,
              centerLongitude: result.longitude,
            });
          }
        },
      });
    }
  },

  onMapUpdated() {
    if (this._hasLoggedMapUpdated) return;
    this._hasLoggedMapUpdated = true;
    const mapUpdatedCount = 1;
    this.setData({ mapUpdatedCount });
    this.appendLog("RENDER", "原生 map updated", {
      mapUpdatedCount,
      markerCount: this.data.markerCount,
    });
  },

  onMarkerTap(event) {
    const markerId = Number(event.markerId || event.detail.markerId);
    const record = SYNTHETIC_RECORDS.find((item) => item.id === markerId);
    this.appendLog("MARKER", "marker 点击", {
      markerId,
      title: record ? record.title : "UNKNOWN",
    });
  },

  onListMarkerTap(event) {
    const markerId = Number(event.currentTarget.dataset.id);
    const record = SYNTHETIC_RECORDS.find((item) => item.id === markerId);
    if (!record) return;
    this.setData({
      centerLatitude: record.latitude,
      centerLongitude: record.longitude,
      scale: 15,
    });
    this.appendLog("FALLBACK", "从列表定位到合成 marker", {
      markerId,
    });
  },

  persistLifecycleState() {
    this._lifecycleSnapshot = {
      centerLatitude: this.data.centerLatitude,
      centerLongitude: this.data.centerLongitude,
      scale: this.data.scale,
      networkMode: this.data.networkMode,
      listVisible: this.data.listVisible,
      savedAt: new Date().toISOString(),
    };
  },

  restoreLifecycleState() {
    const restored = this._lifecycleSnapshot;
    if (restored && typeof restored === "object") {
      this._pendingProgrammaticReloadReason = "FOREGROUND_RESTORE";
      this.setData({
        centerLatitude:
          Number(restored.centerLatitude) || SHANGHAI_CENTER.latitude,
        centerLongitude:
          Number(restored.centerLongitude) || SHANGHAI_CENTER.longitude,
        scale: clamp(Number(restored.scale) || 11, 5, 18),
        networkMode: NETWORK_DELAYS_MS[restored.networkMode]
          ? restored.networkMode
          : "online",
        listVisible: restored.listVisible !== false,
        lifecycleState: "RESTORED",
      });
      this.appendLog("LIFECYCLE", "从页面内存快照恢复地图状态", {
        savedAt: restored.savedAt || "UNKNOWN",
      });
    } else {
      this.appendLog("LIFECYCLE", "返回前台，无已保存状态");
    }
  },

  onClearLogs() {
    this.setData({ logs: [] });
    this.appendLog("LOG", "日志已清空");
  },
});
