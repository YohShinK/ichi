import { createMain as factory } from "../../shared/runtime.mjs";
export const createMain = (deps) =>
  factory({
    ...deps,
    operation: "owner",
    collectionAllowlist: [
      "accounts",
      "boardInstances",
      "boardObservations",
      "mapAuditEvents",
      "mapContributions",
      "mapControlState",
      "mapProjectionOutbox",
      "publicMapLeads",
      "wechatIdentities",
    ],
  });
