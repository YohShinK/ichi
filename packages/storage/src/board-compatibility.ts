import {
  BOARD_COMPONENT_REGISTRY_ID,
  BOARD_LAYOUT_SCHEMA_VERSION,
} from "@ichi/board-layout";
import { RECOGNITION_CONTRACT_VERSION } from "@ichi/recognition-contract";
import {
  BOARD_SNAPSHOT_VERSION,
  type BoardLayoutSnapshot,
} from "@ichi/session";

export type BoardCompatibilityErrorCode =
  | "INVALID_BOARD_SNAPSHOT"
  | "UNSUPPORTED_BOARD_SCHEMA"
  | "UNSUPPORTED_COMPONENT_REGISTRY"
  | "UNSUPPORTED_RECOGNITION_CONTRACT"
  | "BOARD_MIGRATION_FAILED";

export interface BoardCompatibilityError {
  readonly code: BoardCompatibilityErrorCode;
  readonly message: string;
}

export type BoardCompatibilityResult =
  | {
      readonly ok: true;
      readonly status: "current" | "migrated";
      readonly value: BoardLayoutSnapshot;
    }
  | {
      readonly ok: false;
      readonly status: "fallback";
      readonly value: BoardLayoutSnapshot | null;
      readonly error: BoardCompatibilityError;
    };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const fallback = (
  value: BoardLayoutSnapshot | null,
  code: BoardCompatibilityErrorCode,
  message: string,
): BoardCompatibilityResult => ({
  ok: false,
  status: "fallback",
  value,
  error: { code, message },
});

const validateKnownVersions = (
  boardSchemaVersion: unknown,
  componentRegistryId: unknown,
  recognitionContractVersion: unknown,
  lastUsable: BoardLayoutSnapshot | null,
): BoardCompatibilityResult | null => {
  if (boardSchemaVersion !== BOARD_LAYOUT_SCHEMA_VERSION) {
    return fallback(
      lastUsable,
      "UNSUPPORTED_BOARD_SCHEMA",
      `Board schema ${String(boardSchemaVersion)} is not bundled with this app.`,
    );
  }
  if (componentRegistryId !== BOARD_COMPONENT_REGISTRY_ID) {
    return fallback(
      lastUsable,
      "UNSUPPORTED_COMPONENT_REGISTRY",
      `Component registry ${String(componentRegistryId)} is not bundled with this app.`,
    );
  }
  if (recognitionContractVersion !== RECOGNITION_CONTRACT_VERSION) {
    return fallback(
      lastUsable,
      "UNSUPPORTED_RECOGNITION_CONTRACT",
      `Recognition contract ${String(recognitionContractVersion)} is not bundled with this app.`,
    );
  }
  return null;
};

export const prepareBoardSnapshot = (
  input: unknown,
  lastUsable: BoardLayoutSnapshot | null,
): BoardCompatibilityResult => {
  if (!isRecord(input) || typeof input.snapshotVersion !== "number") {
    return fallback(
      lastUsable,
      "INVALID_BOARD_SNAPSHOT",
      "Board snapshot has no supported snapshot version.",
    );
  }

  if (input.snapshotVersion === BOARD_SNAPSHOT_VERSION) {
    const versionError = validateKnownVersions(
      input.boardSchemaVersion,
      input.componentRegistryId,
      input.recognitionContractVersion,
      lastUsable,
    );
    if (versionError !== null) return versionError;
    if (
      !isRecord(input.confirmedDraft) ||
      input.confirmedDraft.schemaVersion !== BOARD_LAYOUT_SCHEMA_VERSION
    ) {
      return fallback(
        lastUsable,
        "INVALID_BOARD_SNAPSHOT",
        "Confirmed board draft does not match the bundled schema.",
      );
    }
    return {
      ok: true,
      status: "current",
      value: input as unknown as BoardLayoutSnapshot,
    };
  }

  if (input.snapshotVersion === 0) {
    const versionError = validateKnownVersions(
      input.layoutSchemaVersion,
      input.registryId,
      input.recognitionVersion,
      lastUsable,
    );
    if (versionError !== null) return versionError;
    if (
      !isRecord(input.draft) ||
      input.draft.schemaVersion !== BOARD_LAYOUT_SCHEMA_VERSION
    ) {
      return fallback(
        lastUsable,
        "BOARD_MIGRATION_FAILED",
        "Legacy board draft cannot be migrated safely.",
      );
    }
    return {
      ok: true,
      status: "migrated",
      value: {
        snapshotVersion: BOARD_SNAPSHOT_VERSION,
        boardSchemaVersion: BOARD_LAYOUT_SCHEMA_VERSION,
        componentRegistryId: BOARD_COMPONENT_REGISTRY_ID,
        recognitionContractVersion: RECOGNITION_CONTRACT_VERSION,
        confirmedDraft: input.draft,
      },
    };
  }

  return fallback(
    lastUsable,
    "BOARD_MIGRATION_FAILED",
    `Board snapshot version ${String(input.snapshotVersion)} cannot be migrated.`,
  );
};
