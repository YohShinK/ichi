import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  FRIEND_SHARE_IMAGE_URL,
  SHARE_QUERY_ALLOWLIST,
  TIMELINE_SHARE_IMAGE_URL,
  createCopyUrlPayload,
  createFriendSharePayload,
  createTimelineSharePayload,
  parsePublicShareTab,
} from "./home-sharing.js";

const PRIVATE_KEYS = [
  "board",
  "record",
  "account",
  "owner",
  "openid",
  "unionid",
  "nickname",
  "avatar",
  "submission",
  "quota",
];

describe("home sharing public contract", () => {
  it.each(["recognize", "map", "my"] as const)(
    "builds the friend route for %s",
    (tab) => {
      expect(createFriendSharePayload(tab)).toEqual({
        title: "ICHI 一奇抽赏助手",
        path: `/pages/home/index?tab=${tab}`,
        imageUrl: FRIEND_SHARE_IMAGE_URL,
      });
    },
  );

  it.each(["recognize", "map", "my"] as const)(
    "builds the timeline query for %s",
    (tab) => {
      expect(createTimelineSharePayload(tab)).toEqual({
        title: "ICHI 一奇抽赏助手",
        query: `tab=${tab}`,
        imageUrl: TIMELINE_SHARE_IMAGE_URL,
      });
    },
  );

  it.each(["recognize", "map", "my"] as const)(
    "builds the native copy-link query for %s",
    (tab) => {
      expect(createCopyUrlPayload(tab)).toEqual({ query: `tab=${tab}` });
    },
  );

  it("accepts only the existing public tab vocabulary and falls back safely", () => {
    expect(SHARE_QUERY_ALLOWLIST).toEqual(["tab"]);
    expect(parsePublicShareTab({ tab: "recognize" })).toBe("recognize");
    expect(parsePublicShareTab({ tab: "map" })).toBe("map");
    expect(parsePublicShareTab({ tab: "my" })).toBe("my");
    expect(parsePublicShareTab({ tab: "invalid" })).toBe("recognize");
    expect(parsePublicShareTab({})).toBe("recognize");
  });

  it("never serializes private account, record, draw, quota, or profile state", () => {
    for (const tab of ["recognize", "map", "my"] as const) {
      const serialized = JSON.stringify(
        [
          createFriendSharePayload(tab),
          createTimelineSharePayload(tab),
          createCopyUrlPayload(tab),
        ].map((payload) =>
          Object.fromEntries(
            Object.entries(payload).filter(([key]) => key !== "imageUrl"),
          ),
        ),
      ).toLowerCase();
      for (const privateKey of PRIVATE_KEYS) {
        expect(serialized).not.toContain(privateKey);
      }
    }
  });

  it("uses a 5:4 friend image and reuses the existing default avatar for timeline", () => {
    expect(FRIEND_SHARE_IMAGE_URL).toBe("/assets/share/ichi-share-message.png");
    expect(TIMELINE_SHARE_IMAGE_URL).toBe("/assets/v1-29/ichi-avatar.png");
    expect(FRIEND_SHARE_IMAGE_URL).not.toBe(TIMELINE_SHARE_IMAGE_URL);

    for (const imageUrl of [FRIEND_SHARE_IMAGE_URL, TIMELINE_SHARE_IMAGE_URL]) {
      expect(imageUrl).toMatch(/^\/assets\//);
      for (const forbidden of [
        "/Users/",
        "file://",
        "wxfile://",
        "cloud://",
        "http://",
        "https://",
      ]) {
        expect(imageUrl).not.toContain(forbidden);
      }
      expect(
        existsSync(join(process.cwd(), "apps/client/miniprogram", imageUrl)),
      ).toBe(true);
    }

    const friendImage = readFileSync(
      join(process.cwd(), "apps/client/miniprogram", FRIEND_SHARE_IMAGE_URL),
    );
    const width = friendImage.readUInt32BE(16);
    const height = friendImage.readUInt32BE(20);
    expect({ width, height }).toEqual({ width: 800, height: 640 });
    expect(width * 4).toBe(height * 5);

    expect(
      new Set(
        (["recognize", "map", "my"] as const).map(
          (tab) => createFriendSharePayload(tab).imageUrl,
        ),
      ),
    ).toEqual(new Set([FRIEND_SHARE_IMAGE_URL]));
    expect(
      new Set(
        (["recognize", "map", "my"] as const).map(
          (tab) => createTimelineSharePayload(tab).imageUrl,
        ),
      ),
    ).toEqual(new Set([TIMELINE_SHARE_IMAGE_URL]));
  });
});
