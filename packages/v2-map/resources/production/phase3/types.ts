import type {
  BoardFacts,
  ObservationLocation,
  NetworkVenueLocation,
  VerificationInput,
} from "../../../src/types.js";

/** Private structured record. No source URL/evidence/curator field is a public DTO. */
export interface OfficialNetworkRecord {
  readonly schemaVersion: "map-network-source-phase3-v1";
  readonly sourceId: string; // SHA256 of canonical URL and optional boardEvidenceKey.
  readonly boardEvidenceKey?: string; // Separates multiple independently evidenced boards in one post.
  readonly sourceVersion: string;
  readonly sourceType: "NETWORK_SOURCE";
  readonly sourceMode: "OFFICIAL_CURATED";
  readonly sourcePlatform: "XHS";
  readonly sourceUrl: string;
  readonly sourcePublishedAt: string;
  readonly fetchedAt: string;
  readonly observedAtBasis:
    "SOURCE_PUBLISHED_AT_FALLBACK" | "SOURCE_PHOTO_TIMESTAMP";
  readonly observationEvidence: {
    readonly observedAt: string;
    readonly evidenceRef: string;
  } | null;
  readonly takedownOwnerId: string;
  readonly boardFacts: BoardFacts;
  readonly location: ObservationLocation | NetworkVenueLocation;
  readonly note: VerificationInput["note"];
}
export interface FounderNetworkApproval {
  readonly sourceId: string;
  readonly sourceVersion: string;
  readonly contentDigest: string;
  readonly reviewedBy: "FOUNDER" | "AGENT_USER_DELEGATION";
  readonly authorizationRef?: string;
  readonly reviewDecision: "APPROVE" | "FIX_AND_APPROVE";
  readonly reviewVersion: string;
  readonly reviewedAt: string;
  readonly curatorAuthorityId: string;
  readonly highPrizeTiersConfirmed: true;
}
export interface NetworkRightsDecision {
  readonly sourceId: string;
  readonly sourceVersion: string;
  readonly contentDigest: string;
  readonly decision: "PASS";
  readonly basis: "LICENSE" | "OWNER_PERMISSION" | "PERMITTED_STRUCTURED_FACTS";
  readonly evidenceRef: string;
  readonly decisionVersion: string;
  readonly decidedAt: string;
  readonly takedownOwnerId: string;
}
export interface NetworkVisibilityPolicy {
  readonly policyVersion: "network-visibility-30d-v1";
  readonly servingSchemaVersion: "public-map-v4";
  readonly publicMaxAgeMs: 2592000000;
  readonly curatorAuthorityIds: readonly string[];
  readonly workflowVenueApproximation?: {
    readonly version: "network-workflow-venue-approximation-v1";
    readonly ruleId: "NETWORK_WORKFLOW_VENUE_APPROXIMATION_V1";
    readonly approvedSources: readonly {
      readonly sourceId: string;
      readonly sourceVersion: string;
      readonly locationDigest: string;
    }[];
  };
  readonly workflowReviewDelegation?: {
    readonly version: "network-auto-clear-review-delegation-v1";
    readonly authorizationRef: string;
    readonly authorizedAt: string;
    readonly approvedSources: readonly {
      readonly sourceId: string;
      readonly sourceVersion: string;
      readonly contentDigest: string;
    }[];
  };
  readonly venueApproximation?: {
    readonly version: "network-batch10-venue-approximation-v1";
    readonly ruleId: "NETWORK_BATCH10_VENUE_APPROXIMATION_V1";
    readonly approvedSources: readonly {
      readonly sourceId: string;
      readonly sourceVersion: string;
      readonly locationDigest: string;
    }[];
  };
}
