import type {
  BoardFacts,
  ObservationLocation,
  NetworkVenueLocation,
} from "../../src/types.js";
import type {
  OfficialNetworkRecord,
  FounderNetworkApproval,
  NetworkRightsDecision,
} from "./phase3/types.js";
import type { PublicLocation } from "../../src/projector.js";

/** PLAYER reuses Phase2; official NETWORK has its own exact review/rights boundary. */
export type PlayerSourceAdapterInput = {
  readonly family: "PLAYER";
  readonly ownerAccountId: string;
  readonly sourceVersion: string;
  readonly shareIntent: "SHARE";
} & (
  | {
      readonly recordType: "DRAW_RECORD";
      readonly originSourcePath: "assisted-draw";
    }
  | {
      readonly recordType: "UPLOAD_RECORD";
      readonly originSourcePath: "direct-upload";
    }
);
export interface NetworkSourceAdapterInput {
  readonly family: "NETWORK";
  readonly sourcePlatform: "XHS";
  readonly sourceId: string;
  readonly contentDigest: string;
  readonly record: OfficialNetworkRecord;
  readonly approval: FounderNetworkApproval;
  readonly rights: NetworkRightsDecision;
  readonly noteSafety: ProductionVerificationInput["note"]["safetyProvenance"];
  readonly mode: "OFFICIAL_CURATED";
  readonly sourceVersion: string;
  readonly curatorAuthorityId: string;
  readonly reviewDecision: "APPROVE" | "FIX_AND_APPROVE";
  readonly reviewVersion: string;
  readonly reviewedAt: string;
  readonly sourcePublishedAt: string;
  readonly observedAt: string;
  readonly observedAtBasis: string;
  readonly rightsDecisionVersion: string;
}
export interface ProductionVerificationInput {
  readonly observationVersionId: string;
  readonly privateLineageId: string;
  readonly ownerAccountId?: string; // PLAYER requires it; NETWORK forbids it at runtime.
  readonly observedAt: string;
  readonly boardFacts: BoardFacts;
  readonly location: ObservationLocation | NetworkVenueLocation;
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
export interface PublicProjectionInput {
  readonly observationVersionId: string;
  readonly verifiedBoardVersion: string;
  readonly eligibilityDecision: "PASS";
  readonly eligibilityDecisionVersion: string;
  readonly locationPolicyVersion: string;
  readonly contributorProjectionOwnerAccountId?: string;
  readonly contributorProjectionVersion?: string;
  readonly publicFieldClassificationVersion: "public-map-v3" | "public-map-v4";
  readonly servingSchemaVersion?: "public-map-v4";
  readonly networkPolicyVersion?: "network-visibility-30d-v1";
  readonly publicUntil?: string;
  readonly publicLocation: PublicLocation;
  readonly boardShortLabel: string;
  readonly venueNote: string | null;
  readonly contributors: readonly {
    readonly displayName: string;
    readonly avatar:
      | {
          readonly kind: "FALLBACK_ASSET";
          readonly path: "/assets/v1-29/ichi-avatar.png";
        }
      | { readonly kind: "PUBLIC_URL"; readonly url: string };
  }[];
}
export interface ProductionBoardObservationInput {
  readonly schemaVersion:
    "map-source-boundary-phase1-v1" | "map-network-source-phase3-v1";
  readonly kind: "OBSERVATION_VERSION";
  readonly observationVersionId: string;
  readonly lineageId: string;
  readonly sourceVersion: string;
  readonly source: PlayerSourceAdapterInput | NetworkSourceAdapterInput;
  readonly input: ProductionVerificationInput;
  readonly lifecycleState: "CURRENT";
  readonly sourceCurrent: true;
  readonly locationKey: string;
  readonly rightsEligible: boolean;
  readonly verification: {
    readonly result: "VERIFIED";
    readonly verifiedBoardVersion: string;
    readonly verifiedBoardId: string;
    readonly verificationId: string;
    readonly policyVersion: string;
    readonly verifiedAt: string;
  };
  readonly publicProjection?: PublicProjectionInput;
}
export interface ProductionLineageHead {
  readonly kind: "LINEAGE_HEAD";
  readonly lineageId: string;
  readonly sourceVersion: string;
  readonly currentObservationVersionId: string;
  readonly lifecycleState: "CURRENT" | "DELETING" | "DELETED" | "SUPERSEDED";
  readonly ownerAccountId: string | null;
}
