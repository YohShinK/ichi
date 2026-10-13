import {
  INITIAL_OPPORTUNITY_POLICY,
  validOpportunityPolicy,
} from "../../../src/opportunity.js";

/** Same versioned configuration must be deployed to projector and both readers. */
export const currentOpportunityPolicy = (env) => {
  try {
    const policy = env.ICHI_V2_SHADOW_OPPORTUNITY_POLICY
      ? JSON.parse(env.ICHI_V2_SHADOW_OPPORTUNITY_POLICY)
      : INITIAL_OPPORTUNITY_POLICY;
    return validOpportunityPolicy(policy) ? policy : null;
  } catch {
    return null;
  }
};
