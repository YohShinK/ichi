import { createMain as factory } from "../../shared/runtime.mjs";
export const createMain = (deps) =>
  factory({
    ...deps,
    operation: "answerAssistance",
    collectionAllowlist: [
      "accounts",
      "boardAssociations",
      "boardInstances",
      "boardObservations",
      "mapAssistanceEvidence",
      "mapAssistanceRequests",
      "mapAuditEvents",
      "mapContributions",
      "mapControlState",
      "mapProjectionOutbox",
      "publicMapLeads",
      "wechatIdentities",
    ],
  });
