import { describe, expect, it } from "vitest";

import type { MiniProgramStorageDriver } from "./storage.js";
import {
  readActiveDraftBoardId,
  readRecognitionStableView,
  RECOGNITION_VIEW_KEY,
  writeActiveDraftBoardId,
  writeRecognitionStableView,
} from "./navigation-state.js";

class FakeStorage implements MiniProgramStorageDriver {
  readonly values = new Map<string, string>();
  getItem(key: string): unknown {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
  removeItem(key: string): void {
    this.values.delete(key);
  }
  getInfo(): { currentSizeKB: number; limitSizeKB: number } {
    return { currentSizeKB: 0, limitSizeKB: 10240 };
  }
}

describe("recognition navigation state", () => {
  it("defaults unknown and transient values to start", () => {
    const storage = new FakeStorage();
    storage.values.set(RECOGNITION_VIEW_KEY, "camera-capture");
    expect(readRecognitionStableView(storage)).toBe("start");
  });

  it("restores the last stable recognition view", () => {
    const storage = new FakeStorage();
    writeRecognitionStableView(storage, "resume");
    expect(readRecognitionStableView(storage)).toBe("resume");
  });

  it("persists and clears the active draft identity separately", () => {
    const storage = new FakeStorage();
    writeActiveDraftBoardId(storage, "board-a");
    expect(readActiveDraftBoardId(storage)).toBe("board-a");
    writeActiveDraftBoardId(storage, null);
    expect(readActiveDraftBoardId(storage)).toBeNull();
  });
});
