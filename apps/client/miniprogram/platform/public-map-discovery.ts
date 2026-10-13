import type { PublicMarker } from "./public-map-contract.js";

export const IP_SEARCH_PUBLIC_CONTRACT_GAP = false as const;

export const POSITIVE_DISCOVERY_TAGS = [
  {
    id: "UPLOAD_ONLY",
    label: "仅上传",
    emoji: "📤",
    support: "SERVER_RECORD_TYPE",
    derivation: "Authoritative lineage recordType equals UPLOAD_RECORD.",
  },
  {
    id: "LAST_CHANCE",
    label: "LAST 机会",
    emoji: "💎",
    support: "SERVER_EVALUATED",
    derivation: "Current verified facts evaluated by versioned server policy.",
  },
  {
    id: "GRAND_PRIZE_REMAINS",
    label: "大赏存量足",
    emoji: "📦",
    support: "SERVER_EVALUATED",
    derivation: "Current verified facts evaluated by versioned server policy.",
  },
  {
    id: "GRAND_PRIZE_RATIO",
    label: "大赏占比高",
    emoji: "🏆",
    support: "SERVER_EVALUATED",
    derivation: "Current verified facts evaluated by versioned server policy.",
  },
  {
    id: "SPLIT_SET",
    label: "刚刚拆套",
    emoji: "🧩",
    support: "SERVER_EVALUATED",
    derivation: "Current verified facts evaluated by versioned server policy.",
  },
  {
    id: "LOW_OPPORTUNITY",
    label: "低机会信息",
    emoji: "🌫️",
    support: "SERVER_EVALUATED",
    derivation: "Current verified facts evaluated by versioned server policy.",
  },
] as const;

export type PublicDiscoveryTagId =
  (typeof POSITIVE_DISCOVERY_TAGS)[number]["id"];
export type MapLocationState =
  "READY" | "LOADING" | "PERMISSION_NEEDED" | "APPROXIMATE" | "UNAVAILABLE";

export interface PublicDiscoveryTagOption {
  readonly id: PublicDiscoveryTagId;
  readonly label: string;
  readonly emoji: string;
  readonly selected: boolean;
}

export const ALL_PUBLIC_DISCOVERY_TAG_IDS: readonly PublicDiscoveryTagId[] =
  POSITIVE_DISCOVERY_TAGS.map((tag) => tag.id);

export const DEFAULT_PUBLIC_DISCOVERY_TAG_IDS: readonly PublicDiscoveryTagId[] =
  ALL_PUBLIC_DISCOVERY_TAG_IDS.filter((id) => id !== "UPLOAD_ONLY");

export const createPublicDiscoveryTagOptions = (
  selectedIds: readonly PublicDiscoveryTagId[],
): readonly PublicDiscoveryTagOption[] => {
  const selected = new Set(selectedIds);
  return POSITIVE_DISCOVERY_TAGS.map((tag) => ({
    id: tag.id,
    label: tag.label,
    emoji: tag.emoji,
    selected: selected.has(tag.id),
  }));
};

export const normalizePublicDiscoverySearch = (value: string): string =>
  value
    .normalize("NFKC")
    .toLocaleLowerCase("zh-CN")
    .replace(/[\s·:：._—-]+/gu, "")
    .trim();

const editDistance = (left: string, right: string): number => {
  const previous = Array.from(
    { length: right.length + 1 },
    (_, index) => index,
  );
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        (current[rightIndex - 1] ?? 0) + 1,
        (previous[rightIndex] ?? 0) + 1,
        (previous[rightIndex - 1] ?? 0) +
          (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length] ?? Math.max(left.length, right.length);
};

export const matchesPublicDiscoverySearch = (
  marker: PublicMarker,
  searchText: string,
): boolean => {
  const query = normalizePublicDiscoverySearch(searchText);
  if (!query) return true;
  const candidates = [marker.boardShortLabel].map(
    normalizePublicDiscoverySearch,
  );
  return candidates.some((candidate) => {
    if (candidate.includes(query) || query.includes(candidate)) return true;
    const lengthGap = Math.abs(candidate.length - query.length);
    return (
      query.length >= 3 && lengthGap <= 1 && editDistance(candidate, query) <= 1
    );
  });
};

export const discoveryTagsForPublicMarker = (
  marker: PublicMarker,
): readonly PublicDiscoveryTagId[] => [
  ...(marker.recordType === "UPLOAD_RECORD" ? ["UPLOAD_ONLY" as const] : []),
  ...marker.opportunity.reasonCodes.filter(
    (code): code is PublicDiscoveryTagId =>
      ALL_PUBLIC_DISCOVERY_TAG_IDS.includes(code as PublicDiscoveryTagId),
  ),
];

const PUBLIC_DISCOVERY_TAG_PRIORITY: readonly PublicDiscoveryTagId[] = [
  "UPLOAD_ONLY",
  "LAST_CHANCE",
  "GRAND_PRIZE_RATIO",
  "GRAND_PRIZE_REMAINS",
  "SPLIT_SET",
  "LOW_OPPORTUNITY",
];

export const discoveryTagLabelsForPublicLead = (
  lead: Pick<PublicMarker, "recordType" | "opportunity">,
): readonly string[] => {
  const tags = new Set<PublicDiscoveryTagId>([
    ...(lead.recordType === "UPLOAD_RECORD" ? ["UPLOAD_ONLY" as const] : []),
    ...[lead.opportunity.primaryStatus, ...lead.opportunity.reasonCodes].filter(
      (code): code is PublicDiscoveryTagId =>
        ALL_PUBLIC_DISCOVERY_TAG_IDS.includes(code as PublicDiscoveryTagId),
    ),
  ]);
  return PUBLIC_DISCOVERY_TAG_PRIORITY.filter((id) => tags.has(id)).map(
    (id) => POSITIVE_DISCOVERY_TAGS.find((tag) => tag.id === id)!.label,
  );
};

export const primaryDiscoveryTagForPublicLead = (
  opportunity: PublicMarker["opportunity"],
): string =>
  POSITIVE_DISCOVERY_TAGS.find((tag) => tag.id === opportunity.primaryStatus)
    ?.label ?? "";

export const primaryDiscoveryTagIdForPublicLead = (
  opportunity: PublicMarker["opportunity"],
): PublicDiscoveryTagId | null =>
  ALL_PUBLIC_DISCOVERY_TAG_IDS.includes(
    opportunity.primaryStatus as PublicDiscoveryTagId,
  )
    ? (opportunity.primaryStatus as PublicDiscoveryTagId)
    : null;

export const filterPublicDiscoveryMarkers = (input: {
  readonly markers: readonly PublicMarker[];
  readonly searchText: string;
  readonly selectedTagIds: readonly PublicDiscoveryTagId[];
}): readonly PublicMarker[] => {
  if (input.selectedTagIds.length === 0) return [];
  const selected = new Set(input.selectedTagIds);
  const allSelected = selected.size === POSITIVE_DISCOVERY_TAGS.length;
  return input.markers.filter((marker) => {
    if (!matchesPublicDiscoverySearch(marker, input.searchText)) return false;
    if (marker.recordType === "UPLOAD_RECORD")
      return selected.has("UPLOAD_ONLY");
    if (allSelected) return true;
    return discoveryTagsForPublicMarker(marker).some((tag) =>
      selected.has(tag),
    );
  });
};
