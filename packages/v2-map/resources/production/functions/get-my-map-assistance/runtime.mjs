import { createMain as factory } from "../../shared/runtime.mjs";
export const createMain = (deps) =>
  factory({
    ...deps,
    operation: "getAssistance",
    collectionAllowlist: [
      "accounts",
      "boardObservations",
      "mapAssistanceRequests",
      "mapControlState",
      "wechatIdentities",
    ],
  });
