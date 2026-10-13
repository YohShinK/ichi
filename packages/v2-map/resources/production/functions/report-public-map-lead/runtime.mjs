import { createMain as factory } from "../../shared/runtime.mjs";
export const createMain = (deps) =>
  factory({
    ...deps,
    operation: "report",
    collectionAllowlist: [
      "accounts",
      "mapAccountPolicies",
      "mapAuditEvents",
      "mapControlState",
      "mapModerationLedger",
      "publicMapLeads",
      "wechatIdentities",
    ],
  });
