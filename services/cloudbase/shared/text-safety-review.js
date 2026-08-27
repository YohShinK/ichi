"use strict";

const TEXT_SAFETY_USAGE = Object.freeze({
  PROFILE_NICKNAME: "PROFILE_NICKNAME",
  MAP_NOTE: "MAP_NOTE",
});

const SCENE_BY_USAGE = Object.freeze({
  [TEXT_SAFETY_USAGE.PROFILE_NICKNAME]: 1,
  [TEXT_SAFETY_USAGE.MAP_NOTE]: 2,
});

const reviewTextSafety = async ({
  cloud,
  usage,
  content,
  openId,
  reviewer,
}) => {
  const scene = SCENE_BY_USAGE[usage];
  if (
    !scene ||
    typeof content !== "string" ||
    content.length === 0 ||
    typeof openId !== "string" ||
    openId.length === 0
  )
    return { passed: false };
  try {
    const result = reviewer
      ? await reviewer({
          content,
          version: 2,
          scene,
          openid: openId,
        })
      : await cloud.openapi.security.msgSecCheck({
          content,
          version: 2,
          scene,
          openid: openId,
        });
    return {
      passed:
        String(result?.result?.suggest || result?.suggest || "") === "pass",
    };
  } catch {
    return { passed: false };
  }
};

module.exports = { TEXT_SAFETY_USAGE, reviewTextSafety };
