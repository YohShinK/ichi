import { describe, expect, it } from "vitest";

import {
  emptyProjectorState,
  evaluateFreshness,
  projectPublicContributor,
  reconcilePublicMapLead,
  type ProjectorEvent,
  type PublicCandidate,
} from "./index.js";
import { testPublicCandidate } from "./test-support.js";

const candidate = (
  observationVersionId: string,
  overrides: NonNullable<Parameters<typeof testPublicCandidate>[1]> = {},
): PublicCandidate => testPublicCandidate(observationVersionId, overrides);

const event = (
  eventSequence: number,
  candidates: readonly PublicCandidate[],
): ProjectorEvent => ({
  boardInstanceId: "instance-1",
  eventSequence,
  reconciledAt: `2026-09-12T0${eventSequence}:10:00.000Z`,
  eligibleCandidates: candidates,
  projectionVersion: "projection-v1",
  policyVersion: "public-policy-v1",
});

describe("TASK-V2-11 monotonic projector", () => {
  it("keeps a stable active ID while support switches A to B", () => {
    const ids = ["public-random-1", "public-random-2"];
    const idFactory = () => ids.shift()!;
    const created = reconcilePublicMapLead(
      emptyProjectorState(),
      event(1, [candidate("observation-a")]),
      idFactory,
    );
    const switched = reconcilePublicMapLead(
      created.state,
      event(2, [
        candidate("observation-b", {
          observedAt: "2026-09-12T02:00:00.000Z",
        }),
      ]),
      idFactory,
    );
    expect(created.effect).toBe("CREATED");
    expect(switched.effect).toBe("ADVANCED");
    expect(switched.publicLeadId).toBe(created.publicLeadId);
    expect(switched.state.leads[switched.publicLeadId!]?.servedVersion).toBe(2);
  });

  it("keeps the ID when A is deleted but B remains eligible", () => {
    const created = reconcilePublicMapLead(
      emptyProjectorState(),
      event(1, [candidate("observation-a")]),
      () => "public-random-1",
    );
    const reconciled = reconcilePublicMapLead(
      created.state,
      event(2, [
        candidate("observation-a", {
          gates: { ...candidate("x").gates, deleted: true },
        }),
        candidate("observation-b", {
          observedAt: "2026-09-12T02:00:00.000Z",
        }),
      ]),
      () => "must-not-be-used",
    );
    expect(reconciled.publicLeadId).toBe(created.publicLeadId);
    expect(reconciled.effect).toBe("ADVANCED");
  });

  it("retires when all support disappears and never resurrects the ID", () => {
    const created = reconcilePublicMapLead(
      emptyProjectorState(),
      event(1, [candidate("observation-a")]),
      () => "public-random-1",
    );
    const retired = reconcilePublicMapLead(
      created.state,
      event(2, []),
      () => "unused",
    );
    const republished = reconcilePublicMapLead(
      retired.state,
      event(3, [candidate("observation-c")]),
      () => "public-random-2",
    );
    expect(retired.effect).toBe("RETIRED");
    expect(retired.state.leads["public-random-1"]?.board).toBeNull();
    expect(republished.effect).toBe("CREATED");
    expect(republished.publicLeadId).toBe("public-random-2");
    expect(() =>
      reconcilePublicMapLead(
        retired.state,
        event(3, [candidate("c")]),
        () => "public-random-1",
      ),
    ).toThrow("PUBLIC_LEAD_ID_COLLISION_OR_RESURRECTION");
  });

  it("discards late events and cannot bypass current eligibility", () => {
    const created = reconcilePublicMapLead(
      emptyProjectorState(),
      event(2, [candidate("observation-new")]),
      () => "public-random-1",
    );
    const late = reconcilePublicMapLead(
      created.state,
      event(1, [candidate("observation-old")]),
      () => "unused",
    );
    expect(late.effect).toBe("LATE_EVENT_DISCARDED");
    expect(late.state).toBe(created.state);

    const hidden = reconcilePublicMapLead(
      created.state,
      event(3, [
        candidate("observation-new", {
          gates: {
            ...candidate("x").gates,
            authorizationApplicable: false,
          },
        }),
      ]),
      () => "unused",
    );
    expect(hidden.effect).toBe("RETIRED");
  });

  it("projects a private V1 avatar through a trusted short-lived issuer", () => {
    const issuer = {
      issue: () => ({
        url: "https://public.example/avatar.png?signature=trusted",
        expiresAt: "2026-09-12T02:00:00.000Z",
      }),
    };
    expect(
      projectPublicContributor(
        {
          accountId: "account-a",
          profileVersion: "profile-v1",
          lifecycle: "ACTIVE",
          displayName: "安全昵称",
          displayNameSafetyPassed: true,
          avatarFileId: "cloud://env/profile-avatars/avatar.png",
        },
        true,
        issuer,
        {
          allowedSignedUrlOrigins: ["https://public.example"],
          maxAgeSeconds: 300,
        },
        Date.parse("2026-09-12T01:00:00.000Z"),
      ),
    ).toEqual({
      displayName: "安全昵称",
      avatar: {
        kind: "PUBLIC_URL",
        url: "https://public.example/avatar.png?signature=trusted",
      },
    });
    expect(
      projectPublicContributor(
        {
          accountId: "account-a",
          profileVersion: "profile-v1",
          lifecycle: "ACTIVE",
          displayName: "未审核昵称",
          displayNameSafetyPassed: false,
          avatarFileId: "invalid-ref",
          legacyAvatarUrl: "https://attacker.example/avatar.png",
        },
        true,
        issuer,
        {
          allowedSignedUrlOrigins: ["https://public.example"],
          maxAgeSeconds: 300,
        },
        Date.parse("2026-09-12T01:00:00.000Z"),
      ),
    ).toEqual({
      displayName: "ICHI 玩家",
      avatar: {
        kind: "FALLBACK_ASSET",
        path: "/assets/v1-29/ichi-avatar.png",
      },
    });
  });

  it("computes Freshness from observedAt, asOf and policy without storing relative text", () => {
    const policy = {
      policyVersion: "freshness-v1",
      recentMaxAgeMs: 60 * 60 * 1000,
      agingMaxAgeMs: 24 * 60 * 60 * 1000,
    };
    expect(
      evaluateFreshness(
        "2026-09-12T00:00:00.000Z",
        "2026-09-12T00:30:00.000Z",
        policy,
      ).freshnessBand,
    ).toBe("RECENT");
    expect(
      evaluateFreshness(
        "2026-09-10T00:00:00.000Z",
        "2026-09-12T00:00:00.000Z",
        policy,
      ).freshnessBand,
    ).toBe("LOW");
    expect(
      Object.keys(
        evaluateFreshness(
          "2026-09-12T00:00:00.000Z",
          "2026-09-12T00:30:00.000Z",
          policy,
        ),
      ),
    ).not.toContain("relativeText");
  });
});
