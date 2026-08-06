export interface MiniProgramStorageInfo {
  readonly currentSize: number;
  readonly limitSize: number;
}

export interface MiniProgramStorageApi {
  getStorageSync(key: string): unknown;
  setStorageSync(key: string, value: string): void;
  removeStorageSync(key: string): void;
  getStorageInfoSync(): MiniProgramStorageInfo;
}

export interface MiniProgramStorageDriver {
  getItem(key: string): unknown;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  getInfo(): {
    readonly currentSizeKB: number;
    readonly limitSizeKB: number;
  };
}

export const createWxStorageDriver = (
  api: MiniProgramStorageApi,
): MiniProgramStorageDriver => ({
  getItem(key) {
    const value = api.getStorageSync(key);
    return value === "" || value === undefined ? null : value;
  },
  setItem(key, value) {
    api.setStorageSync(key, value);
  },
  removeItem(key) {
    api.removeStorageSync(key);
  },
  getInfo() {
    const info = api.getStorageInfoSync();
    return {
      currentSizeKB: info.currentSize,
      limitSizeKB: info.limitSize,
    };
  },
});

export const getWxStorageDriver = (): MiniProgramStorageDriver =>
  createWxStorageDriver(wx);

export const getCapacityState = (
  info: { readonly currentSizeKB: number; readonly limitSizeKB: number },
  warningRatio = 0.8,
): "normal" | "near_limit" | "full" | "unknown" => {
  if (info.limitSizeKB <= 0) return "unknown";
  const ratio = info.currentSizeKB / info.limitSizeKB;
  if (ratio >= 1) return "full";
  return ratio >= warningRatio ? "near_limit" : "normal";
};
