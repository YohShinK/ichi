import {
  createSyntheticUserViewportQuery,
  SyntheticMapLocationAdapter,
} from "../../../../tests/fixtures/public-map-location.fixture.js";
import { describe, expect, it } from "vitest";

import { createDefaultPublicMapQuery } from "./public-map-query.js";
import { SYNTHETIC_PUBLIC_MARKERS } from "./public-map-synthetic-service.js";
import {
  ALL_PUBLIC_DISCOVERY_TAG_IDS,
  createPublicDiscoveryTagOptions,
  discoveryTagsForPublicMarker,
  filterPublicDiscoveryMarkers,
  IP_SEARCH_PUBLIC_CONTRACT_GAP,
  matchesPublicDiscoverySearch,
  normalizePublicDiscoverySearch,
  POSITIVE_DISCOVERY_TAGS,
} from "./public-map-discovery.js";

describe("TASK-V2-16A map-first discovery prototype", () => {
  it("returns only known additional picker tags", () => {
    const marker = SYNTHETIC_PUBLIC_MARKERS[0]!;
    expect(discoveryTagsForPublicMarker(marker)).toEqual(
      marker.opportunity.reasonCodes,
    );
    expect(
      discoveryTagsForPublicMarker({
        ...marker,
        publicLeadId: "unknown-public-lead",
      }),
    ).toEqual(marker.opportunity.reasonCodes);
  });
  it("keeps IP search explicitly outside the production query contract", () => {
    expect(IP_SEARCH_PUBLIC_CONTRACT_GAP).toBe(false);
    expect(createDefaultPublicMapQuery()).not.toHaveProperty("keyword");
  });

  it("normalizes Unicode, spacing, punctuation, and case", () => {
    expect(normalizePublicDiscoverySearch(" ＮＩＫＫＥ · 女 神 ")).toBe(
      "nikke女神",
    );
  });

  it("supports exact and substring public-label search", () => {
    const marker = SYNTHETIC_PUBLIC_MARKERS[0]!;
    expect(matchesPublicDiscoverySearch(marker, "进击的巨人")).toBe(true);
    expect(matchesPublicDiscoverySearch(marker, "巨人")).toBe(true);
  });

  it("supports deterministic one-edit approximate search", () => {
    const marker = SYNTHETIC_PUBLIC_MARKERS[0]!;
    expect(matchesPublicDiscoverySearch(marker, "进击的巨人 最终")).toBe(true);
    expect(matchesPublicDiscoverySearch(marker, "明日方舟")).toBe(false);
  });

  it("treats all selected tags as unfiltered and keeps every filter visibly active", () => {
    const result = filterPublicDiscoveryMarkers({
      markers: SYNTHETIC_PUBLIC_MARKERS,
      searchText: "",
      selectedTagIds: ALL_PUBLIC_DISCOVERY_TAG_IDS,
    });
    expect(result).toHaveLength(10);
    expect(
      createPublicDiscoveryTagOptions(ALL_PUBLIC_DISCOVERY_TAG_IDS).every(
        (tag) => tag.selected,
      ),
    ).toBe(true);
  });

  it("uses inclusive OR for a partial multi-select", () => {
    const result = filterPublicDiscoveryMarkers({
      markers: SYNTHETIC_PUBLIC_MARKERS,
      searchText: "",
      selectedTagIds: ["LAST_CHANCE", "GRAND_PRIZE_REMAINS"],
    });
    expect(result.length).toBeGreaterThan(1);
    expect(
      result.every((marker) =>
        discoveryTagsForPublicMarker(marker).some((tag) =>
          ["LAST_CHANCE", "GRAND_PRIZE_REMAINS"].includes(tag),
        ),
      ),
    ).toBe(true);
  });

  it("composes search AND the selected tags", () => {
    expect(
      filterPublicDiscoveryMarkers({
        markers: SYNTHETIC_PUBLIC_MARKERS,
        searchText: "芙莉莲",
        selectedTagIds: ["GRAND_PRIZE_RATIO"],
      }).map((marker) => marker.publicLeadId),
    ).toEqual([]);
    expect(
      filterPublicDiscoveryMarkers({
        markers: SYNTHETIC_PUBLIC_MARKERS,
        searchText: "芙莉莲",
        selectedTagIds: ["UPLOAD_ONLY", "GRAND_PRIZE_RATIO"],
      }).map((marker) => marker.publicLeadId),
    ).toEqual(["lead-synthetic-002"]);
    expect(
      filterPublicDiscoveryMarkers({
        markers: SYNTHETIC_PUBLIC_MARKERS,
        searchText: "芙莉莲",
        selectedTagIds: ["GRAND_PRIZE_REMAINS"],
      }),
    ).toEqual([]);
  });

  it("keeps a zero-selected state empty without silently restoring all", () => {
    expect(
      filterPublicDiscoveryMarkers({
        markers: SYNTHETIC_PUBLIC_MARKERS,
        searchText: "",
        selectedTagIds: [],
      }),
    ).toEqual([]);
    expect(
      createPublicDiscoveryTagOptions([]).every((tag) => !tag.selected),
    ).toBe(true);
  });

  it("marks every positive label with a derivation and support class", () => {
    expect(POSITIVE_DISCOVERY_TAGS).toHaveLength(6);
    for (const tag of POSITIVE_DISCOVERY_TAGS.filter(
      (tag) => tag.id !== "UPLOAD_ONLY",
    )) {
      expect(tag.derivation.length).toBeGreaterThan(10);
      expect([
        "SUPPORTED_BY_CURRENT_PUBLIC_CONTRACT",
        "SERVER_EVALUATED",
      ]).toContain(tag.support);
    }
    expect(POSITIVE_DISCOVERY_TAGS.map((tag) => tag.label)).toEqual([
      "仅上传",
      "LAST 机会",
      "大赏存量足",
      "大赏占比高",
      "刚刚拆套",
      "低机会信息",
    ]);
    expect(POSITIVE_DISCOVERY_TAGS.every((tag) => tag.emoji.length > 0)).toBe(
      true,
    );
    expect(
      createPublicDiscoveryTagOptions(ALL_PUBLIC_DISCOVERY_TAG_IDS).every(
        (tag) => tag.selected,
      ),
    ).toBe(true);
  });

  it("provides a replaceable synthetic recenter adapter and placeholder states", async () => {
    const adapter = new SyntheticMapLocationAdapter();
    const original = createDefaultPublicMapQuery();
    await expect(adapter.recenter(original)).resolves.toEqual({
      state: "READY",
      query: createSyntheticUserViewportQuery(original),
    });
    adapter.setNextState("PERMISSION_NEEDED");
    await expect(adapter.recenter(original)).resolves.toEqual({
      state: "PERMISSION_NEEDED",
      query: null,
    });
    adapter.setNextState("UNAVAILABLE");
    await expect(adapter.recenter(original)).resolves.toEqual({
      state: "UNAVAILABLE",
      query: null,
    });
  });
});
