import { getCapacityState, getWxStorageDriver } from "./storage.js";

const SMOKE_KEY = "ichi:v1:storage-smoke";

interface SmokeValue {
  readonly marker: "ICHI_V1_C";
  readonly savedAt: string;
}

export type StorageSmokeAction = "seed" | "restore" | "delete" | "status";

export interface StorageSmokeResult {
  readonly action: StorageSmokeAction;
  readonly state: "saved" | "restored" | "empty" | "deleted" | "error";
  readonly detail: string;
  readonly capacityState: "normal" | "near_limit" | "full" | "unknown";
}

const parseSmokeValue = (raw: unknown): SmokeValue | null => {
  if (typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SmokeValue>;
    return parsed.marker === "ICHI_V1_C" && typeof parsed.savedAt === "string"
      ? { marker: "ICHI_V1_C", savedAt: parsed.savedAt }
      : null;
  } catch {
    return null;
  }
};

export const runStorageSmoke = (
  action: StorageSmokeAction,
  now: string,
): StorageSmokeResult => {
  const driver = getWxStorageDriver();
  const capacityState = getCapacityState(driver.getInfo());
  try {
    if (action === "seed") {
      const value: SmokeValue = { marker: "ICHI_V1_C", savedAt: now };
      driver.setItem(SMOKE_KEY, JSON.stringify(value));
      return {
        action,
        state: "saved",
        detail: `saved:${now}`,
        capacityState: getCapacityState(driver.getInfo()),
      };
    }
    if (action === "delete") {
      driver.removeItem(SMOKE_KEY);
      return {
        action,
        state: "deleted",
        detail: "ICHI smoke key removed",
        capacityState: getCapacityState(driver.getInfo()),
      };
    }
    const restored = parseSmokeValue(driver.getItem(SMOKE_KEY));
    return restored === null
      ? {
          action,
          state: "empty",
          detail: "no saved smoke value",
          capacityState,
        }
      : {
          action,
          state: "restored",
          detail: `restored:${restored.savedAt}`,
          capacityState,
        };
  } catch (error) {
    return {
      action,
      state: "error",
      detail: error instanceof Error ? error.message : "unknown storage error",
      capacityState,
    };
  }
};
