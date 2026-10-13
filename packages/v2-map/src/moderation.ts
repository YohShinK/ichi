import { fail, ok, type ContractResult } from "./types.js";

export interface ModerationPolicy {
  readonly policyVersion: string;
  readonly autoHideDistinctEligibleReports: number;
}

/** A cancelled report may reduce the count; only trusted re-review can restore. */
export const visibilityAfterActiveReports = (
  visibility: ModerationState["visibility"],
  activeDistinctEligibleReporters: number,
  policy: ModerationPolicy,
): ModerationState["visibility"] =>
  visibility === "VISIBLE" &&
  activeDistinctEligibleReporters >= policy.autoHideDistinctEligibleReports
    ? "HIDDEN"
    : visibility;

export interface ModerationReport {
  readonly reportId: string;
  readonly publicLeadId: string;
  readonly reporterAccountId: string;
  readonly submittedAt: string;
  readonly eligible: boolean;
  readonly spamOrInvalid: boolean;
}

export interface ModerationState {
  readonly publicLeadId: string;
  readonly verification: "VERIFIED";
  readonly visibility: "VISIBLE" | "HIDDEN" | "RETIRED";
  readonly ownerWithdrawal: boolean;
  readonly takedownActive: boolean;
  readonly reviewRequired: boolean;
  readonly reportsByReporter: Readonly<Record<string, ModerationReport>>;
  readonly audit: readonly ModerationAuditEvent[];
}

export interface ModerationAuditEvent {
  readonly auditId: string;
  readonly publicLeadId: string;
  readonly eventType:
    | "REPORT_RECORDED"
    | "REPORT_DUPLICATE"
    | "AUTO_HIDE"
    | "CREDIBLE_NOTICE_HIDE"
    | "OWNER_WITHDRAW_HIDE"
    | "ADMIN_DECISION";
  readonly actorClass: "REPORTER" | "OWNER" | "MODERATOR" | "SYSTEM";
  readonly policyVersion: string;
  readonly createdAt: string;
  readonly reasonCode: string;
}

export const initialModerationState = (
  publicLeadId: string,
): ModerationState => ({
  publicLeadId,
  verification: "VERIFIED",
  visibility: "VISIBLE",
  ownerWithdrawal: false,
  takedownActive: false,
  reviewRequired: false,
  reportsByReporter: {},
  audit: [],
});

export type ModerationError =
  | "UNAUTHENTICATED_REPORTER"
  | "TARGET_MISMATCH"
  | "UNAUTHORIZED_ACTOR"
  | "AUTHORITY_UNAVAILABLE"
  | "INVALID_POLICY";

export interface ClientReportRequest {
  readonly publicLeadId: string;
  readonly category: string;
  readonly reason: string | null;
  readonly clientActionId: string;
  readonly submittedAt: string;
}

export interface TrustedReporterContext {
  readonly reporterAccountId: string;
  readonly eligible: boolean;
  readonly spamOrInvalid: boolean;
}

export interface ReporterAuthorityPort {
  resolveReporter(request: ClientReportRequest): TrustedReporterContext | null;
}

export interface ClientCredibleNoticeRequest {
  readonly publicLeadId: string;
  readonly noticeId: string;
  readonly category: string;
  readonly createdAt: string;
}

export interface ClientModerationDecisionRequest {
  readonly publicLeadId: string;
  readonly decision: "KEEP_HIDDEN" | "RESTORE" | "RETIRE";
  readonly decisionId: string;
  readonly createdAt: string;
}

export interface TrustedModeratorContext {
  readonly moderatorAccountId: string;
  readonly isAuthorizedModerator: boolean;
  readonly credibleNotice: boolean;
}

export interface ModeratorAuthorityPort {
  resolveModerator(
    request: ClientCredibleNoticeRequest | ClientModerationDecisionRequest,
  ): TrustedModeratorContext | null;
}

export interface OwnerAuthorityPort {
  currentAccountId(): string | null;
  ownerAccountIdFor(publicLeadId: string): string | null;
}

/**
 * Production-facing boundary. Client payloads contain no identity, eligibility,
 * spam, moderator privilege, credible-notice, or owner assertions.
 */
export class TrustedModerationService {
  constructor(
    readonly reporterAuthority: ReporterAuthorityPort,
    readonly moderatorAuthority: ModeratorAuthorityPort,
    readonly ownerAuthority: OwnerAuthorityPort,
  ) {}

