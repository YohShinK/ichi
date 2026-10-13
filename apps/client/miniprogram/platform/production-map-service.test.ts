import type { CandidateCloudApi } from "./public-map-candidate-service.js";
import { describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import { createHash } from "node:crypto";
import {
  MAP_CONTRIBUTION_TERMS,
  MAP_CONTRIBUTION_TERMS_INTRO,
} from "./map-contribution-terms.js";
import {
  ProductionMapContributionService,
  PRODUCTION_MAP_TERMS,
  UPLOAD_SHARING_DISCLOSURE_VERSION,
} from "./production-map-service.js";
import { CandidatePublicMapService } from "./public-map-candidate-service.js";
import { CandidateReportingService } from "./public-map-reporting.js";
import {
  createDefaultPublicMapQuery,
  createPublicViewportRequest,
} from "./public-map-query.js";

describe("production map boundary", () => {
  it("delivers only the explicit upload intent to V1 before account consent and verification", async () => {
    const recordId = `record_${"b".repeat(32)}`,
      values = new Map<string, string>();
    const callFunction = vi.fn<CandidateCloudApi["callFunction"]>(
      async ({ data }) => ({
        result: {
          ok: true,
          data: { recordId: data.recordId, uploadSharingAcknowledged: true },
        },
      }),
    );
    const service = new ProductionMapContributionService(
      { callFunction },
      {
        getItem: (k: string) => values.get(k) ?? null,
        setItem: (k: string, v: string) => {
          values.set(k, v);
        },
      },
    );
    await service.flushSharedUploads();
    expect(callFunction).not.toHaveBeenCalled();
    service.rememberSharedUpload(recordId);
    await service.flushSharedUploads();
    expect(callFunction).toHaveBeenCalledWith({
      name: "finalize-board-observation",
      data: {
        action: "confirm-upload-sharing",
        recordId,
        uploadSharing: {
          disclosureVersion: UPLOAD_SHARING_DISCLOSURE_VERSION,
          rightsAttested: true,
        },
      },
    });
    expect(service.sharedUploadAcknowledged(recordId)).toBe(true);
    expect(JSON.parse([...values.values()][0]!)).toEqual([]);
    expect(
      callFunction.mock.calls.some(([r]) => r.name.startsWith("manage-map")),
    ).toBe(false);
  });
  it("retains a device intent on network failure or a receipt for another record, and clears only a matching V1 receipt", async () => {
    const recordId = `record_${"b".repeat(32)}`,
      values = new Map<string, string>();
    let mode = "network";
    const callFunction = vi.fn<CandidateCloudApi["callFunction"]>(async () => {
      if (mode === "network") throw new Error("offline");
      return {
        result: {
          ok: true,
          data: {
            recordId: mode === "wrong" ? `record_${"c".repeat(32)}` : recordId,
            uploadSharingAcknowledged: true,
          },
        },
      };
    });
    const storage = {
      getItem: (k: string) => values.get(k) ?? null,
      setItem: (k: string, v: string) => {
        values.set(k, v);
      },
    };
    const service = new ProductionMapContributionService(
      { callFunction },
      storage,
    );
    service.rememberSharedUpload(recordId);
    await service.flushSharedUploads();
    mode = "wrong";
    await service.flushSharedUploads();
    expect(JSON.parse([...values.values()][0]!)).toEqual([recordId]);
    mode = "received";
    const reopened = new ProductionMapContributionService(
      { callFunction },
      storage,
    );
    await reopened.flushSharedUploads();
    expect(reopened.sharedUploadAcknowledged(recordId)).toBe(true);
    expect(JSON.parse([...values.values()][0]!)).toEqual([]);
  });
  it("recovers one transient terms read without retrying an incompatible policy", async () => {
    const callFunction = vi
      .fn<CandidateCloudApi["callFunction"]>()
      .mockResolvedValueOnce({
        result: { ok: false, code: "SERVICE_UNAVAILABLE" },
      })
      .mockResolvedValueOnce({
        result: {
          ok: true,
          ...{
            termsVersion: PRODUCTION_MAP_TERMS.version,
            scopeDigest: PRODUCTION_MAP_TERMS.scopeDigest,
          },
          accepted: false,
        },
      });
    const service = new ProductionMapContributionService({ callFunction });
    expect(await service.getMapContributionConsent()).toMatchObject({
      status: "NOT_ACCEPTED",
    });
    expect(callFunction).toHaveBeenCalledTimes(2);
    callFunction.mockReset().mockResolvedValue({
      result: {
        ok: true,
        termsVersion: "old",
        scopeDigest: "a".repeat(64),
        accepted: true,
      },
    });
    expect(await service.getMapContributionConsent()).toBeNull();
    expect(callFunction).toHaveBeenCalledTimes(1);
  });
  it("bounds transient terms failures and leaves acceptance as one explicit request", async () => {
    const callFunction = vi.fn<CandidateCloudApi["callFunction"]>(async () => ({
      result: { ok: false, code: "SERVICE_UNAVAILABLE" },
    }));
    const service = new ProductionMapContributionService({ callFunction });
    expect(await service.getMapContributionConsent()).toBeNull();
    expect(callFunction).toHaveBeenCalledTimes(2);
    callFunction.mockClear();
    expect(
      await service.acceptMapContributionTerms(
        {
          termsVersion: PRODUCTION_MAP_TERMS.version,
          scopeDigest: PRODUCTION_MAP_TERMS.scopeDigest,
          accepted: false,
          acceptedAt: null,
          status: "NOT_ACCEPTED",
        },
        "accept_current_terms",
      ),
    ).toBe(false);
    expect(callFunction).toHaveBeenCalledTimes(1);
    expect(callFunction.mock.calls[0]?.[0].data.command).toBe("ACCEPT");
  });
  it("binds account consent for previous completed V1 uploads to its explicit terms scope", () => {
    const candidate = JSON.parse(
      fs.readFileSync(
        "artifacts/task22/phase2-uploaded-v1-consent/formal-policy-candidate.json",
        "utf8",
      ),
    );
    const stable = (v: unknown) =>
      JSON.stringify(v, (_k, x) =>
        x && typeof x === "object" && !Array.isArray(x)
          ? Object.fromEntries(
              Object.keys(x)
                .sort()
                .map((k) => [k, x[k]]),
            )
          : x,
      );
    const sha = (v: string) => createHash("sha256").update(v).digest("hex");
    expect(candidate.terms).toMatchObject(PRODUCTION_MAP_TERMS);
    expect(candidate.terms.uploadSharingScope).toBe("UPLOADED_V1_RECORDS");
    expect(candidate.terms.rightsAttestationIncluded).toBe(true);
    expect(candidate.status).toBe("LOCAL_V3_CANDIDATE");
    expect(candidate.termsTextSha256).toBe(
      sha(
        stable({
          intro: MAP_CONTRIBUTION_TERMS_INTRO,
          sections: MAP_CONTRIBUTION_TERMS,
        }),
      ),
    );
    expect(candidate.terms.scopeDigest).toBe(sha(stable(candidate.scope)));
    expect(candidate.previousProductionTerms).not.toEqual(candidate.terms);
  });
  it("routes release reads to production while candidate release stays closed", async () => {
    const callFunction = vi.fn<CandidateCloudApi["callFunction"]>(async () => ({
      result: { ok: false, code: "SERVICE_UNAVAILABLE" },
    }));
    const request = createPublicViewportRequest({
      query: createDefaultPublicMapQuery(),
      limit: 20,
      cursor: null,
      asOf: null,
      requestId: "production-routing",
      generation: 1,
    });
    await new CandidatePublicMapService({ callFunction }, "release").query(
      request,
    );
    expect(callFunction).not.toHaveBeenCalled();
    await new CandidatePublicMapService(
      { callFunction },
      "release",
      "production",
    ).query(request);
    expect(callFunction).toHaveBeenCalledWith({
      name: "query-public-map-leads",
      data: request,
    });
    await new CandidatePublicMapService(
      { callFunction },
      "release",
      "production",
    ).detail({
      publicLeadId: "a".repeat(32),
      requestId: "detail-production",
      generation: 1,
      supportedSchemaVersions: ["public-map-v1"],
    });
    expect(callFunction.mock.calls[1]?.[0].name).toBe(
      "get-public-map-lead-detail",
    );
  });
  it("does not accept a shadow or stale terms scope", async () => {
    const callFunction = vi.fn<CandidateCloudApi["callFunction"]>(async () => ({
      result: {
        ok: true,
        termsVersion: "candidate-map-contribution-v1",
        scopeDigest: "d".repeat(64),
        accepted: true,
      },
    }));
    const service = new ProductionMapContributionService({ callFunction });
    expect(await service.getMapContributionConsent()).toBeNull();
    expect(
      await service.acceptMapContributionTerms(
        {
          termsVersion: "old",
          scopeDigest: "d".repeat(64),
          accepted: false,
          acceptedAt: null,
          status: "NOT_ACCEPTED",
        },
        "consent-action-1",
      ),
    ).toBe(false);
    expect(callFunction).toHaveBeenCalledTimes(1);
  });
  it("sends the exact formal scope with a valid action ID", async () => {
    const callFunction = vi.fn<CandidateCloudApi["callFunction"]>(async () => ({
      result: {
        ok: true,
        termsVersion: PRODUCTION_MAP_TERMS.version,
        scopeDigest: PRODUCTION_MAP_TERMS.scopeDigest,
        accepted: true,
      },
    }));
    const service = new ProductionMapContributionService({ callFunction });
    const consent = await service.getMapContributionConsent();
    expect(consent?.status).toBe("ACCEPTED");
    expect(
      await service.acceptMapContributionTerms(consent!, "consent-action-1"),
    ).toBe(true);
    expect(
      callFunction.mock.calls.find(([r]) => r.data.command === "ACCEPT")?.[0],
    ).toEqual({
      name: "manage-map-contribution-consent",
      data: {
        command: "ACCEPT",
        termsVersion: PRODUCTION_MAP_TERMS.version,
        scopeDigest: PRODUCTION_MAP_TERMS.scopeDigest,
        actionId: "consent-action-1",
      },
    });
  });
  it("routes release reporting to the formal function", async () => {
    const callFunction = vi.fn<CandidateCloudApi["callFunction"]>(async () => ({
      result: {
        ok: true,
        active: false,
        hidden: false,
        policyVersion: "v2-21-report-policy-1",
      },
    }));
    expect(
      await new CandidateReportingService(
        { callFunction },
        "release",
        "production",
      ).command("a".repeat(32), "GET_STATE"),
    ).toEqual({
      ok: true,
      active: false,
      hidden: false,
      policyVersion: "v2-21-report-policy-1",
    });
    expect(callFunction.mock.calls[0]?.[0].name).toBe("report-public-map-lead");
  });
});

describe("automatic own metadata audit after current accepted terms", () => {
  it("runs bounded server-owned note pages without another acceptance or share command", async () => {
    let pages = 0;
    const callFunction = vi.fn<CandidateCloudApi["callFunction"]>(
      async ({ name }) =>
        name === "manage-map-contribution-consent"
          ? {
              result: {
                ok: true,
                termsVersion: PRODUCTION_MAP_TERMS.version,
                scopeDigest: PRODUCTION_MAP_TERMS.scopeDigest,
                accepted: true,
              },
            }
          : {
              result: {
                ok: true,
                data: { hasMore: ++pages < 2, deferred: false },
              },
            },
    );
    const service = new ProductionMapContributionService({ callFunction });
    expect((await service.getMapContributionConsent())?.accepted).toBe(true);
    await vi.waitFor(() => expect(pages).toBe(2));
    expect(
      callFunction.mock.calls
        .slice(1)
        .every(
          ([r]) =>
            r.name === "bind-wechat-profile" &&
            r.data.action === "sync-map-metadata",
        ),
    ).toBe(true);
    expect(
      callFunction.mock.calls.some(([r]) => r.data.command === "ACCEPT"),
    ).toBe(false);
  });
});
