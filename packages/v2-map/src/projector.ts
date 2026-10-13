import {
  isPublicContributor,
  type PublicContributor,
  type PublicContributorView,
} from "./avatar-projection.js";
import { fail, ok, type ContractResult } from "./types.js";
import type { PlayerRecordType, SourceType } from "./types.js";
import {
  isOpportunityEvaluation,
  isVerifiedBoard,
  type OpportunityEvaluation,
  type VerifiedBoard,
} from "./verification.js";

const PUBLIC_CANDIDATE_ARTIFACT = Symbol("PublicCandidate");

export interface PublicBoardFacts {
  readonly ipName: string;
  readonly themeName: string | null;
  readonly pricePerDrawMinor: number | null;
  readonly tiers: readonly {
    readonly tierCode: string;
    readonly displayLabel: string | null;
    readonly remainingTickets: number | null;
    readonly isGrandPrize: boolean;
  }[];
}

export interface PublicLocation {
  readonly coordinateSystem: "GCJ02";
  readonly latitude: number;
  readonly longitude: number;
  readonly precisionMode: "EXACT" | "APPROXIMATE" | "AREA";
  readonly areaLabel: string | null;
  readonly locationPolicyVersion: string;
  readonly projectionRuleId: string;
}

export interface OpportunityView {
  readonly primaryStatus: OpportunityEvaluation["primaryStatus"];
  readonly reasonCodes: readonly string[];
  readonly policyVersion: string;
  readonly evaluatedAt: string;
}

export interface PublicCandidate {
  readonly publicUntil?: string | undefined;
  readonly networkPolicyVersion?: string | undefined;
  readonly servingSchemaVersion?: "public-map-v4" | undefined;
  readonly sourceIcon?: "OFFICIAL_NETWORK" | undefined;
  readonly kind: "PUBLIC_CANDIDATE";
  readonly candidateId: string;
  readonly boardInstanceId: string;
  readonly observationVersionId: string;
  readonly verifiedBoardId: string;
  readonly verifiedBoardVersion: string;
  readonly opportunityEvaluationId: string;
  readonly opportunityEvaluationVersion: string;
  readonly sourceType: SourceType;
  readonly recordType: PlayerRecordType | null;
  readonly boardFacts: PublicBoardFacts;
  readonly boardShortLabel: string;
  readonly observedAt: string;
  readonly opportunity: OpportunityView;
  readonly freshnessPolicyVersion: string;
  readonly publicLocation: PublicLocation | null;
  readonly venueNote: string | null;
  readonly contributor: PublicContributorView | null;
  readonly contributors?: readonly PublicContributorView[];
  readonly gates: {
    readonly verified: true;
    readonly opportunityPass: true;
    readonly sourceCurrent: boolean;
    readonly authorizationApplicable: boolean;
    readonly rightsEligible: boolean;
    readonly publicEligible: boolean;
    readonly moderationVisible: boolean;
    readonly deleted: boolean;
  };
  readonly [PUBLIC_CANDIDATE_ARTIFACT]: true;
}

export type PublicCandidateBuildError =
  | "VERIFIED_BOARD_REQUIRED"
  | "VERIFIED_BOARD_VERSION_STALE"
  | "OPPORTUNITY_EVALUATION_REQUIRED"
  | "OPPORTUNITY_VERIFIED_BOARD_MISMATCH"
  | "OPPORTUNITY_GATE_NOT_PASS"
  | "PUBLIC_CONTRIBUTOR_UNTRUSTED";

export interface PublicCandidateBuildInput {
  readonly publicUntil?: string | undefined;
  readonly networkPolicyVersion?: string | undefined;
  readonly servingSchemaVersion?: "public-map-v4" | undefined;
  readonly sourceIcon?: "OFFICIAL_NETWORK" | undefined;
  readonly candidateId: string;
  readonly boardInstanceId: string;
  readonly currentVerifiedBoardVersion: string;
  readonly verifiedBoard: VerifiedBoard | null;
  readonly opportunityEvaluation: OpportunityEvaluation | null;
  readonly boardShortLabel: string;
  readonly freshnessPolicyVersion: string;
  readonly publicLocation: PublicLocation | null;
  readonly venueNote: string | null;
  readonly contributor: PublicContributor | null;
  readonly contributors?: readonly PublicContributorView[];
  readonly gates: {
    readonly sourceCurrent: boolean;
    readonly authorizationApplicable: boolean;
    readonly rightsEligible: boolean;
    readonly publicEligible: boolean;
    readonly moderationVisible: boolean;
    readonly deleted: boolean;
  };
}

