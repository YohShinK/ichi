import { createMain as factory } from "../../shared/runtime.mjs";
export const createMain = (deps) =>
  factory({
    ...deps,
    operation: "consent",
    collectionAllowlist: [
      "accounts",
      "mapAuditEvents",
      "mapContributionConsents",
      "mapSourceOutbox",
      "mapControlState",
      "wechatIdentities",
    ],
  });
