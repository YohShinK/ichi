import { describe, expect, it, vi } from "vitest";

import { CandidateUploadService } from "./candidate-upload-service.js";

const ref = `candidate:${"a".repeat(40)}`;

describe("candidate synthetic upload lineage client", () => {
  it("matches server-issued upload success and My Uploads with one ref/version", async () => {
    const callFunction = vi.fn(
      async ({
        name,
        data,
      }: {
        name: string;
        data: Record<string, unknown>;
      }) => ({
        result:
          name === "v2-shadow-submit-candidate-upload"
            ? {
                ok: true,
                candidateRecordRef: ref,
                observationVersion: "verified-v1",
              }
            : name === "v2-shadow-manage-contribution" &&
                data.operation === "LIST_MY_UPLOADS"
              ? {
                  ok: true,
                  uploads: [
                    {
                      candidateRecordRef: ref,
                      observationVersion: "verified-v1",
                      validationState: "VERIFIED",
                      shareDecision: "SHARE",
                      lifecycle: "ACTIVE",
                      boardInstanceId: "instance:one",
                    },
                  ],
                }
              : { ok: true, lifecycle: "DELETED" },
      }),
    );
    const service = new CandidateUploadService({ callFunction }, "develop");
    const success = await service.submitSynthetic({
      fixtureId: "synthetic-a",
      shareDecision: "SHARE",
      idempotencyKey: "synthetic-a-upload",
    });
    const uploads = await service.listMyUploads();
    expect(uploads[0]?.candidateRecordRef).toBe(success?.candidateRecordRef);
    expect(uploads[0]?.observationVersion).toBe(success?.observationVersion);
    expect(await service.deleteMyUpload(ref, "delete-upload-a")).toBe(true);
    expect(callFunction).toHaveBeenLastCalledWith({
      name: "v2-shadow-manage-contribution",
      data: {
        operation: "DELETE_MY_UPLOAD",
        candidateRecordRef: ref,
        commandId: "delete-upload-a",
      },
    });
  });

  it("is unreachable in release/unknown environments", async () => {
    const callFunction = vi.fn(async () => ({ result: { ok: true } }));
    for (const version of ["release", "unknown"] as const) {
      const service = new CandidateUploadService({ callFunction }, version);
      expect(await service.listMyUploads()).toEqual([]);
      expect(
        await service.submitSynthetic({
          fixtureId: "synthetic-a",
          shareDecision: "SHARE",
          idempotencyKey: "synthetic-a-upload",
        }),
      ).toBeNull();
      expect(await service.deleteMyUpload(ref, "delete-upload-a")).toBe(false);
    }
    expect(callFunction).not.toHaveBeenCalled();
  });

  it("excludes unshared and deleted synthetic records from My Uploads", async () => {
    const makeRow = (
      suffix: string,
      shareDecision: "SHARE" | "DO_NOT_SHARE",
      lifecycle: "ACTIVE" | "DELETED",
    ) => ({
      candidateRecordRef: `candidate:${suffix.repeat(40)}`,
      observationVersion: "verified-v1",
      validationState: "VERIFIED",
      shareDecision,
      lifecycle,
      boardInstanceId: null,
    });
    const callFunction = vi.fn(async () => ({
      result: {
        ok: true,
        uploads: [
          makeRow("a", "SHARE", "ACTIVE"),
          makeRow("b", "DO_NOT_SHARE", "ACTIVE"),
          makeRow("c", "SHARE", "DELETED"),
        ],
      },
    }));
    const service = new CandidateUploadService({ callFunction }, "develop");
    expect(await service.listMyUploads()).toEqual([
      makeRow("a", "SHARE", "ACTIVE"),
    ]);
  });

  it("validates and sends the current versioned consent contract", async () => {
    const consent = {
      termsVersion: "candidate-map-contribution-v3",
      scopeDigest: "d".repeat(64),
      accepted: false,
      acceptedAt: null,
      status: "NOT_ACCEPTED",
    } as const;
    const callFunction = vi.fn(
      async ({ data }: { data: Record<string, unknown> }) =>
        data.operation === "GET_MAP_CONTRIBUTION_CONSENT"
          ? { result: { ok: true, ...consent } }
          : { result: { ok: true, accepted: true } },
    );
    const service = new CandidateUploadService({ callFunction }, "develop");
    expect(await service.getMapContributionConsent()).toEqual(consent);
    expect(
      await service.acceptMapContributionTerms(consent, "consent-a-001"),
    ).toBe(true);
    expect(callFunction).toHaveBeenLastCalledWith({
      name: "v2-shadow-manage-contribution",
      data: {
        operation: "ACCEPT_MAP_CONTRIBUTION_TERMS",
        termsVersion: consent.termsVersion,
        scopeDigest: consent.scopeDigest,
        commandId: "consent-a-001",
      },
    });
  });
});
