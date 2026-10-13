import { describe, expect, it, vi } from "vitest";
import {
  clusterBadgeGeometry,
  createMarkerRenderKey,
} from "./marker-canvas-renderer.js";
import {
  classifyClusterAtMaxScale,
  ClusterPickerMetadataLoader,
  presentClusterPickerRow,
} from "./public-map-cluster-picker.js";
import { clusterStressFixture } from "../../../../tests/fixtures/public-map-cluster-picker.fixture.js";
import { createNativeMapClusterTopology } from "./public-map-native-presentation.js";
import { formatPublicIpTheme } from "./public-map-presentation.js";
import { presentPublicMarker } from "./public-map-presentation.js";
import {
  SYNTHETIC_PUBLIC_MARKERS,
  SyntheticPublicMapService,
} from "./public-map-synthetic-service.js";
import {
  PUBLIC_MAP_SCHEMA_VERSION,
  type PublicDetail,
} from "./public-map-contract.js";

describe("picker public metadata", () => {
  const detail = async () => {
    const result = await new SyntheticPublicMapService().detail({
      publicLeadId: SYNTHETIC_PUBLIC_MARKERS[0]!.publicLeadId,
      requestId: "test",
      generation: 1,
      supportedSchemaVersions: [PUBLIC_MAP_SCHEMA_VERSION],
    });
    if (!result.ok) throw Error("fixture");
    return result.item;
  };
  it("uses safe public note and upload time rather than observation time, with distinct missing/error/loading states", async () => {
    const marker = presentPublicMarker(SYNTHETIC_PUBLIC_MARKERS[0]!, 0);
    const d = await detail();
    const loaded = presentClusterPickerRow(marker, {
      ...d,
      uploadedAt: "2026-10-03T09:55:25.907Z",
      venueNote: " 测试\n公开备注 ",
    });
    expect(loaded.pickerNotePreview).toBe("测试 公开备注");
    expect(loaded.pickerUploadedAtLabel).toContain("10/03");
    expect(
      presentClusterPickerRow(marker, {
        ...d,
        uploadedAt: undefined,
        venueNote: null,
      }),
    ).toMatchObject({
      pickerNotePreview: "暂无公开备注",
      pickerUploadedAtLabel: "上传时间未知",
    });
    expect(presentClusterPickerRow(marker)).toMatchObject({
      pickerNotePreview: "备注加载中",
      pickerUploadedAtLabel: "上传时间读取中",
    });
    expect(presentClusterPickerRow(marker, null)).toMatchObject({
      pickerNotePreview: "备注暂不可用",
      pickerUploadedAtLabel: "上传时间暂不可用",
    });
    expect(
      presentClusterPickerRow(marker, { ...d, publicLeadId: "other" })
        .pickerNotePreview,
    ).toBe("备注暂不可用");
  });
  it("keeps all real analysis labels once and in the existing priority order", () => {
    const marker = presentPublicMarker(SYNTHETIC_PUBLIC_MARKERS[1]!, 0);
    const row = presentClusterPickerRow({
      ...marker,
      discoveryTagIds: [
        "UPLOAD_ONLY",
        "LAST_CHANCE",
        "GRAND_PRIZE_REMAINS",
        "LOW_OPPORTUNITY",
        "LOW_OPPORTUNITY",
      ],
    });
    expect(row.statusTags.map((t) => t.label)).toEqual([
      "仅上传",
      "LAST 机会",
      "大赏存量足",
      "低机会信息",
    ]);
  });
  it("bounds reads to two, de-duplicates windows, and cancels both queued and late results", async () => {
    const pending: { id: string; resolve(value: PublicDetail | null): void }[] =
      [];
    const delivered: string[] = [];
    const loader = new ClusterPickerMetadataLoader({
      read: (id) => new Promise((resolve) => pending.push({ id, resolve })),
      isCurrent: () => true,
      onRow: (id) => delivered.push(id),
    });
    loader.load(["a", "b", "c"]);
    loader.load(["b", "c", "d"]);
    await vi.waitFor(() =>
      expect(pending.map((p) => p.id)).toEqual(["a", "b"]),
    );
    pending[0]!.resolve(null);
    await vi.waitFor(() =>
      expect(pending.map((p) => p.id)).toEqual(["a", "b", "c"]),
    );
    expect(delivered).toEqual(["a"]);
    loader.cancel();
    pending[1]!.resolve(null);
    pending[2]!.resolve(null);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(delivered).toEqual(["a"]);
    expect(pending).toHaveLength(3);
    loader.load(["e"]);
    expect(pending).toHaveLength(3);
  });
  it("marks a failed read unavailable and stops publishing after the active list changes", async () => {
    let current = true;
    const published = vi.fn();
    const loader = new ClusterPickerMetadataLoader({
      read: async () => {
        throw Error("offline");
      },
      isCurrent: () => current,
      onRow: published,
    });
    loader.load(["a"]);
    await vi.waitFor(() => expect(published).toHaveBeenCalledWith("a", null));
    current = false;
    loader.load(["b"]);
    expect(published).toHaveBeenCalledTimes(1);
  });
});

