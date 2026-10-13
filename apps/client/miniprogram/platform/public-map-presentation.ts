import type {
  PublicDetail,
  PublicMapQuery,
  PublicMarker,
  PublicOpportunityStatus,
} from "./public-map-contract.js";
import {
  discoveryTagLabelsForPublicLead,
  primaryDiscoveryTagForPublicLead,
  primaryDiscoveryTagIdForPublicLead,
} from "./public-map-discovery.js";

export type PublicMapBrowseMode = "MAP" | "LIST";
export type PublicMapSheetMode = "CLOSED" | "PREVIEW" | "EXPANDED";
export type PublicFreshnessFilter = "INCLUDE_LOW" | "EXCLUDE_LOW";

export interface PublicMapMarkerPresentation {
  readonly publicLeadId: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly boardShortLabel: string;
  /** Public list preview has only boardShortLabel, not separate theme metadata. */
  readonly displayIpTheme?: string;
  readonly totalRemainingLabel: string;
  readonly totalRemainingCompact: boolean;
  readonly primaryDiscoveryTag: string;
  readonly discoveryTagIds: readonly string[];
  readonly markerStatusTone: "last" | "grand" | "low" | "split" | "default";
  readonly opportunityStatus: string | null;
  readonly opportunityLabel: string;
  readonly freshnessBand: string;
  readonly freshnessLabel: string;
  readonly observedAtLabel: string;
  readonly recordType: PublicMarker["recordType"];
  readonly recordTypeLabel: string;
  readonly overlapCount: number;
  readonly overlapKey: string;
  readonly sourceLabel: string;
  readonly positionClass: string;
}

export interface PublicTierPresentation {
  readonly tierCode: string;
  readonly label: string;
  readonly remainingLabel: string;
  readonly probabilityLabel: string;
  readonly remainingTickets: number | null;
  readonly isGrandPrize: boolean;
  readonly isSoldOut: boolean;
  readonly isUnknown: boolean;
}

export interface PublicMapDetailPresentation {
  readonly publicLeadId: string;
  readonly title: string;
  readonly themeLabel: string;
  readonly displayIpTheme: string;
  readonly tiers: readonly PublicTierPresentation[];
  readonly tierColumnCount: number;
  readonly primaryDiscoveryTag: string;
  readonly grandPrizeRemainingLabel: string;
  readonly totalRemainingLabel: string;
  readonly totalRemainingValueLabel: string;
  readonly totalRemainingCompact: boolean;
  readonly previewRemainingLabel: string;
  readonly priceLabel: string;
  readonly hasPrice: boolean;
  readonly fullPackCostLabel: string;
  readonly fullPackCostValueLabel: string;
  readonly fullPackAmountLabel: string;
  readonly recordType: PublicDetail["recordType"];
  readonly recordTypeLabel: string;
  readonly sourceIcon: "OFFICIAL_NETWORK" | null;
  readonly contributorName: string;
  readonly contributorAvatarUrl: string;
  readonly contributorAvatars: readonly {
    displayName: string;
    avatarUrl: string;
  }[];
  readonly contributorOverflowLabel: string;
  readonly opportunityStatus: string | null;
  readonly opportunityLabel: string;
  readonly opportunityReasons: readonly string[];
  readonly freshnessBand: string;
  readonly freshnessLabel: string;
  readonly observedAtLabel: string;
  readonly venueNote: string;
  readonly venueNotePreview: string;
  readonly venueNoteBody: string;
  readonly networkExpandedNoteLines: readonly string[];
  readonly observedAtClockLabel: string;
  readonly recordTimeLabel: string;
  readonly recordTimeClockLabel: string;
  readonly hasVenueNote: boolean;
  readonly sourceLabel: string;
  readonly locationLabel: string;
}

export const DEFAULT_PUBLIC_CONTRIBUTOR = {
  displayName: "ICHI 玩家",
  avatarUrl: "/assets/v1-29/ichi-avatar.png",
} as const;

const opportunityLabels: Readonly<Record<string, string>> = {
  LAST_CHANCE: "LAST 机会",
  GRAND_PRIZE_REMAINS: "大赏存量足",
  GRAND_PRIZE_RATIO: "大赏占比高",
  SPLIT_SET: "刚刚拆套",
  LOW_OPPORTUNITY: "低机会信息",
};

const freshnessLabels: Readonly<Record<string, string>> = {
  RECENT: "近期观察",
  AGING: "逐渐变旧",
  LOW: "较早观察",
  UNKNOWN: "观察时间未知",
};

