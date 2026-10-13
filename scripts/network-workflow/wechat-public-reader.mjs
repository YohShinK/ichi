/* global wx */
import { createRequire } from "node:module";
import path from "node:path";
import { check } from "./store.mjs";

export const createReader = async (config) => {
  check(
    config.wsEndpoint === "ws://127.0.0.1:9442" &&
      path.isAbsolute(config.sdkRoot),
    "LOCAL_TRUSTED_WECHAT_READER_REQUIRED",
  );
  const load = createRequire(path.join(config.sdkRoot, "package.json"));
  // The local DevTools version probe hangs on this installed automator build;
  // reuse the verified Phase4 transport workaround, without altering the app.
  const automatorRoot = path.dirname(
    load.resolve("miniprogram-automator/package.json"),
  );
  load(
    path.join(automatorRoot, "out/MiniProgram"),
  ).default.prototype.checkVersion = async () => {};
  const automator = load("miniprogram-automator");
  let mp;
  try {
    mp = await automator.connect({ wsEndpoint: config.wsEndpoint });
  } catch {
    check(
      config.allowDevToolsLaunch === true &&
        path.isAbsolute(config.projectRoot ?? ""),
      "WECHAT_READER_CONNECTION_REQUIRED",
    );
    mp = await automator.launch({
      projectPath: config.projectRoot,
      port: 9442,
      cliPath: "/Applications/wechatwebdevtools.app/Contents/MacOS/cli",
      timeout: 30000,
    });
  }
  try {
    await mp.evaluate((env) => {
      wx.cloud.init({ env });
      return true;
    }, config.environment);
  } catch (error) {
    await mp.disconnect();
    throw error;
  }
  const call = async (name, data) => {
    const response = await mp.evaluate(
      async ({ name, data }) =>
        (await wx.cloud.callFunction({ name, data })).result,
      { name, data },
    );
    check(response?.ok, response?.code ?? "PUBLIC_READER_FAILED");
    return response;
  };
  return {
    detail: async (id) =>
      (
        await call("get-public-map-lead-detail", {
          publicLeadId: id,
          requestId: `curation-${id}`,
          generation: 1,
          supportedSchemaVersions: ["public-map-v3", "public-map-v4"],
        })
      ).item,
    query: async (bbox) =>
      call("query-public-map-leads", {
        bbox,
        zoom: 12,
        mode: "MAP",
        opportunityStatuses: [],
        includeLowFreshness: true,
        limit: 50,
        cursor: null,
        asOf: null,
        requestId: "curation-inventory",
        generation: 1,
        supportedSchemaVersions: ["public-map-v3", "public-map-v4"],
      }),
    close: async () => mp.disconnect(),
  };
};