describe("unresolved real-coordinate clusters", () => {
  it("keeps two and twenty exact overlaps as a single true-position cluster", () => {
    for (const count of [2, 20]) {
      const members = clusterStressFixture.sameCoordinate.slice(0, count);
      expect(classifyClusterAtMaxScale(members)).toBe("UNRESOLVED");
      const topology = createNativeMapClusterTopology(
        members,
        18,
        undefined,
        4,
      );
      expect(topology.nodes).toHaveLength(1);
      expect(topology.nodes[0]?.memberLeadIds).toHaveLength(count);
      expect(topology.nodes[0]?.latitude).toBeCloseTo(members[0]!.latitude, 9);
      expect(topology.nodes[0]?.longitude).toBeCloseTo(
        members[0]!.longitude,
        9,
      );
    }
  });

  it("separates two close points only if their PNG footprints stop colliding", () => {
    const [first] = clusterStressFixture.sameCoordinate;
    const second = clusterStressFixture.separableStreet[1];
    expect(first && second && classifyClusterAtMaxScale([first, second])).toBe(
      "SEPARABLE",
    );
    const near = clusterStressFixture.mixedNear[1];
    expect(first && near && classifyClusterAtMaxScale([first, near])).toBe(
      "UNRESOLVED",
    );
  });

  it("splits a twenty-point mixed parent into only its real subgroups", () => {
    const members = clusterStressFixture.mixedNear;
    expect(
      createNativeMapClusterTopology(members, 12, undefined, 0).nodes,
    ).toHaveLength(1);
    const topology = createNativeMapClusterTopology(members, 18, undefined, 4);
    expect(topology.nodes.map((node) => node.memberLeadIds.length)).toEqual([
      9, 1, 6, 4,
    ]);
    for (const node of topology.nodes.filter(
      (item) => item.kind === "CLUSTER",
    )) {
      const group = node.memberLeadIds.map((id) =>
        topology.markersByLeadId.get(id)!,
      );
      expect(classifyClusterAtMaxScale(group)).toBe("UNRESOLVED");
    }
    expect(
      createNativeMapClusterTopology(
        clusterStressFixture.separableStreet,
        18,
        undefined,
        4,
      ).nodes,
    ).toHaveLength(20);
  });

  it("uses a circle for one digit and a bounded capsule through 999", () => {
    const badgeX = 128;
    for (const [count, width, label] of [
      [1, 16, "1"],
      [9, 16, "9"],
      [10, 23, "10"],
      [20, 23, "20"],
      [99, 23, "99"],
      [100, 30, "100"],
      [999, 30, "999"],
      [1000, 30, "999"],
    ] as const) {
      const badge = clusterBadgeGeometry(count, badgeX);
      expect(badge).toMatchObject({ width, label, y: 4, height: 16 });
      expect(badge.x).toBeGreaterThanOrEqual(2);
      expect(badge.x + badge.width).toBeLessThanOrEqual(138);
    }
    const key = (clusterCount: number) =>
      createMarkerRenderKey({
        kind: "CLUSTER",
        countLabel: "72",
        title: "宝可梦",
        statusLabel: "LAST机会",
        statusTone: "last",
        selected: false,
        clusterCount,
      });
    expect(key(999)).toBe(key(1000));
    expect(key(9)).not.toBe(key(10));
  });

  it("formats only public IP and real optional theme", () => {
    expect(formatPublicIpTheme("蓝色监狱", "30周年")).toBe("蓝色监狱 / 30周年");
    expect(formatPublicIpTheme("宝可梦", null)).toBe("宝可梦");
  });
});