const reasonLabels: Readonly<Record<string, string>> = {
  GRAND_PRIZE_REMAINS: "最近记录中仍有大奖余量",
  LOW_FRESHNESS: "观察时间较早，仅供参考",
  INSUFFICIENT_FACTS: "公开事实不足，无法形成更多说明",
  SYNTHETIC_FIXTURE: "本地合成记录，仅用于交互验证",
};

export const formatNullableCount = (
  value: number | null,
  prefix: string,
): string => (value === null ? `${prefix}待确认` : `${prefix}${value}`);

/** The map's numeric field uses two digits even for a single remaining draw. */
export const formatMarkerRemainingCount = (value: number | null): string =>
  value === null ? "—" : String(value).padStart(2, "0");

/** Derive the tier share from the same public remaining counts shown on the card. */
export const formatTierProbability = (
  remainingTickets: number | null,
  totalRemaining: number | null,
): string => {
  if (remainingTickets === null || totalRemaining === null) return "—";
  if (totalRemaining === 0) return "0.00%";
  return `${((remainingTickets / totalRemaining) * 100).toFixed(2)}%`;
};

export const formatNullableMoney = (
  valueMinor: number | null,
  missing: string,
): string =>
  valueMinor === null ? missing : `¥${(valueMinor / 100).toFixed(2)}`;

