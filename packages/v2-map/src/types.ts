export type SourceType =
  "V1_HISTORY" | "PLAYER_DIRECT" | "PLAYER_ASSISTED" | "NETWORK_SOURCE";

export type PlayerRecordType = "DRAW_RECORD" | "UPLOAD_RECORD";

export interface BoardTierFact {
  readonly tierCode: string;
  readonly rawLabel: string | null;
  readonly initialRemainingTickets: number | null;
  readonly remainingTickets: number | null;
  readonly isGrandPrize: boolean;
}

export interface BoardFacts {
  readonly schemaVersion: string;
  readonly ipName: string;
  readonly themeName: string | null;
  readonly pricePerDrawMinor: number | null;
  readonly tiers: readonly BoardTierFact[];
}

export interface ObservationLocation {
  readonly coordinateSystem: "GCJ02";
  readonly latitude: number;
  readonly longitude: number;
  readonly accuracyMeters: number;
  readonly capturedAt: string;
}

/** Private NETWORK-only location; PLAYER sources retain numeric accuracy. */
export interface NetworkVenueLocation extends Omit<
  ObservationLocation,
  "accuracyMeters"
> {
  readonly accuracyMeters: null;
  readonly venueReference: {
    readonly kind: "PUBLIC_VENUE_REFERENCE";
    readonly sourceUrl: string;
    readonly venueName: string;
    readonly scope: "STORE" | "MALL";
    readonly poiId: string;
    readonly providerUrl: string;
    readonly evidenceRef: string;
  };
}

export interface PlayerSourceProvenance {
  readonly sourceType: Exclude<SourceType, "NETWORK_SOURCE">;
  readonly originSourcePath: "direct-upload" | "assisted-draw";
  readonly sourceVersion: string;
  readonly ownerAccountId: string;
  readonly recordType: PlayerRecordType;
}

export interface NetworkSourceProvenance {
  readonly sourceType: "NETWORK_SOURCE";
  readonly sourceMode: "OFFICIAL_CURATED";
  readonly sourcePlatform: "XHS";
  readonly sourceVersion: string;
  readonly recordType: null;
  readonly ownerAccountId?: never;
  readonly originSourcePath?: never;
}
export type SourceProvenance = PlayerSourceProvenance | NetworkSourceProvenance;

export interface VerificationInput {
  readonly observationVersionId: string;
  readonly privateLineageId: string;
  readonly ownerAccountId?: string;
  readonly observedAt: string;
  readonly location: ObservationLocation | NetworkVenueLocation;
  readonly boardFacts: BoardFacts;
  readonly provenance: SourceProvenance;
  readonly note: {
    readonly text: string | null;
    readonly safetyProvenance: {
      readonly contentHash: string;
      readonly decision: "NOTE_PASSED";
      readonly decisionVersion: string;
    } | null;
  };
  readonly verificationInputOnly: true;
}

/** Backwards-compatible name for the private observation-shaped verification input. */
export type BoardObservationInput = VerificationInput;

export interface V1CurrentPublication {
  readonly recordId: string;
  readonly boardId: string;
  readonly ownerAccountId: string;
  readonly sourcePath: "direct-upload" | "assisted-draw";
  readonly lifecycleState: "CURRENT" | "DELETING" | "DELETED" | "SUPERSEDED";
  readonly observedAt: string;
  readonly location: ObservationLocation;
  readonly finalSnapshot: BoardFacts;
  readonly recognition: {
    readonly jobId: string;
    readonly status: "ACCEPTED" | "PENDING" | "FAILED";
    readonly correctionVersion: number;
  };
  readonly publishedSubmissionVersion: number | null;
}

export interface V1ApprovedDrawSubmission {
  readonly recordId: string;
  readonly boardId: string;
  readonly ownerAccountId: string;
  readonly submissionVersion: number;
  readonly status: "APPROVED" | "PENDING" | "FAILED";
  readonly finalSnapshot: BoardFacts;
  readonly userNote: string | null;
  readonly noteSafety: {
    readonly contentHash: string;
    readonly decision: "NOTE_PASSED" | "NOTE_FAILED";
    readonly decisionVersion: string;
  } | null;
}

export type ContractResult<T, C extends string> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly code: C };

export const ok = <T>(value: T): ContractResult<T, never> => ({
  ok: true,
  value,
});

export const fail = <C extends string>(code: C): ContractResult<never, C> => ({
  ok: false,
  code,
});