  submitReport(
    state: ModerationState,
    request: ClientReportRequest,
    policy: ModerationPolicy,
  ): ContractResult<ModerationState, ModerationError> {
    const trusted = this.reporterAuthority.resolveReporter(request);
    if (!trusted) return fail("AUTHORITY_UNAVAILABLE");
    return submitModerationReport(
      state,
      {
        reportId: request.clientActionId,
        publicLeadId: request.publicLeadId,
        reporterAccountId: trusted.reporterAccountId,
        submittedAt: request.submittedAt,
        eligible: trusted.eligible,
        spamOrInvalid: trusted.spamOrInvalid,
      },
      policy,
    );
  }

  applyCredibleNotice(
    state: ModerationState,
    request: ClientCredibleNoticeRequest,
    policyVersion: string,
  ): ContractResult<ModerationState, ModerationError> {
    const trusted = this.moderatorAuthority.resolveModerator(request);
    if (!trusted) return fail("AUTHORITY_UNAVAILABLE");
    return applyCredibleNotice(state, {
      moderatorAccountId: trusted.moderatorAccountId,
      authorized: trusted.isAuthorizedModerator,
      credible: trusted.credibleNotice,
      noticeId: request.noticeId,
      policyVersion,
      createdAt: request.createdAt,
    });
  }

  applyDecision(
    state: ModerationState,
    request: ClientModerationDecisionRequest,
    policyVersion: string,
  ): ContractResult<ModerationState, ModerationError> {
    const trusted = this.moderatorAuthority.resolveModerator(request);
    if (!trusted) return fail("AUTHORITY_UNAVAILABLE");
    return applyModerationDecision(state, {
      moderatorAccountId: trusted.moderatorAccountId,
      authorized: trusted.isAuthorizedModerator,
      decision: request.decision,
      decisionId: request.decisionId,
      policyVersion,
      createdAt: request.createdAt,
    });
  }

  withdrawOwner(
    state: ModerationState,
    request: {
      readonly publicLeadId: string;
      readonly commandId: string;
      readonly createdAt: string;
    },
    policyVersion: string,
  ): ContractResult<ModerationState, ModerationError> {
    const trustedAccountId = this.ownerAuthority.currentAccountId();
    const expectedOwnerAccountId = this.ownerAuthority.ownerAccountIdFor(
      request.publicLeadId,
    );
    if (!trustedAccountId || !expectedOwnerAccountId) {
      return fail("AUTHORITY_UNAVAILABLE");
    }
    return applyOwnerWithdrawal(state, {
      trustedOwnerAccountId: trustedAccountId,
      expectedOwnerAccountId,
      commandId: request.commandId,
      policyVersion,
      createdAt: request.createdAt,
    });
  }
}

const audit = (
  state: ModerationState,
  event: ModerationAuditEvent,
): ModerationState => ({ ...state, audit: [...state.audit, event] });

export const submitModerationReport = (
  state: ModerationState,
  report: ModerationReport,
  policy: ModerationPolicy,
): ContractResult<ModerationState, ModerationError> => {
  if (report.reporterAccountId.trim().length === 0) {
    return fail("UNAUTHENTICATED_REPORTER");
  }
  if (report.publicLeadId !== state.publicLeadId) {
    return fail("TARGET_MISMATCH");
  }
  if (
    !Number.isInteger(policy.autoHideDistinctEligibleReports) ||
    policy.autoHideDistinctEligibleReports < 1
  ) {
    return fail("INVALID_POLICY");
  }
  if (state.reportsByReporter[report.reporterAccountId]) {
    return ok(
      audit(state, {
        auditId: `duplicate:${report.reportId}`,
        publicLeadId: state.publicLeadId,
        eventType: "REPORT_DUPLICATE",
        actorClass: "REPORTER",
        policyVersion: policy.policyVersion,
        createdAt: report.submittedAt,
        reasonCode: "DUPLICATE_REPORTER_TARGET",
      }),
    );
  }

  const next = audit(
    {
      ...state,
      reportsByReporter: {
        ...state.reportsByReporter,
        [report.reporterAccountId]: report,
      },
    },
    {
      auditId: `report:${report.reportId}`,
      publicLeadId: state.publicLeadId,
      eventType: "REPORT_RECORDED",
      actorClass: "REPORTER",
      policyVersion: policy.policyVersion,
      createdAt: report.submittedAt,
      reasonCode:
        report.eligible && !report.spamOrInvalid
          ? "ELIGIBLE_REPORT"
          : "EXCLUDED_REPORT",
    },
  );
  const distinctEligible = Object.values(next.reportsByReporter).filter(
    (item) => item.eligible && !item.spamOrInvalid,
  ).length;
  if (distinctEligible < policy.autoHideDistinctEligibleReports) {
    return ok(next);
  }

  return ok(
    audit(
      {
        ...next,
        visibility: visibilityAfterActiveReports(
          next.visibility,
          distinctEligible,
          policy,
        ),
        reviewRequired: true,
      },
      {
        auditId: `auto-hide:${policy.policyVersion}:${distinctEligible}`,
        publicLeadId: state.publicLeadId,
        eventType: "AUTO_HIDE",
        actorClass: "SYSTEM",
        policyVersion: policy.policyVersion,
        createdAt: report.submittedAt,
        reasonCode: "DISTINCT_ELIGIBLE_REPORT_THRESHOLD",
      },
    ),
  );
};

