import { describe, expect, it } from "vitest";

import {
  applyCredibleNotice,
  applyModerationDecision,
  applyOwnerWithdrawal,
  initialModerationState,
  minimalModerationRetention,
  submitModerationReport,
  type ModerationState,
} from "./index.js";

const policy = {
  policyVersion: "moderation-v1",
  autoHideDistinctEligibleReports: 10,
} as const;

const report = (index: number, eligible = true, spamOrInvalid = false) => ({
  reportId: `report-${index}`,
  publicLeadId: "public-1",
  reporterAccountId: `account-${index}`,
  submittedAt: `2026-09-12T00:${String(index).padStart(2, "0")}:00.000Z`,
  eligible,
  spamOrInvalid,
});

describe("TASK-V2-12 moderation", () => {
  it("deduplicates the same reporter and auto-hides only at 10 eligible distinct reports", () => {
    let state: ModerationState = initialModerationState("public-1");
    for (let index = 1; index <= 9; index += 1) {
      const result = submitModerationReport(state, report(index), policy);
      expect(result.ok).toBe(true);
      if (result.ok) state = result.value;
    }
    expect(state.visibility).toBe("VISIBLE");
    const duplicate = submitModerationReport(
      state,
      { ...report(99), reporterAccountId: "account-1" },
      policy,
    );
    expect(duplicate.ok).toBe(true);
    if (duplicate.ok) state = duplicate.value;
    expect(Object.keys(state.reportsByReporter)).toHaveLength(9);
    expect(state.visibility).toBe("VISIBLE");

    const tenth = submitModerationReport(state, report(10), policy);
    expect(tenth.ok).toBe(true);
    if (!tenth.ok) return;
    expect(tenth.value.visibility).toBe("HIDDEN");
    expect(tenth.value.reviewRequired).toBe(true);
    expect(tenth.value.verification).toBe("VERIFIED");
  });

  it("excludes spam/invalid reports and rejects an unauthenticated reporter", () => {
    const start = initialModerationState("public-1");
    const excluded = submitModerationReport(
      start,
      report(1, true, true),
      policy,
    );
    expect(excluded.ok).toBe(true);
    expect(excluded.ok && excluded.value.visibility).toBe("VISIBLE");
    expect(
      submitModerationReport(
        start,
        { ...report(2), reporterAccountId: "" },
        policy,
      ),
    ).toEqual({ ok: false, code: "UNAUTHENTICATED_REPORTER" });
  });

  it("applies a credible high-risk notice before the ordinary threshold", () => {
    const result = applyCredibleNotice(initialModerationState("public-1"), {
      moderatorAccountId: "moderator-1",
      authorized: true,
      credible: true,
      noticeId: "notice-1",
      policyVersion: "moderation-v1",
      createdAt: "2026-09-12T01:00:00.000Z",
    });
    expect(result.ok && result.value).toMatchObject({
      visibility: "HIDDEN",
      takedownActive: true,
      reviewRequired: true,
      verification: "VERIFIED",
    });
  });

  it("makes owner withdrawal precedence irreversible by a generic restore", () => {
    const withdrawn = applyOwnerWithdrawal(initialModerationState("public-1"), {
      trustedOwnerAccountId: "owner-a",
      expectedOwnerAccountId: "owner-a",
      commandId: "withdraw-1",
      policyVersion: "moderation-v1",
      createdAt: "2026-09-12T01:00:00.000Z",
    });
    expect(withdrawn.ok).toBe(true);
    if (!withdrawn.ok) return;
    const restore = applyModerationDecision(withdrawn.value, {
      moderatorAccountId: "moderator-1",
      authorized: true,
      decision: "RESTORE",
      decisionId: "decision-1",
      policyVersion: "moderation-v1",
      createdAt: "2026-09-12T01:01:00.000Z",
    });
    expect(restore.ok && restore.value.visibility).toBe("HIDDEN");
  });

  it("retains only structured minimal evidence without report payload text", () => {
    const result = submitModerationReport(
      initialModerationState("public-1"),
      report(1),
      policy,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const retained = minimalModerationRetention(result.value);
    expect(Object.keys(retained)).toEqual([
      "publicLeadId",
      "visibility",
      "ownerWithdrawal",
      "takedownActive",
      "verification",
      "audit",
    ]);
    expect(JSON.stringify(retained)).not.toContain("reporterAccountId");
  });
});
