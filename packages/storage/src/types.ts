import type { DrawSession } from "@ichi/session";

export const STORAGE_SCHEMA_VERSION = 1 as const;
export const DEFAULT_STORAGE_KEY = "ichi:v1:sessions" as const;

export interface SessionCollection {
  readonly sessions: readonly DrawSession[];
  readonly activeSessionId: string | null;
}

export interface StorageInfo {
  readonly currentSizeKB: number;
  readonly limitSizeKB: number;
}

export interface StorageDriver {
  getItem(key: string): unknown;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  getInfo?(): StorageInfo;
}

export type StorageCapacityState = "normal" | "near_limit" | "full" | "unknown";

export interface StorageCapacity {
  readonly state: StorageCapacityState;
  readonly currentSizeKB: number | null;
  readonly limitSizeKB: number | null;
  readonly usageRatio: number | null;
}

export type StorageErrorCode =
  | "READ_FAILED"
  | "WRITE_FAILED"
  | "DELETE_FAILED"
  | "INVALID_PAYLOAD"
  | "UNSUPPORTED_STORAGE_VERSION"
  | "MIGRATION_FAILED";

export interface StorageError {
  readonly code: StorageErrorCode;
  readonly message: string;
}

export type LoadCollectionResult =
  | {
      readonly ok: true;
      readonly status: "restored" | "empty" | "migrated";
      readonly value: SessionCollection;
      readonly capacity: StorageCapacity;
    }
  | {
      readonly ok: false;
      readonly status: "fallback";
      readonly value: SessionCollection;
      readonly error: StorageError;
      readonly capacity: StorageCapacity;
    };

export type StorageWriteResult =
  | {
      readonly ok: true;
      readonly capacity: StorageCapacity;
    }
  | {
      readonly ok: false;
      readonly error: StorageError;
      readonly capacity: StorageCapacity;
    };
