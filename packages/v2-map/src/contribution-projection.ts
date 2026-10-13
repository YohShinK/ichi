/** Candidate-only contribution facts. Caller identity and chronology are server issued. */
export interface CandidateContribution {
  readonly contributionId: string;
  readonly candidateRecordRef: string;
  readonly fixtureId: string;
  readonly ownerSubjectDigest: string;
  readonly boardInstanceId: string;
  readonly observationVersionId: string;
  readonly observationVersion: string;
  readonly lifecycle: "ACTIVE" | "DELETED";
  readonly shareDecision: "SHARE";
  readonly eligible: boolean;
  readonly observedAt: string;
  readonly publicSafeNote: string | null;
  readonly contributor: PublicContributorView | null;
  readonly dataOrigin: "SYNTHETIC_REHEARSAL";
}

export interface ContributionProjection {
  readonly support: readonly CandidateContribution[];
  readonly contributors: readonly PublicContributorView[];
  readonly venueNote: string | null;
}

const validTime = (value: string): number => {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : Number.NEGATIVE_INFINITY;
};

/** Never infer ownership from publicLeadId; every row must belong to this instance. */
export const projectContributions = (
  boardInstanceId: string,
  rows: readonly CandidateContribution[],
): ContributionProjection => {
  const ordered = rows
    .filter(
      (row) =>
        row.boardInstanceId === boardInstanceId &&
        row.dataOrigin === "SYNTHETIC_REHEARSAL" &&
        validTime(row.observedAt) > Number.NEGATIVE_INFINITY,
    )
    .sort(
      (a, b) =>
        validTime(b.observedAt) - validTime(a.observedAt) ||
        b.observationVersion.localeCompare(a.observationVersion) ||
        b.contributionId.localeCompare(a.contributionId),
    );
  const byContribution = new Map<string, CandidateContribution>();
  for (const row of ordered)
    if (!byContribution.has(row.contributionId))
      byContribution.set(row.contributionId, row);
  const support = [...byContribution.values()].filter(
    (row) =>
      row.lifecycle === "ACTIVE" &&
      row.eligible === true &&
      row.shareDecision === "SHARE",
  );
  const seenSubjects = new Set<string>();
  const contributors: PublicContributorView[] = [];
  for (const row of support) {
    if (seenSubjects.has(row.ownerSubjectDigest)) continue;
    seenSubjects.add(row.ownerSubjectDigest);
    contributors.push({
      displayName: row.contributor?.displayName?.trim() || "ICHI 玩家",
      avatar: row.contributor?.avatar ?? {
        kind: "FALLBACK_ASSET",
        path: "/assets/v1-29/ichi-avatar.png",
      },
    });
  }
  return {
    support,
    contributors,
    venueNote:
      support
        .map((row) => row.publicSafeNote?.trim() || null)
        .find((note): note is string => note !== null) ?? null,
  };
};
import type { PublicContributorView } from "./avatar-projection.js";
