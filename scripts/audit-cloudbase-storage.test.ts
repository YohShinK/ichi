import { describe, expect, it } from "vitest";

import {
  classifyStorageObject,
  STORAGE_CLASSIFICATION,
} from "./audit-cloudbase-storage.mjs";

const now = Date.parse("2026-08-28T12:00:00.000Z");
const object = (key: string, ageHours = 2) => ({
  key,
  lastModified: new Date(now - ageHours * 60 * 60 * 1000).toISOString(),
});

describe("CloudBase storage orphan classification", () => {
  it("protects the current profile avatar", () => {
    expect(
      classifyStorageObject({
        object: object("profile-avatars/current.jpg"),
        references: [{ collection: "profiles", status: "complete" }],
        now,
      }),
    ).toBe(STORAGE_CLASSIFICATION.EXPECTED_PROFILE_ASSET);
  });

  it("keeps recent unreferenced uploads active but releases stale ones", () => {
    expect(
      classifyStorageObject({
        object: object("recognition-temp/job/recent.jpg", 0.5),
        now,
      }),
    ).toBe(STORAGE_CLASSIFICATION.ACTIVE_TEMP);
    expect(
      classifyStorageObject({
        object: object("recognition-temp/job/stale.jpg", 25),
        now,
      }),
    ).toBe(STORAGE_CLASSIFICATION.ORPHAN_SAFE_TO_DELETE);
  });

  it("never classifies an unreferenced profile avatar by age alone", () => {
    expect(
      classifyStorageObject({
        object: object("profile-avatars/unreferenced.jpg", 24 * 365),
        now,
      }),
    ).toBe(STORAGE_CLASSIFICATION.UNKNOWN_DO_NOT_DELETE);
  });

  it("keeps unreferenced recognition objects until the 24-hour boundary", () => {
    expect(
      classifyStorageObject({
        object: object("recognition-temp/job/not-expired.jpg", 23.99),
        now,
      }),
    ).toBe(STORAGE_CLASSIFICATION.ACTIVE_TEMP);
    expect(
      classifyStorageObject({
        object: object("recognition-temp/job/expired.jpg", 24),
        now,
      }),
    ).toBe(STORAGE_CLASSIFICATION.ORPHAN_SAFE_TO_DELETE);
  });

  it("distinguishes active, legacy, golden, and scheduled-cleanup objects", () => {
    expect(
      classifyStorageObject({
        object: object("recognition-temp/prize/active.jpg"),
        references: [
          { collection: "drawSubmissions", status: "PHOTO_PENDING" },
        ],
        now,
      }),
    ).toBe(STORAGE_CLASSIFICATION.ACTIVE_TEMP);
    expect(
      classifyStorageObject({
        object: object("recognition-temp/prize/legacy.jpg"),
        references: [{ collection: "drawSubmissions", status: "APPROVED" }],
        now,
      }),
    ).toBe(STORAGE_CLASSIFICATION.REFERENCED_LEGACY);
    expect(
      classifyStorageObject({
        object: object(
          "recognition-temp/golden-diagnostic-1/golden-1-detail.jpg",
        ),
        goldenSourceExists: true,
        now,
      }),
    ).toBe(STORAGE_CLASSIFICATION.GOLDEN_DEV_ASSET);
    expect(
      classifyStorageObject({
        object: object("recognition-temp/prize/scheduled.jpg", 0.1),
        cleanupJobs: [{ status: "pending" }],
        now,
      }),
    ).toBe(STORAGE_CLASSIFICATION.ORPHAN_SAFE_TO_DELETE);
  });

  it("fails closed for unknown prefixes and missing Golden sources", () => {
    expect(
      classifyStorageObject({ object: object("other/file.jpg"), now }),
    ).toBe(STORAGE_CLASSIFICATION.UNKNOWN_DO_NOT_DELETE);
    expect(
      classifyStorageObject({
        object: object(
          "recognition-temp/golden-diagnostic-1/golden-3-detail.jpg",
        ),
        goldenSourceExists: false,
        now,
      }),
    ).toBe(STORAGE_CLASSIFICATION.UNKNOWN_DO_NOT_DELETE);
  });
});
