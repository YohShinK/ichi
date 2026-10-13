import { createMain as factory } from "../../shared/runtime.mjs";
export const createMain = (deps) =>
  factory({
    ...deps,
    operation: "project",
    collectionAllowlist: [
      "accounts",
      "boardAssociations",
      "boardInstances",
      "boardObservations",
      "mapAccountPolicies",
      "mapAuditEvents",
      "mapContributionConsents",
      "mapContributions",
      "mapControlState",
      "mapModerationLedger",
      "mapProjectionOutbox",
      "publicMapLeads",
      "wechatIdentities",
    ],
  });
