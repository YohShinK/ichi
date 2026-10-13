import {
  fail,
  ok,
  type ContractResult,
  type PlayerRecordType,
} from "./types.js";

export interface MapContributionAuthorization {
  readonly authorizationVersion: string;
  readonly ownerAccountId: string;
  readonly acceptedAt: string;
  readonly scope: {
    readonly history: boolean;
    readonly future: boolean;
    readonly recordTypes: readonly PlayerRecordType[];
    readonly publicLocation: boolean;
    readonly eligibleVenueNote: boolean;
    readonly safeContributorProfile: boolean;
  };
  readonly scopeDigest: string;
}

export type AuthorizationError =
  | "UNTRUSTED_ACTOR"
  | "IDEMPOTENCY_CONFLICT"
  | "AUTHORIZATION_VERSION_CONFLICT"
  | "AUTHORIZATION_MISSING"
  | "AUTHORIZATION_OWNER_MISMATCH"
  | "AUTHORIZATION_SCOPE_MISMATCH"
  | "RECORD_WITHDRAWN"
  | "RIGHTS_INELIGIBLE";

export interface AuthorizationLedger {
  readonly byVersion: Readonly<Record<string, MapContributionAuthorization>>;
  readonly idempotency: Readonly<Record<string, string>>;
}

export const acceptMapAuthorization = (
  ledger: AuthorizationLedger,
  command: {
    readonly trustedAccountId: string;
    readonly idempotencyKey: string;
    readonly authorization: MapContributionAuthorization;
  },
): ContractResult<AuthorizationLedger, AuthorizationError> => {
  if (command.trustedAccountId !== command.authorization.ownerAccountId) {
    return fail("UNTRUSTED_ACTOR");
  }
  const priorDigest = ledger.idempotency[command.idempotencyKey];
  if (priorDigest && priorDigest !== command.authorization.scopeDigest) {
    return fail("IDEMPOTENCY_CONFLICT");
  }
  const key = `${command.authorization.ownerAccountId}:${command.authorization.authorizationVersion}`;
  const priorVersion = ledger.byVersion[key];
  if (
    priorVersion &&
    priorVersion.scopeDigest !== command.authorization.scopeDigest
  ) {
    return fail("AUTHORIZATION_VERSION_CONFLICT");
  }
  return ok({
    byVersion: { ...ledger.byVersion, [key]: command.authorization },
    idempotency: {
      ...ledger.idempotency,
      [command.idempotencyKey]: command.authorization.scopeDigest,
    },
  });
};

export interface AuthorizationApplicabilityInput {
  readonly ownerAccountId: string;
  readonly authorizationVersion: string;
  readonly recordType: PlayerRecordType;
  readonly temporalScope: "HISTORY" | "FUTURE";
  readonly withdrawn: boolean;
  readonly rightsEligible: boolean;
}

export const evaluateAuthorizationApplicability = (
  ledger: AuthorizationLedger,
  input: AuthorizationApplicabilityInput,
): ContractResult<MapContributionAuthorization, AuthorizationError> => {
  const key = `${input.ownerAccountId}:${input.authorizationVersion}`;
  const authorization = ledger.byVersion[key];
  if (!authorization) return fail("AUTHORIZATION_MISSING");
  if (authorization.ownerAccountId !== input.ownerAccountId) {
    return fail("AUTHORIZATION_OWNER_MISMATCH");
  }
  if (
    !authorization.scope.recordTypes.includes(input.recordType) ||
    (input.temporalScope === "HISTORY" && !authorization.scope.history) ||
    (input.temporalScope === "FUTURE" && !authorization.scope.future)
  ) {
    return fail("AUTHORIZATION_SCOPE_MISMATCH");
  }
  if (input.withdrawn) return fail("RECORD_WITHDRAWN");
  if (!input.rightsEligible) return fail("RIGHTS_INELIGIBLE");
  return ok(authorization);
};

export interface OwnerControlledContribution {
  readonly contributionId: string;
  readonly ownerAccountId: string;
  readonly authorizationApplicable: boolean;
  readonly lifecycle: "ACTIVE" | "WITHDRAWN" | "DELETED";
  readonly publicHideIntent: boolean;
  readonly noResurrection: boolean;
  readonly processedCommandIds: readonly string[];
}

export const applyOwnerContributionCommand = (
  contribution: OwnerControlledContribution,
  command: {
    readonly trustedAccountId: string;
    readonly commandId: string;
    readonly action: "WITHDRAW" | "DELETE";
  },
): ContractResult<OwnerControlledContribution, "UNTRUSTED_ACTOR"> => {
  if (contribution.ownerAccountId !== command.trustedAccountId) {
    return fail("UNTRUSTED_ACTOR");
  }
  if (contribution.processedCommandIds.includes(command.commandId)) {
    return ok(contribution);
  }
  return ok({
    ...contribution,
    authorizationApplicable: false,
    lifecycle: command.action === "DELETE" ? "DELETED" : "WITHDRAWN",
    publicHideIntent: true,
    noResurrection: command.action === "DELETE" || contribution.noResurrection,
    processedCommandIds: [
      ...contribution.processedCommandIds,
      command.commandId,
    ],
  });
};
