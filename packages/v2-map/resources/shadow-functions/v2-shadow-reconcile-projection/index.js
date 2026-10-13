"use strict";

exports.main = async (event = {}, context = {}) => {
  const [{ default: cloud }, { createMain }] = await Promise.all([
    import("wx-server-sdk"),
    import("./runtime.mjs"),
  ]);
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
  return createMain({ cloud, env: process.env })(event, context);
};
