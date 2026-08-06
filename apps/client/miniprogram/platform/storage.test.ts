import { describe, expect, it } from "vitest";

import {
  createWxStorageDriver,
  getCapacityState,
  type MiniProgramStorageApi,
} from "./storage.js";

class FakeWxStorage implements MiniProgramStorageApi {
  readonly values = new Map<string, string>();
  currentSize = 2;
  limitSize = 10;

  getStorageSync(key: string): unknown {
    return this.values.get(key) ?? "";
  }

  setStorageSync(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeStorageSync(key: string): void {
    this.values.delete(key);
  }

  getStorageInfoSync(): { currentSize: number; limitSize: number } {
    return { currentSize: this.currentSize, limitSize: this.limitSize };
  }
}

describe("WeChat Storage adapter", () => {
  it("maps missing values and delegates save, restore and deletion", () => {
    const api = new FakeWxStorage();
    const driver = createWxStorageDriver(api);
    expect(driver.getItem("session")).toBeNull();
    driver.setItem("session", "payload");
    expect(driver.getItem("session")).toBe("payload");
    driver.removeItem("session");
    expect(driver.getItem("session")).toBeNull();
    expect(driver.getInfo()).toEqual({ currentSizeKB: 2, limitSizeKB: 10 });
  });

  it("classifies normal, warning and full capacity without clearing data", () => {
    expect(getCapacityState({ currentSizeKB: 7, limitSizeKB: 10 })).toBe(
      "normal",
    );
    expect(getCapacityState({ currentSizeKB: 8, limitSizeKB: 10 })).toBe(
      "near_limit",
    );
    expect(getCapacityState({ currentSizeKB: 10, limitSizeKB: 10 })).toBe(
      "full",
    );
    expect(getCapacityState({ currentSizeKB: 0, limitSizeKB: 0 })).toBe(
      "unknown",
    );
  });
});
