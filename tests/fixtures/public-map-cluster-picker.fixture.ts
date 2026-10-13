/** Test-only synthetic coordinates; this module is never imported by the app. */
import type { PublicMapMarkerPresentation } from "../../apps/client/miniprogram/platform/public-map-presentation.js";

const baseLatitude = 31.2304;
const baseLongitude = 121.4737;
const longitudeForPixels = (pixels: number): number =>
  (pixels * 360) / (256 * 2 ** 18);

const marker = (index: number, pixelX: number): PublicMapMarkerPresentation => {
  const longitude = baseLongitude + longitudeForPixels(pixelX);
  return {
    publicLeadId: `stress-${index + 1}`,
    latitude: baseLatitude,
    longitude,
    boardShortLabel: `测试 IP ${index + 1}`,
    totalRemainingLabel: String(index + 1),
    totalRemainingCompact: false,
    primaryDiscoveryTag: "LAST机会",
    discoveryTagIds: [],
    markerStatusTone: "last",
    opportunityStatus: "GRAND_PRIZE_REMAINS",
    opportunityLabel: "高机会信息",
    freshnessBand: "RECENT",
    freshnessLabel: "近期观察",
    observedAtLabel: "刚刚",
    recordType: "DRAW_RECORD",
    recordTypeLabel: "抽赏记录",
    overlapCount: 0,
    overlapKey: `${baseLatitude}:${longitude}`,
    sourceLabel: "",
    positionClass: "",
  };
};

export const clusterStressFixture = {
  sameCoordinate: Array.from({ length: 20 }, (_, index) => marker(index, 0)),
  // Four real positions: 9 + 1 + 6 + 4. Members within a group remain
  // closer than the widest PNG footprint even at the maximum scale.
  mixedNear: Array.from({ length: 20 }, (_, index) => {
    const group = index < 9 ? 0 : index < 10 ? 1 : index < 16 ? 2 : 3;
    return marker(index, group * 300 + (index % 3) * 4);
  }),
  separableStreet: Array.from({ length: 20 }, (_, index) =>
    marker(index, index * 180),
  ),
} as const;