export const formatObservedAtRelative = (
  value: string,
  nowMs = Date.now(),
): string => {
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) return "时间未知";
  const elapsedMinutes = Math.max(
    0,
    Math.floor((nowMs - instant.getTime()) / 60_000),
  );
  if (elapsedMinutes < 1) return "刚刚";
  if (elapsedMinutes < 60) return `${elapsedMinutes} 分钟前`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours} 小时前`;
  return `${Math.floor(elapsedHours / 24)} 天前`;
};

export const publicRecordTypeLabel = (
  recordType: PublicMarker["recordType"],
): string =>
  recordType === "DRAW_RECORD"
    ? "抽赏记录"
    : recordType === "UPLOAD_RECORD"
      ? "上传记录"
      : "公开记录";

export const publicOpportunityLabel = (level: string | null): string =>
  opportunityLabels[level ?? ""] ?? "机会信息未知";

export const publicFreshnessLabel = (band: string): string =>
  freshnessLabels[band] ?? "时效未知";

/** Only public IP and optional series/theme metadata belong in this label. */
export const formatPublicIpTheme = (
  ipName: string,
  themeName?: string | null,
): string => {
  const ip = ipName.trim();
  const theme = themeName?.trim();
  return theme ? `${ip} / ${theme}` : ip;
};

export const presentPublicMarker = (
  marker: PublicMarker,
  index: number,
): PublicMapMarkerPresentation => {
  const opportunityLabel = publicOpportunityLabel(
    marker.opportunity.primaryStatus,
  );
  const primaryDiscoveryTag = primaryDiscoveryTagForPublicLead(
    marker.opportunity,
  );
  const primaryDiscoveryTagId = primaryDiscoveryTagIdForPublicLead(
    marker.opportunity,
  );
  const markerStatusTone =
    marker.recordType === "UPLOAD_RECORD"
      ? "default"
      : primaryDiscoveryTagId === "LAST_CHANCE"
        ? "last"
        : primaryDiscoveryTagId === "GRAND_PRIZE_REMAINS" ||
            primaryDiscoveryTagId === "GRAND_PRIZE_RATIO"
          ? "grand"
          : primaryDiscoveryTagId === "LOW_OPPORTUNITY"
            ? "low"
            : primaryDiscoveryTagId === "SPLIT_SET"
              ? "split"
              : "default";
  return {
    publicLeadId: marker.publicLeadId,
    latitude: marker.publicLocation.latitude,
    longitude: marker.publicLocation.longitude,
    boardShortLabel: marker.boardShortLabel,
    displayIpTheme: formatPublicIpTheme(marker.boardShortLabel),
    totalRemainingLabel: formatMarkerRemainingCount(marker.totalRemaining),
    totalRemainingCompact:
      marker.totalRemaining !== null && marker.totalRemaining > 99,
    primaryDiscoveryTag:
      marker.recordType === "UPLOAD_RECORD"
        ? "仅上传"
        : primaryDiscoveryTag || opportunityLabel,
    discoveryTagIds: [
      ...(marker.recordType === "UPLOAD_RECORD" ? ["UPLOAD_ONLY"] : []),
      ...marker.opportunity.reasonCodes,
    ],
    markerStatusTone,
    opportunityStatus: marker.opportunity.primaryStatus,
    opportunityLabel,
    freshnessBand: marker.freshness.band,
    freshnessLabel: publicFreshnessLabel(marker.freshness.band),
    observedAtLabel: formatObservedAtRelative(marker.freshness.observedAt),
    recordType: marker.recordType,
    recordTypeLabel: publicRecordTypeLabel(marker.recordType),
    overlapCount: marker.overlapHint?.displayCount ?? 0,
    overlapKey: `${marker.publicLocation.latitude.toFixed(6)}:${marker.publicLocation.longitude.toFixed(6)}`,
    sourceLabel: marker.sourceLabel ?? "",
    positionClass: marker.overlapHint
      ? marker.publicLocation.longitude > 121.48
        ? "synthetic-marker--2"
        : "synthetic-marker--6"
      : `synthetic-marker--${(index % 10) + 1}`,
  };
};

export const presentPublicDetail = (
  detail: PublicDetail,
  options: { readonly visibleContributorLimit?: number } = {},
): PublicMapDetailPresentation => {
  const contributor =
    detail.contributors?.[0] ??
    detail.contributor ??
    DEFAULT_PUBLIC_CONTRIBUTOR;
  const allContributors = detail.contributors?.length
    ? detail.contributors
    : [contributor];
  const visibleLimit = Math.max(
    1,
    Math.floor(options.visibleContributorLimit ?? 3),
  );
  const contributorAvatars = allContributors
    .slice(0, visibleLimit)
    .map((item) => ({
      displayName: item.displayName || DEFAULT_PUBLIC_CONTRIBUTOR.displayName,
      avatarUrl: item.avatarUrl || DEFAULT_PUBLIC_CONTRIBUTOR.avatarUrl,
    }));
  const venueNote = detail.venueNote?.trim() ?? "";
  const noteParts = splitPublicVenueNote(venueNote);
  const rawLocationLabel =
    detail.publicLocation.areaLabel ??
    (detail.publicLocation.precisionMode === "EXACT"
      ? "精确公开位置"
      : "公开区域位置");
  const isNetwork = detail.sourceIcon === "OFFICIAL_NETWORK";
  const locationLabel = isNetwork
    ? rawLocationLabel.replace(/^大致位置 · 位置误差未知 · /u, "")
    : rawLocationLabel;
  const opportunityReasons = detail.opportunity.reasonCodes.map(
    (reason) =>
      opportunityLabels[reason] ??
      reasonLabels[reason] ??
      "公开规则给出的中性说明",
  );
  const networkExpandedNoteLines = isNetwork
    ? [
        ...new Set(
          [locationLabel, venueNote, ...opportunityReasons].filter(Boolean),
        ),
      ]
    : [];
  const recordDisplayTime = isNetwork
    ? detail.freshness.observedAt
    : (detail.uploadedAt ?? detail.freshness.observedAt);
  const recordDisplayVerb = isNetwork || detail.uploadedAt ? "上传" : "观察";
  return {
    publicLeadId: detail.publicLeadId,
    title: detail.board.ipName,
    themeLabel: detail.board.themeName ?? "",
    displayIpTheme: formatPublicIpTheme(
      detail.board.ipName,
      detail.board.themeName,
    ),
    // Keep the two-row visual layout while expanding columns for additional
    // tiers; the scroll viewport provides horizontal overflow and bounce.
    tierColumnCount: Math.max(1, Math.ceil(detail.board.tiers.length / 2)),
    tiers: detail.board.tiers.map((tier) => ({
      tierCode: tier.tierCode,
      label: tier.displayLabel ?? `${tier.tierCode}赏`,
      remainingLabel:
        tier.remainingTickets === null ? "未知" : String(tier.remainingTickets),
      probabilityLabel: formatTierProbability(
        tier.remainingTickets,
        detail.board.totalRemaining,
      ),
      remainingTickets: tier.remainingTickets,
      isGrandPrize: tier.isGrandPrize,
      isSoldOut: tier.remainingTickets === 0,
      isUnknown: tier.remainingTickets === null,
    })),
    primaryDiscoveryTag: discoveryTagLabelsForPublicLead(detail).join("、"),
    grandPrizeRemainingLabel: formatNullableCount(
      detail.board.grandPrizeRemaining,
      "大奖余量 ",
    ),
    totalRemainingLabel:
      formatNullableCount(detail.board.totalRemaining, "剩余 ") +
      (detail.board.totalRemaining === null ? "" : " 抽"),
    totalRemainingValueLabel:
      detail.board.totalRemaining === null
        ? "待确认"
        : String(detail.board.totalRemaining),
    totalRemainingCompact:
      detail.board.totalRemaining !== null && detail.board.totalRemaining > 9,
    previewRemainingLabel: formatNullableCount(
      detail.board.totalRemaining,
      "余票 ",
    ),
    priceLabel: formatNullableMoney(
      detail.board.pricePerDrawMinor,
      "单抽价未提供",
    ),
    hasPrice: detail.board.pricePerDrawMinor !== null,
    fullPackCostLabel:
      detail.board.fullPackCostMinor === null
        ? ""
        : `LAST 还需 ${formatNullableMoney(detail.board.fullPackCostMinor, "")}`,
    fullPackCostValueLabel: formatNullableMoney(
      detail.board.fullPackCostMinor,
      "",
    ),
    fullPackAmountLabel: formatCardAmount(detail.board.fullPackCostMinor),
    recordType: detail.recordType,
    recordTypeLabel: publicRecordTypeLabel(detail.recordType),
    sourceIcon: detail.sourceIcon ?? null,
    contributorName:
      detail.sourceIcon === "OFFICIAL_NETWORK"
        ? "网络上传"
        : contributor.displayName || DEFAULT_PUBLIC_CONTRIBUTOR.displayName,
    contributorAvatarUrl:
      detail.sourceIcon === "OFFICIAL_NETWORK"
        ? "/assets/icons/official-network.svg"
        : contributor.avatarUrl || DEFAULT_PUBLIC_CONTRIBUTOR.avatarUrl,
    contributorAvatars:
      detail.sourceIcon === "OFFICIAL_NETWORK" ? [] : contributorAvatars,
    contributorOverflowLabel:
      allContributors.length > visibleLimit
        ? `+${allContributors.length - visibleLimit}`
        : "",
    opportunityStatus: detail.opportunity.primaryStatus,
    opportunityLabel: publicOpportunityLabel(detail.opportunity.primaryStatus),
    opportunityReasons,
    freshnessBand: detail.freshness.band,
    freshnessLabel: publicFreshnessLabel(detail.freshness.band),
    observedAtLabel: formatObservedAtRelative(detail.freshness.observedAt),
    venueNote,
    venueNotePreview:
      noteParts.headline ||
      detail.sourceLabel?.trim() ||
      "现场线索暂无补充备注",
    venueNoteBody: noteParts.body,
    networkExpandedNoteLines,
    observedAtClockLabel: formatObservedAtClock(detail.freshness.observedAt),
    recordTimeLabel: `${recordDisplayVerb}于${formatObservedAtRelative(recordDisplayTime)}`,
    recordTimeClockLabel: `${recordDisplayVerb} ${formatObservedAtClock(recordDisplayTime)}`,
    hasVenueNote: Boolean(venueNote),
    sourceLabel: detail.sourceLabel ?? "玩家贡献",
    locationLabel,
  };
};

/** Split at a real sentence/newline boundary; the body never repeats the headline. */
export const splitPublicVenueNote = (
  note: string,
): { headline: string; body: string } => {
  const value = note.trim();
  const boundary = value.search(/[。！？!?\n]/u);
  const end = boundary >= 0 ? boundary + 1 : Math.min(value.length, 32);
  return {
    headline: value.slice(0, end).trim(),
    body: value.slice(end).trim(),
  };
};

export const formatCardAmount = (minor: number | null): string => {
  if (minor === null) return "";
  const [whole = "", decimals = ""] = (minor / 100).toFixed(2).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/gu, ",");
  return decimals === "00" ? grouped : `${grouped}.${decimals}`;
};

export const formatObservedAtClock = (value: string): string => {
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) return "时间未知";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${pad(instant.getMonth() + 1)}/${pad(instant.getDate())} ${pad(instant.getHours())}:${pad(instant.getMinutes())}`;
};

export const findOverlapGroup = (
  markers: readonly PublicMapMarkerPresentation[],
  publicLeadId: string,
): readonly PublicMapMarkerPresentation[] => {
  const selected = markers.find((item) => item.publicLeadId === publicLeadId);
  if (!selected || selected.overlapCount <= 1) return [];
  return markers.filter((item) => item.overlapKey === selected.overlapKey);
};

export const createDiscoveryFilterQuery = (
  query: PublicMapQuery,
  opportunity: PublicOpportunityStatus | "ALL",
  freshness: PublicFreshnessFilter,
): PublicMapQuery => ({
  ...query,
  opportunityStatuses: opportunity === "ALL" ? [] : [opportunity],
  includeLowFreshness: freshness === "INCLUDE_LOW",
});

export const createSyntheticViewportQuery = (
  query: PublicMapQuery,
): PublicMapQuery => ({
  ...query,
  bbox: {
    west: query.bbox.west + 0.01,
    south: query.bbox.south + 0.01,
    east: query.bbox.east + 0.01,
    north: query.bbox.north + 0.01,
  },
});