export const buildPublicCandidate = (
  input: PublicCandidateBuildInput,
): ContractResult<PublicCandidate, PublicCandidateBuildError> => {
  if (!isVerifiedBoard(input.verifiedBoard)) {
    return fail("VERIFIED_BOARD_REQUIRED");
  }
  if (
    input.verifiedBoard.verifiedBoardVersion !==
    input.currentVerifiedBoardVersion
  ) {
    return fail("VERIFIED_BOARD_VERSION_STALE");
  }
  if (!isOpportunityEvaluation(input.opportunityEvaluation)) {
    return fail("OPPORTUNITY_EVALUATION_REQUIRED");
  }
  if (
    input.opportunityEvaluation.verifiedBoardId !==
      input.verifiedBoard.verifiedBoardId ||
    input.opportunityEvaluation.verifiedBoardVersion !==
      input.verifiedBoard.verifiedBoardVersion
  ) {
    return fail("OPPORTUNITY_VERIFIED_BOARD_MISMATCH");
  }
  if (input.opportunityEvaluation.publicGateDecision !== "PASS") {
    return fail("OPPORTUNITY_GATE_NOT_PASS");
  }
  if (input.contributor !== null && !isPublicContributor(input.contributor)) {
    return fail("PUBLIC_CONTRIBUTOR_UNTRUSTED");
  }
  if (
    input.contributors?.some(
      (item) =>
        typeof item.displayName !== "string" ||
        item.displayName.trim().length === 0 ||
        (item.avatar.kind === "FALLBACK_ASSET"
          ? item.avatar.path !== "/assets/v1-29/ichi-avatar.png"
          : item.avatar.kind !== "PUBLIC_URL" ||
            !/^https:\/\/[^\s]+$/u.test(item.avatar.url)),
    )
  ) {
    return fail("PUBLIC_CONTRIBUTOR_UNTRUSTED");
  }
  const facts = input.verifiedBoard.facts;
  return ok({
    ...(input.publicUntil
      ? {
          publicUntil: input.publicUntil,
          networkPolicyVersion: input.networkPolicyVersion,
          servingSchemaVersion: input.servingSchemaVersion,
        }
      : {}),
    kind: "PUBLIC_CANDIDATE",
    candidateId: input.candidateId,
    boardInstanceId: input.boardInstanceId,
    observationVersionId: input.verifiedBoard.observationVersionId,
    verifiedBoardId: input.verifiedBoard.verifiedBoardId,
    verifiedBoardVersion: input.verifiedBoard.verifiedBoardVersion,
    opportunityEvaluationId: input.opportunityEvaluation.evaluationId,
    opportunityEvaluationVersion: input.opportunityEvaluation.evaluationVersion,
    sourceType: input.verifiedBoard.provenance.sourceType,
    recordType: input.verifiedBoard.provenance.recordType,
    boardFacts: {
      ipName: facts.ipName,
      themeName: facts.themeName,
      pricePerDrawMinor: facts.pricePerDrawMinor,
      tiers: facts.tiers.map((tier) => ({
        tierCode: tier.tierCode,
        displayLabel: tier.rawLabel,
        remainingTickets: tier.remainingTickets,
        isGrandPrize: tier.isGrandPrize,
      })),
    },
    boardShortLabel: input.boardShortLabel,
    observedAt: input.verifiedBoard.observedAt,
    opportunity: {
      primaryStatus: input.opportunityEvaluation.primaryStatus,
      reasonCodes: [...input.opportunityEvaluation.reasonCodes],
      policyVersion: input.opportunityEvaluation.policyVersion,
      evaluatedAt: input.opportunityEvaluation.evaluatedAt,
    },
    freshnessPolicyVersion: input.freshnessPolicyVersion,
    publicLocation: structuredClone(input.publicLocation),
    venueNote: input.venueNote,
    contributor: structuredClone(input.contributor),
    contributors: structuredClone(
      input.contributors ?? (input.contributor ? [input.contributor] : []),
    ),
    gates: { verified: true, opportunityPass: true, ...input.gates },
    [PUBLIC_CANDIDATE_ARTIFACT]: true,
  });
};

export const isPublicCandidate = (value: unknown): value is PublicCandidate =>
  typeof value === "object" &&
  value !== null &&
  (value as Partial<PublicCandidate>).kind === "PUBLIC_CANDIDATE" &&
  (value as Partial<PublicCandidate>)[PUBLIC_CANDIDATE_ARTIFACT] === true;

