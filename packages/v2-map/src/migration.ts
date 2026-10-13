import { isPublicCandidate, type PublicCandidate } from "./projector.js";

export interface MigrationDryRunReport {
  readonly mode: "DRY_RUN_ONLY";
  readonly inputCount: number;
  readonly eligibleCount: number;
  readonly rejectedCount: number;
  readonly rejectionCounts: Readonly<Record<string, number>>;
  readonly containsPrivateRows: false;
  readonly mutationCount: 0;
}

export const dryRunPublicMapMigration = (
  candidates: readonly PublicCandidate[],
): MigrationDryRunReport => {
  const rejectionCounts: Record<string, number> = {};
  let eligibleCount = 0;
  for (const candidate of candidates) {
    const reasons: string[] = [];
    if (!isPublicCandidate(candidate)) {
      rejectionCounts.UNTRUSTED_CANDIDATE =
        (rejectionCounts.UNTRUSTED_CANDIDATE ?? 0) + 1;
      continue;
    }
    if (!candidate.gates.verified) reasons.push("NOT_VERIFIED");
    if (!candidate.gates.opportunityPass) reasons.push("OPPORTUNITY_NOT_PASS");
    if (!candidate.gates.sourceCurrent) reasons.push("SOURCE_NOT_CURRENT");
    if (!candidate.gates.authorizationApplicable)
      reasons.push("AUTHORIZATION_NOT_APPLICABLE");
    if (!candidate.gates.rightsEligible) reasons.push("RIGHTS_NOT_ELIGIBLE");
    if (!candidate.gates.publicEligible) reasons.push("PUBLIC_NOT_ELIGIBLE");
    if (!candidate.gates.moderationVisible) reasons.push("MODERATION_HIDDEN");
    if (candidate.gates.deleted) reasons.push("DELETED");
    if (!candidate.publicLocation) reasons.push("NO_PUBLIC_LOCATION");
    if (reasons.length === 0) {
      eligibleCount += 1;
    } else {
      for (const reason of reasons) {
        rejectionCounts[reason] = (rejectionCounts[reason] ?? 0) + 1;
      }
    }
  }
  return {
    mode: "DRY_RUN_ONLY",
    inputCount: candidates.length,
    eligibleCount,
    rejectedCount: candidates.length - eligibleCount,
    rejectionCounts,
    containsPrivateRows: false,
    mutationCount: 0,
  };
};
