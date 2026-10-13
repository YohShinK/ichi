import { describe, expect, it } from "vitest";

import {
  projectContributions,
  type CandidateContribution,
} from "./contribution-projection.js";

const row = (
  owner: string,
  overrides: Partial<CandidateContribution> = {},
): CandidateContribution => ({
  contributionId: `contribution:${owner}`,
  candidateRecordRef: `candidate:${owner}`,
  fixtureId: `fixture:${owner}`,
  ownerSubjectDigest: owner,
  boardInstanceId: "instance:one",
  observationVersionId: `observation:${owner}`,
  observationVersion: "1",
  lifecycle: "ACTIVE",
  shareDecision: "SHARE",
  eligible: true,
  observedAt: "2026-09-28T10:00:00.000Z",
  publicSafeNote: `${owner} note`,
  contributor: {
    displayName: owner,
    avatar: { kind: "PUBLIC_URL", url: `https://example.org/${owner}` },
  },
  dataOrigin: "SYNTHETIC_REHEARSAL",
  ...overrides,
});

describe("multi-contribution public support", () => {
  const a = row("A");
  const b = row("B", { observedAt: "2026-09-28T11:00:00.000Z" });

  it("keeps one instance supported by A and B, newest safe note and two avatars", () => {
    const result = projectContributions("instance:one", [a, b]);
    expect(result.support).toHaveLength(2);
    expect(result.contributors.map((item) => item.displayName)).toEqual([
      "B",
      "A",
    ]);
    expect(result.venueNote).toBe("B note");
  });

  it("deleting A preserves B; deleting B retires support", () => {
    const afterA = projectContributions("instance:one", [
      { ...a, lifecycle: "DELETED" },
      b,
    ]);
    expect(afterA.support.map((item) => item.ownerSubjectDigest)).toEqual([
      "B",
    ]);
    expect(
      projectContributions("instance:one", [
        { ...a, lifecycle: "DELETED" },
        { ...b, lifecycle: "DELETED" },
      ]).support,
    ).toEqual([]);
  });

  it("never resurrects a deleted contribution from a stale version", () => {
    expect(
      projectContributions("instance:one", [
        { ...a, lifecycle: "DELETED", observationVersion: "2" },
        { ...a, observationVersion: "1" },
      ]).support,
    ).toHaveLength(0);
  });

  it("falls back to A note when B is removed or has no safe note", () => {
    expect(
      projectContributions("instance:one", [a, { ...b, lifecycle: "DELETED" }])
        .venueNote,
    ).toBe("A note");
    expect(
      projectContributions("instance:one", [a, { ...b, publicSafeNote: null }])
        .venueNote,
    ).toBe("A note");
  });

  it("deduplicates one subject across version updates and uses safe fallback", () => {
    const updated = row("A", {
      contributionId: "contribution:A:second",
      observationVersion: "2",
      publicSafeNote: null,
      contributor: null,
    });
    const result = projectContributions("instance:one", [a, updated]);
    expect(result.contributors).toHaveLength(1);
    expect(result.contributors[0]?.avatar).toEqual({
      kind: "FALLBACK_ASSET",
      path: "/assets/v1-29/ichi-avatar.png",
    });
  });

  it("does not merge another instance at the same location", () => {
    expect(
      projectContributions("instance:one", [
        a,
        row("C", { boardInstanceId: "instance:two" }),
      ]).support,
    ).toHaveLength(1);
  });
});
