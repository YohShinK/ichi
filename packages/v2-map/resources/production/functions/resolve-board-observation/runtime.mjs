import { createMain as factory } from "../../shared/runtime.mjs";
export const createMain = (deps) =>
  factory({
    ...deps,
    operation: "resolve",
    collectionAllowlist: [
      "accounts",
      "boardAssociations",
      "boardInstances",
      "boardObservations",
      "mapAccountPolicies",
      "mapAssistanceRequests",
      "mapAuditEvents",
      "mapContributions",
      "mapControlState",
      "mapProjectionOutbox",
      "publicMapLeads",
      "wechatIdentities",
    ],
  });
