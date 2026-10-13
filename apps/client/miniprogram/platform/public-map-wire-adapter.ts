import {
  clonePublicDetail,
  type PublicMapSchemaVersion,
  type PublicDetail,
  type PublicDetailResult,
} from "./public-map-contract.js";

type WireContributor = {
  readonly displayName: string;
  readonly avatar:
    | { readonly kind: "PUBLIC_URL"; readonly url: string }
    | {
        readonly kind: "FALLBACK_ASSET";
        readonly path: "/assets/v1-29/ichi-avatar.png";
      };
};

type WireDetail = Omit<PublicDetail, "contributor" | "contributors"> & {
  readonly contributor: WireContributor | null;
  readonly contributors?: readonly WireContributor[] | undefined;
};

export type PublicMapWireDetailResult =
  | Extract<PublicDetailResult, { readonly ok: false }>
  | {
      readonly ok: true;
      readonly schemaVersion: PublicMapSchemaVersion;
      readonly requestId: string;
      readonly generation: number;
      readonly item: WireDetail;
    };

const unavailable = (
  result: Extract<PublicMapWireDetailResult, { readonly ok: true }>,
): PublicDetailResult => ({
  ok: false,
  code: "SERVICE_UNAVAILABLE",
  requestId: result.requestId,
  generation: result.generation,
  retryable: true,
  retryAfterSeconds: null,
});

export const adaptPublicMapDetailWire = (
  result: PublicMapWireDetailResult,
): PublicDetailResult => {
  if (!result.ok) return result;
  const contributor = result.item.contributor;
  const wireContributors =
    result.item.contributors ?? (contributor ? [contributor] : []);
  const contributors: { displayName: string; avatarUrl: string }[] = [];
  for (const item of wireContributors) {
    const avatarUrl =
      item.avatar.kind === "PUBLIC_URL" ? item.avatar.url : item.avatar.path;
    if (
      typeof item.displayName !== "string" ||
      item.displayName.trim().length === 0 ||
      !(item.avatar.kind === "PUBLIC_URL"
        ? /^https:\/\/[^\s]+$/u.test(avatarUrl)
        : item.avatar.kind === "FALLBACK_ASSET" &&
          avatarUrl === "/assets/v1-29/ichi-avatar.png")
    )
      return unavailable(result);
    contributors.push({ displayName: item.displayName, avatarUrl });
  }
  let avatarUrl: string | null = null;
  if (contributor) {
    if (contributor.avatar.kind === "PUBLIC_URL") {
      if (!/^https:\/\/[^\s]+$/u.test(contributor.avatar.url))
        return unavailable(result);
      avatarUrl = contributor.avatar.url;
    } else if (
      contributor.avatar.kind === "FALLBACK_ASSET" &&
      contributor.avatar.path === "/assets/v1-29/ichi-avatar.png"
    ) {
      avatarUrl = contributor.avatar.path;
    } else {
      return unavailable(result);
    }
  }
  return {
    ok: true,
    schemaVersion: result.schemaVersion,
    requestId: result.requestId,
    generation: result.generation,
    item: clonePublicDetail({
      ...result.item,
      contributor: contributor
        ? { displayName: contributor.displayName, avatarUrl: avatarUrl! }
        : null,
      contributors,
    }),
  };
};