export interface PublicMapLeadCore {
  readonly publicUntil?: string | undefined;
  readonly networkPolicyVersion?: string | undefined;
  readonly servingSchemaVersion?: "public-map-v4" | undefined;
  readonly sourceIcon?: "OFFICIAL_NETWORK" | undefined;
  readonly publicLeadId: string;
  readonly servedVersion: number;
  readonly projectionVersion: string;
  readonly policyVersion: string;
  readonly visibility: "VISIBLE" | "RETIRED";
  readonly publicLocation: PublicLocation | null;
  readonly boardShortLabel: string | null;
  readonly board: PublicBoardFacts | null;
  readonly recordType: PlayerRecordType | null;
  readonly opportunity: OpportunityView | null;
  readonly observedAt: string | null;
  readonly freshnessPolicyVersion: string | null;
  readonly venueNote: string | null;
  readonly contributor: PublicContributorView | null;
  readonly contributors?: readonly PublicContributorView[];
  readonly sourceLabel: "网络来源" | "网络上传" | null;
  readonly disclosures: {
    readonly nonRealtime: true;
    readonly nonRecommendation: true;
  } | null;
  readonly retiredAt: string | null;
}

interface InstanceProjectionState {
  readonly lastEventSequence: number;
  readonly activePublicLeadId: string | null;
  readonly currentSupportObservationVersionId: string | null;
}

export interface ProjectorState {
  readonly instances: Readonly<Record<string, InstanceProjectionState>>;
  readonly leads: Readonly<Record<string, PublicMapLeadCore>>;
  readonly retiredIds: Readonly<Record<string, true>>;
}

export interface ProjectorEvent {
  readonly boardInstanceId: string;
  readonly eventSequence: number;
  readonly reconciledAt: string;
  readonly eligibleCandidates: readonly PublicCandidate[];
  readonly projectionVersion: string;
  readonly policyVersion: string;
}

export type ProjectorEffect =
  | "CREATED"
  | "ADVANCED"
  | "RETIRED"
  | "NO_PUBLIC_SUPPORT"
  | "LATE_EVENT_DISCARDED";

export interface ProjectorResult {
  readonly state: ProjectorState;
  readonly effect: ProjectorEffect;
  readonly publicLeadId: string | null;
}

export const emptyProjectorState = (): ProjectorState => ({
  instances: {},
  leads: {},
  retiredIds: {},
});

const candidatePasses = (candidate: PublicCandidate, asOf: string): boolean => {
  if (!isPublicCandidate(candidate)) return false;
  if (
    candidate.servingSchemaVersion === "public-map-v4" &&
    (!candidate.publicUntil ||
      !Number.isFinite(Date.parse(candidate.publicUntil)) ||
      Date.parse(candidate.publicUntil) <= Date.parse(asOf))
  )
    return false;
  const gates = candidate.gates;
  return (
    gates.verified &&
    gates.opportunityPass &&
    gates.sourceCurrent &&
    gates.authorizationApplicable &&
    gates.rightsEligible &&
    gates.publicEligible &&
    gates.moderationVisible &&
    !gates.deleted &&
    candidate.publicLocation !== null
  );
};

const selectCurrentSupport = (
  candidates: readonly PublicCandidate[],
  asOf: string,
): PublicCandidate | null =>
  [...candidates]
    .filter((candidate) => candidatePasses(candidate, asOf))
    .sort(
      (left, right) =>
        Date.parse(right.observedAt) - Date.parse(left.observedAt) ||
        right.observationVersionId.localeCompare(left.observationVersionId),
    )[0] ?? null;

const activeCore = (
  publicLeadId: string,
  servedVersion: number,
  event: ProjectorEvent,
  candidate: PublicCandidate,
): PublicMapLeadCore => ({
  publicLeadId,
  servedVersion,
  projectionVersion: event.projectionVersion,
  policyVersion: event.policyVersion,
  visibility: "VISIBLE",
  publicLocation: structuredClone(candidate.publicLocation),
  boardShortLabel: candidate.boardShortLabel,
  board: structuredClone(candidate.boardFacts),
  recordType: candidate.recordType,
  opportunity: structuredClone(candidate.opportunity),
  observedAt: candidate.observedAt,
  freshnessPolicyVersion: candidate.freshnessPolicyVersion,
  venueNote: candidate.venueNote,
  contributor: structuredClone(candidate.contributor),
  contributors: structuredClone(candidate.contributors ?? []),
  sourceLabel:
    candidate.sourceType === "NETWORK_SOURCE"
      ? candidate.servingSchemaVersion === "public-map-v4"
        ? "网络上传"
        : "网络来源"
      : null,
  ...(candidate.servingSchemaVersion === "public-map-v4"
    ? {
        publicUntil: candidate.publicUntil,
        networkPolicyVersion: candidate.networkPolicyVersion,
        servingSchemaVersion: candidate.servingSchemaVersion,
        sourceIcon: "OFFICIAL_NETWORK" as const,
      }
    : {}),
  disclosures: { nonRealtime: true, nonRecommendation: true },
  retiredAt: null,
});

