import type { DrawSession } from "@ichi/session";

import {
  deserializeSessionCollection,
  serializeSessionCollection,
} from "./codec.js";
import {
  DEFAULT_STORAGE_KEY,
  type LoadCollectionResult,
  type SessionCollection,
  type StorageCapacity,
  type StorageDriver,
  type StorageWriteResult,
} from "./types.js";

export const EMPTY_SESSION_COLLECTION: SessionCollection = {
  sessions: [],
  activeSessionId: null,
};

export const getStorageCapacity = (
  driver: StorageDriver,
  warningRatio = 0.8,
): StorageCapacity => {
  if (driver.getInfo === undefined) {
    return {
      state: "unknown",
      currentSizeKB: null,
      limitSizeKB: null,
      usageRatio: null,
    };
  }
  try {
    const info = driver.getInfo();
    if (info.limitSizeKB <= 0) {
      return {
        state: "unknown",
        currentSizeKB: info.currentSizeKB,
        limitSizeKB: info.limitSizeKB,
        usageRatio: null,
      };
    }
    const usageRatio = info.currentSizeKB / info.limitSizeKB;
    return {
      state:
        usageRatio >= 1
          ? "full"
          : usageRatio >= warningRatio
            ? "near_limit"
            : "normal",
      currentSizeKB: info.currentSizeKB,
      limitSizeKB: info.limitSizeKB,
      usageRatio,
    };
  } catch {
    return {
      state: "unknown",
      currentSizeKB: null,
      limitSizeKB: null,
      usageRatio: null,
    };
  }
};

export class SessionRepository {
  readonly #driver: StorageDriver;
  readonly #key: string;

  constructor(driver: StorageDriver, key = DEFAULT_STORAGE_KEY) {
    this.#driver = driver;
    this.#key = key;
  }

  load(fallback: SessionCollection): LoadCollectionResult {
    let raw: unknown;
    try {
      raw = this.#driver.getItem(this.#key);
    } catch {
      return {
        ok: false,
        status: "fallback",
        value: fallback,
        error: {
          code: "READ_FAILED",
          message:
            "Local session data could not be read; memory state was kept.",
        },
        capacity: getStorageCapacity(this.#driver),
      };
    }
    if (raw === null || raw === undefined || raw === "") {
      return {
        ok: true,
        status: "empty",
        value: fallback,
        capacity: getStorageCapacity(this.#driver),
      };
    }
    const decoded = deserializeSessionCollection(raw);
    if (!decoded.ok) {
      return {
        ok: false,
        status: "fallback",
        value: fallback,
        error: decoded.error,
        capacity: getStorageCapacity(this.#driver),
      };
    }
    return {
      ok: true,
      status: decoded.status === "migrated" ? "migrated" : "restored",
      value: decoded.value,
      capacity: getStorageCapacity(this.#driver),
    };
  }

  save(value: SessionCollection, savedAt: string): StorageWriteResult {
    try {
      this.#driver.setItem(
        this.#key,
        serializeSessionCollection(value, savedAt),
      );
      return { ok: true, capacity: getStorageCapacity(this.#driver) };
    } catch {
      return {
        ok: false,
        error: {
          code: "WRITE_FAILED",
          message:
            "Local session data could not be saved; memory state was kept.",
        },
        capacity: getStorageCapacity(this.#driver),
      };
    }
  }

  removeAll(): StorageWriteResult {
    try {
      this.#driver.removeItem(this.#key);
      return { ok: true, capacity: getStorageCapacity(this.#driver) };
    } catch {
      return {
        ok: false,
        error: {
          code: "DELETE_FAILED",
          message: "ICHI local session data could not be deleted.",
        },
        capacity: getStorageCapacity(this.#driver),
      };
    }
  }
}

export const upsertSession = (
  collection: SessionCollection,
  session: DrawSession,
  makeActive = true,
): SessionCollection => {
  const existingIndex = collection.sessions.findIndex(
    (item) => item.id === session.id,
  );
  const sessions = [...collection.sessions];
  if (existingIndex === -1) sessions.push(session);
  else sessions[existingIndex] = session;
  return {
    sessions,
    activeSessionId: makeActive ? session.id : collection.activeSessionId,
  };
};

export const deleteSession = (
  collection: SessionCollection,
  sessionId: string,
): SessionCollection => ({
  sessions: collection.sessions.filter((session) => session.id !== sessionId),
  activeSessionId:
    collection.activeSessionId === sessionId
      ? null
      : collection.activeSessionId,
});
