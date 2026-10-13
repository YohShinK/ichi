import { createMain as factory } from "../../shared/runtime.mjs";
export const createMain = (deps) =>
  factory({
    ...deps,
    operation: "query",
    collectionAllowlist: [
      "accounts",
      "mapControlState",
      "publicMapLeads",
      "publicMapQuerySnapshots",
      "wechatIdentities",
    ],
  });
