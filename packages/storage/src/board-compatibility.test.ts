import type { BoardLayoutSnapshot } from "@ichi/session";
import { describe, expect, it } from "vitest";

import { prepareBoardSnapshot } from "./board-compatibility.js";

const current = (): BoardLayoutSnapshot => ({
  snapshotVersion: 1,
  boardSchemaVersion: "1.0.0",
  componentRegistryId: "v1-saturated-board-components",
  recognitionContractVersion: "1.0.0",
  confirmedDraft: { schemaVersion: "1.0.0", draftId: "current" },
});

describe("bundled board compatibility", () => {
  it("accepts only the bundled current schema and registry", () => {
    expect(prepareBoardSnapshot(current(), null)).toEqual({
      ok: true,
      status: "current",
      value: current(),
    });
  });

  it("migrates the supported local V0 wrapper without fetching anything", () => {
    const migrated = prepareBoardSnapshot(
      {
        snapshotVersion: 0,
        layoutSchemaVersion: "1.0.0",
        registryId: "v1-saturated-board-components",
        recognitionVersion: "1.0.0",
        draft: { schemaVersion: "1.0.0", draftId: "legacy" },
      },
      null,
    );
    expect(migrated).toMatchObject({
      ok: true,
      status: "migrated",
      value: {
        snapshotVersion: 1,
        boardSchemaVersion: "1.0.0",
        componentRegistryId: "v1-saturated-board-components",
        recognitionContractVersion: "1.0.0",
      },
    });
  });

  it("keeps the last usable snapshot for unknown schema or migration failure", () => {
    const fallback = current();
    expect(
      prepareBoardSnapshot(
        { ...current(), boardSchemaVersion: "2.0.0" },
        fallback,
      ),
    ).toMatchObject({
      ok: false,
      status: "fallback",
      value: fallback,
      error: { code: "UNSUPPORTED_BOARD_SCHEMA" },
    });
    expect(
      prepareBoardSnapshot({ snapshotVersion: 99 }, fallback),
    ).toMatchObject({
      ok: false,
      status: "fallback",
      value: fallback,
      error: { code: "BOARD_MIGRATION_FAILED" },
    });
  });
});
