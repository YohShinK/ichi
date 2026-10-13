import { createMain as factory } from "../../shared/runtime.mjs";
export const createMain = (deps) =>
  factory({
    ...deps,
    operation: "detail",
    collectionAllowlist: [
      "accounts",
      "mapControlState",
      "publicMapLeads",
      "wechatIdentities",
    ],
  });