const retireCore = (
  prior: PublicMapLeadCore,
  retiredAt: string,
): PublicMapLeadCore => ({
  publicLeadId: prior.publicLeadId,
  servedVersion: prior.servedVersion + 1,
  projectionVersion: prior.projectionVersion,
  policyVersion: prior.policyVersion,
  visibility: "RETIRED",
  publicLocation: null,
  boardShortLabel: null,
  board: null,
  recordType: null,
  opportunity: null,
  observedAt: null,
  freshnessPolicyVersion: null,
  venueNote: null,
  contributor: null,
  contributors: [],
  sourceLabel: null,
  disclosures: null,
  retiredAt,
});

export const reconcilePublicMapLead = (
  state: ProjectorState,
  event: ProjectorEvent,
  newPublicLeadId: () => string,
): ProjectorResult => {
  const instance = state.instances[event.boardInstanceId] ?? {
    lastEventSequence: 0,
    activePublicLeadId: null,
    currentSupportObservationVersionId: null,
  };
  if (event.eventSequence <= instance.lastEventSequence) {
    return {
      state,
      effect: "LATE_EVENT_DISCARDED",
      publicLeadId: instance.activePublicLeadId,
    };
  }

  const selected = selectCurrentSupport(
    event.eligibleCandidates,
    event.reconciledAt,
  );
  if (!selected) {
    if (!instance.activePublicLeadId) {
      return {
        state: {
          ...state,
          instances: {
            ...state.instances,
            [event.boardInstanceId]: {
              lastEventSequence: event.eventSequence,
              activePublicLeadId: null,
              currentSupportObservationVersionId: null,
            },
          },
        },
        effect: "NO_PUBLIC_SUPPORT",
        publicLeadId: null,
      };
    }
    const prior = state.leads[instance.activePublicLeadId];
    if (!prior) throw new Error("ACTIVE_LEAD_MISSING");
    const retired = retireCore(prior, event.reconciledAt);
    return {
      state: {
        instances: {
          ...state.instances,
          [event.boardInstanceId]: {
            lastEventSequence: event.eventSequence,
            activePublicLeadId: null,
            currentSupportObservationVersionId: null,
          },
        },
        leads: { ...state.leads, [retired.publicLeadId]: retired },
        retiredIds: { ...state.retiredIds, [retired.publicLeadId]: true },
      },
      effect: "RETIRED",
      publicLeadId: retired.publicLeadId,
    };
  }

  if (instance.activePublicLeadId) {
    const prior = state.leads[instance.activePublicLeadId];
    if (!prior || prior.visibility !== "VISIBLE") {
      throw new Error("ACTIVE_LEAD_INVALID");
    }
    const advanced = activeCore(
      prior.publicLeadId,
      prior.servedVersion + 1,
      event,
      selected,
    );
    return {
      state: {
        ...state,
        instances: {
          ...state.instances,
          [event.boardInstanceId]: {
            lastEventSequence: event.eventSequence,
            activePublicLeadId: advanced.publicLeadId,
            currentSupportObservationVersionId: selected.observationVersionId,
          },
        },
        leads: { ...state.leads, [advanced.publicLeadId]: advanced },
      },
      effect: "ADVANCED",
      publicLeadId: advanced.publicLeadId,
    };
  }

  const id = newPublicLeadId();
  if (state.leads[id] || state.retiredIds[id]) {
    throw new Error("PUBLIC_LEAD_ID_COLLISION_OR_RESURRECTION");
  }
  const created = activeCore(id, 1, event, selected);
  return {
    state: {
      ...state,
      instances: {
        ...state.instances,
        [event.boardInstanceId]: {
          lastEventSequence: event.eventSequence,
          activePublicLeadId: id,
          currentSupportObservationVersionId: selected.observationVersionId,
        },
      },
      leads: { ...state.leads, [id]: created },
    },
    effect: "CREATED",
    publicLeadId: id,
  };
};

export interface FreshnessPolicy {
  readonly policyVersion: string;
  readonly recentMaxAgeMs: number;
  readonly agingMaxAgeMs: number;
}

export interface FreshnessEvaluation {
  readonly observedAt: string;
  readonly freshnessAsOf: string;
  readonly freshnessBand: "RECENT" | "AGING" | "LOW" | "UNKNOWN";
  readonly freshnessPolicyVersion: string;
}

export const evaluateFreshness = (
  observedAt: string,
  asOf: string,
  policy: FreshnessPolicy,
): FreshnessEvaluation => {
  const ageMs = Date.parse(asOf) - Date.parse(observedAt);
  const freshnessBand =
    !Number.isFinite(ageMs) || ageMs < 0
      ? "UNKNOWN"
      : ageMs <= policy.recentMaxAgeMs
        ? "RECENT"
        : ageMs <= policy.agingMaxAgeMs
          ? "AGING"
          : "LOW";
  return {
    observedAt,
    freshnessAsOf: asOf,
    freshnessBand,
    freshnessPolicyVersion: policy.policyVersion,
  };
};
