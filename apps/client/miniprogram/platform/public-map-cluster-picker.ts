import { PUBLIC_MAP_MAX_SCALE } from "./public-map-interaction.js";
import { createNativeMapClusterTopology } from "./public-map-native-presentation.js";
import {
  formatObservedAtClock,
  formatPublicIpTheme,
  presentPublicDetail,
  type PublicMapMarkerPresentation,
} from "./public-map-presentation.js";
import { POSITIVE_DISCOVERY_TAGS } from "./public-map-discovery.js";
import type { PublicDetail } from "./public-map-contract.js";
import type { MarkerCanvasRenderInput } from "./marker-canvas-renderer.js";

export interface PublicMapClusterPickerRow extends PublicMapMarkerPresentation {
  readonly displayIpTheme: string;
  readonly statusTags: NonNullable<MarkerCanvasRenderInput["statusTags"]>;
  readonly pickerNotePreview: string;
  readonly pickerUploadedAtLabel: string;
  readonly pickerMetadataPhase: "LOADING" | "LOADED" | "ERROR";
  readonly markerIconPath?: string;
}

export const presentClusterPickerRow = (
  marker: PublicMapMarkerPresentation,
  detail?: PublicDetail | null,
): PublicMapClusterPickerRow => {
  const tags = [
    { label: marker.primaryDiscoveryTag, tone: marker.markerStatusTone },
    ...marker.discoveryTagIds
      .map((id) => POSITIVE_DISCOVERY_TAGS.find((tag) => tag.id === id))
      .filter((tag) => tag && tag.label !== marker.primaryDiscoveryTag)
      .map((tag) => ({
        label: tag!.label,
        tone: (tag!.id === "UPLOAD_ONLY"
          ? "default"
          : tag!.id === "LAST_CHANCE"
            ? "last"
            : tag!.id === "GRAND_PRIZE_RATIO" ||
                tag!.id === "GRAND_PRIZE_REMAINS"
              ? "grand"
              : tag!.id === "SPLIT_SET"
                ? "split"
                : "low") as MarkerCanvasRenderInput["statusTone"],
      })),
  ];
  const safeDetail =
    detail?.publicLeadId === marker.publicLeadId ? detail : null;
  const networkPresentation =
    safeDetail?.sourceIcon === "OFFICIAL_NETWORK"
      ? presentPublicDetail(safeDetail)
      : null;
  return {
    ...marker,
    pickerMetadataPhase:
      detail === undefined ? "LOADING" : safeDetail ? "LOADED" : "ERROR",
    displayIpTheme: safeDetail
      ? formatPublicIpTheme(safeDetail.board.ipName, safeDetail.board.themeName)
      : (marker.displayIpTheme ?? formatPublicIpTheme(marker.boardShortLabel)),
    statusTags: tags.filter(
      (tag, i) =>
        tag.label && tags.findIndex((other) => other.label === tag.label) === i,
    ),
    pickerNotePreview:
      detail === undefined
        ? "备注加载中"
        : safeDetail
          ? networkPresentation
            ? networkPresentation.networkExpandedNoteLines
                .join(" · ")
                .replace(/\s+/g, " ")
            : safeDetail.venueNote?.trim().replace(/\s+/g, " ") ||
              "暂无公开备注"
          : "备注暂不可用",
    pickerUploadedAtLabel:
      detail === undefined
        ? "上传时间读取中"
        : safeDetail
          ? networkPresentation
            ? networkPresentation.recordTimeClockLabel
            : safeDetail.uploadedAt &&
                Number.isFinite(Date.parse(safeDetail.uploadedAt))
              ? `上传 ${formatObservedAtClock(safeDetail.uploadedAt)}`
              : "上传时间未知"
          : "上传时间暂不可用",
  };
};

/** Only requested visible windows are queued; at most two public reads are in flight. */
export class ClusterPickerMetadataLoader {
  private readonly requested = new Set<string>();
  private readonly queue: string[] = [];
  private running = 0;
  private cancelled = false;
  constructor(
    private readonly input: {
      read(publicLeadId: string): Promise<PublicDetail | null>;
      isCurrent(): boolean;
      onRow(publicLeadId: string, detail: PublicDetail | null): void;
      onIdle?(): void;
    },
  ) {}

  load(ids: readonly string[]): void {
    if (this.cancelled || !this.input.isCurrent()) return;
    for (const id of ids)
      if (!this.requested.has(id)) {
        this.requested.add(id);
        this.queue.push(id);
      }
    this.pump();
    if (this.running === 0 && this.queue.length === 0) this.input.onIdle?.();
  }

  cancel(): void {
    this.cancelled = true;
    this.queue.length = 0;
  }

  private pump(): void {
    while (
      !this.cancelled &&
      this.input.isCurrent() &&
      this.running < 2 &&
      this.queue.length
    ) {
      const id = this.queue.shift()!;
      this.running++;
      void Promise.resolve()
        .then(() =>
          this.cancelled || !this.input.isCurrent()
            ? null
            : this.input.read(id),
        )
        .catch(() => null)
        .then((detail) => {
          if (!this.cancelled && this.input.isCurrent())
            this.input.onRow(id, detail);
        })
        .finally(() => {
          this.running--;
          this.pump();
          if (
            !this.cancelled &&
            this.input.isCurrent() &&
            this.running === 0 &&
            this.queue.length === 0
          )
            this.input.onIdle?.();
        });
    }
  }
}

/** Re-project real coordinates with the widest PNG footprint, without hysteresis or display offsets. */
export const classifyClusterAtMaxScale = (
  members: readonly PublicMapMarkerPresentation[],
): "UNRESOLVED" | "SEPARABLE" => {
  if (members.length < 2) return "SEPARABLE";
  const topology = createNativeMapClusterTopology(
    members,
    PUBLIC_MAP_MAX_SCALE,
    undefined,
    4,
  );
  return topology.nodes.length === 1 ? "UNRESOLVED" : "SEPARABLE";
};
