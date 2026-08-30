export const SHARE_TITLE = "ICHI 一奇抽赏助手";
export const FRIEND_SHARE_IMAGE_URL = "/assets/share/ichi-share-message.png";
export const TIMELINE_SHARE_IMAGE_URL = "/assets/v1-29/ichi-avatar.png";
export const SHARE_QUERY_ALLOWLIST = ["tab"] as const;
export const PUBLIC_SHARE_TABS = ["recognize", "map", "my"] as const;

export type PublicShareTab = (typeof PUBLIC_SHARE_TABS)[number];

export const isPublicShareTab = (value: unknown): value is PublicShareTab =>
  typeof value === "string" &&
  (PUBLIC_SHARE_TABS as readonly string[]).includes(value);

export const parsePublicShareTab = (
  query: Readonly<Record<string, unknown>> | undefined,
): PublicShareTab => (isPublicShareTab(query?.tab) ? query.tab : "recognize");

const createPublicQuery = (tab: PublicShareTab): string => `tab=${tab}`;

export const createFriendSharePayload = (tab: PublicShareTab) => ({
  title: SHARE_TITLE,
  path: `/pages/home/index?${createPublicQuery(tab)}`,
  imageUrl: FRIEND_SHARE_IMAGE_URL,
});

export const createTimelineSharePayload = (tab: PublicShareTab) => ({
  title: SHARE_TITLE,
  query: createPublicQuery(tab),
  imageUrl: TIMELINE_SHARE_IMAGE_URL,
});

export const createCopyUrlPayload = (tab: PublicShareTab) => ({
  query: createPublicQuery(tab),
});