export const applyCredibleNotice = (
  state: ModerationState,
  command: {
    readonly moderatorAccountId: string;
    readonly authorized: boolean;
    readonly credible: boolean;
    readonly noticeId: string;
    readonly policyVersion: string;
    readonly createdAt: string;
  },
): ContractResult<ModerationState, ModerationError> => {
  if (!command.authorized || command.moderatorAccountId.trim().length === 0) {
    return fail("UNAUTHORIZED_ACTOR");
  }
  if (!command.credible) return ok(state);
  return ok(
    audit(
      {
        ...state,
        visibility: "HIDDEN",
        takedownActive: true,
        reviewRequired: true,
      },
      {
        auditId: `notice:${command.noticeId}`,
        publicLeadId: state.publicLeadId,
        eventType: "CREDIBLE_NOTICE_HIDE",
        actorClass: "MODERATOR",
        policyVersion: command.policyVersion,
        createdAt: command.createdAt,
        reasonCode: "CREDIBLE_RIGHTS_PRIVACY_SAFETY_NOTICE",
      },
    ),
  );
};

export const applyOwnerWithdrawal = (
  state: ModerationState,
  command: {
    readonly trustedOwnerAccountId: string;
    readonly expectedOwnerAccountId: string;
    readonly commandId: string;
    readonly policyVersion: string;
    readonly createdAt: string;
  },
): ContractResult<ModerationState, ModerationError> => {
  if (
    command.trustedOwnerAccountId !== command.expectedOwnerAccountId ||
    command.trustedOwnerAccountId.trim().length === 0
  ) {
    return fail("UNAUTHORIZED_ACTOR");
  }
  return ok(
    audit(
      { ...state, visibility: "HIDDEN", ownerWithdrawal: true },
      {
        auditId: `owner:${command.commandId}`,
        publicLeadId: state.publicLeadId,
        eventType: "OWNER_WITHDRAW_HIDE",
        actorClass: "OWNER",
        policyVersion: command.policyVersion,
        createdAt: command.createdAt,
        reasonCode: "OWNER_WITHDRAWAL",
      },
    ),
  );
};

export const applyModerationDecision = (
  state: ModerationState,
  command: {
    readonly moderatorAccountId: string;
    readonly authorized: boolean;
    readonly decision: "KEEP_HIDDEN" | "RESTORE" | "RETIRE";
    readonly decisionId: string;
    readonly policyVersion: string;
    readonly createdAt: string;
  },
): ContractResult<ModerationState, ModerationError> => {
  if (!command.authorized || command.moderatorAccountId.trim().length === 0) {
    return fail("UNAUTHORIZED_ACTOR");
  }
  const visibility =
    command.decision === "RETIRE"
      ? "RETIRED"
      : command.decision === "RESTORE" &&
          !state.ownerWithdrawal &&
          !state.takedownActive
        ? "VISIBLE"
        : "HIDDEN";
  return ok(
    audit(
      {
        ...state,
        visibility,
        reviewRequired: false,
      },
      {
        auditId: `decision:${command.decisionId}`,
        publicLeadId: state.publicLeadId,
        eventType: "ADMIN_DECISION",
        actorClass: "MODERATOR",
        policyVersion: command.policyVersion,
        createdAt: command.createdAt,
        reasonCode: command.decision,
      },
    ),
  );
};

export const minimalModerationRetention = (
  state: ModerationState,
): {
  readonly publicLeadId: string;
  readonly visibility: ModerationState["visibility"];
  readonly ownerWithdrawal: boolean;
  readonly takedownActive: boolean;
  readonly verification: "VERIFIED";
  readonly audit: readonly ModerationAuditEvent[];
} => ({
  publicLeadId: state.publicLeadId,
  visibility: state.visibility,
  ownerWithdrawal: state.ownerWithdrawal,
  takedownActive: state.takedownActive,
  verification: state.verification,
  audit: state.audit,
});
