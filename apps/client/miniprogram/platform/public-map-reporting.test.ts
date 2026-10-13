import { describe, expect, it, vi } from "vitest";
import {
  CandidateReportingService,
  PublicMapReportingClient,
  type ReportResult,
} from "./public-map-reporting.js";
import {
  filterPublicDiscoveryMarkers,
  ALL_PUBLIC_DISCOVERY_TAG_IDS,
  DEFAULT_PUBLIC_DISCOVERY_TAG_IDS,
  type PublicDiscoveryTagId,
} from "./public-map-discovery.js";
import {
  presentPublicMarker,
  presentPublicDetail,
} from "./public-map-presentation.js";
import {
  SYNTHETIC_PUBLIC_MARKERS,
  SyntheticPublicMapService,
} from "./public-map-synthetic-service.js";
const lead = "a".repeat(32);
const success = (active = true, hidden = false): ReportResult => ({
  ok: true,
  active,
  hidden,
  policyVersion: "v2-21-report-policy-1",
});
describe("TASK21 upload-only authoritative presentation", () => {
  it("overrides only the marker label while keeping opportunity/freshness and detail reasons", async () => {
    const m = {
      ...SYNTHETIC_PUBLIC_MARKERS[0]!,
      recordType: "UPLOAD_RECORD" as const,
    };
    const before = presentPublicMarker({ ...m, recordType: "DRAW_RECORD" }, 0);
    const view = presentPublicMarker(m, 0);
    expect(view.primaryDiscoveryTag).toBe("仅上传");
    expect(view.markerStatusTone).toBe("default");
    expect(view.opportunityStatus).toBe(before.opportunityStatus);
    expect(view.freshnessLabel).toBe(before.freshnessLabel);
    const result = await new SyntheticPublicMapService().detail({
      publicLeadId: m.publicLeadId,
      requestId: "detail-test",
      generation: 1,
      supportedSchemaVersions: ["public-map-v3"],
    });
    if (!result.ok) throw new Error("fixture detail missing");
    const d = {
      ...result.item,
      recordType: "UPLOAD_RECORD" as const,
      opportunity: {
        ...result.item.opportunity,
        primaryStatus: "LAST_CHANCE" as const,
        reasonCodes: [
          "GRAND_PRIZE_REMAINS",
          "LAST_CHANCE",
          "GRAND_PRIZE_RATIO",
          "LAST_CHANCE",
        ],
      },
    };
    expect(presentPublicDetail(d).primaryDiscoveryTag).toBe(
      "仅上传、LAST 机会、大赏占比高、大赏存量足",
    );
    expect(
      presentPublicDetail({ ...d, recordType: "DRAW_RECORD" })
        .primaryDiscoveryTag,
    ).toBe("LAST 机会、大赏占比高、大赏存量足");
    expect(presentPublicDetail(d).opportunityReasons).toHaveLength(
      d.opportunity.reasonCodes.length,
    );
  });
  it("requires upload-only selection even when another opportunity tag matches", () => {
    const base = SYNTHETIC_PUBLIC_MARKERS[0]!;
    const upload = {
      ...base,
      publicLeadId: "upload",
      recordType: "UPLOAD_RECORD" as const,
    };
    const draw = {
      ...base,
      publicLeadId: "only-upload-in-name",
      boardShortLabel: "仅上传",
      recordType: "DRAW_RECORD" as const,
    };
    const unknown = { ...draw, publicLeadId: "unknown", recordType: null };
    const markers = [upload, draw, unknown];
    expect(
      filterPublicDiscoveryMarkers({
        markers,
        searchText: "",
        selectedTagIds: DEFAULT_PUBLIC_DISCOVERY_TAG_IDS,
      }),
    ).toEqual([draw, unknown]);
    expect(
      filterPublicDiscoveryMarkers({
        markers,
        searchText: "",
        selectedTagIds: [
          base.opportunity.reasonCodes[0]! as PublicDiscoveryTagId,
        ],
      }),
    ).toEqual([draw, unknown]);
    expect(
      filterPublicDiscoveryMarkers({
        markers,
        searchText: "",
        selectedTagIds: ["UPLOAD_ONLY"],
      }),
    ).toEqual([upload]);
    expect(
      filterPublicDiscoveryMarkers({
        markers,
        searchText: "",
        selectedTagIds: [
          "UPLOAD_ONLY",
          base.opportunity.reasonCodes[0]! as PublicDiscoveryTagId,
        ],
      }),
    ).toEqual(markers);
    expect(
      filterPublicDiscoveryMarkers({
        markers,
        searchText: "",
        selectedTagIds: ALL_PUBLIC_DISCOVERY_TAG_IDS,
      }),
    ).toEqual(markers);
    expect(
      filterPublicDiscoveryMarkers({
        markers,
        searchText: "",
        selectedTagIds: [],
      }),
    ).toEqual([]);
  });
});
describe("TASK21 persistent report client", () => {
  it.each(["release", "unknown"] as const)(
    "fails closed in %s",
    async (version) => {
      const callFunction = vi.fn();
      const service = new CandidateReportingService({ callFunction }, version);
      expect(await service.command(lead, "REPORT", "action-123")).toEqual({
        ok: false,
      });
      expect(callFunction).not.toHaveBeenCalled();
    },
  );
  it("sends only public target, command and action ID; strips private response fields", async () => {
    const callFunction = vi.fn(async () => ({
      result: { ...success(), reporterAccountId: "private" },
    }));
    const s = new CandidateReportingService({ callFunction }, "develop");
    expect(await s.command(lead, "REPORT", "action-123")).toEqual(success());
    expect(callFunction.mock.calls[0]).toEqual([
      {
        name: "v2-shadow-report-public-map-lead",
        data: { publicLeadId: lead, command: "REPORT", actionId: "action-123" },
      },
    ]);
  });
  it("both cancel surfaces use CANCEL_REPORT and supports report again", async () => {
    const commands: string[] = [];
    const c = new PublicMapReportingClient({
      async command(_id, command) {
        commands.push(command);
        return success(command === "REPORT");
      },
    });
    await c.select(lead);
    await c.toggle();
    expect(c.state.message).toBe("你已举报这条信息");
    await c.cancel();
    expect(c.state.active).toBe(false);
    await c.toggle();
    await c.toggle();
    expect(commands).toEqual([
      "GET_STATE",
      "REPORT",
      "CANCEL_REPORT",
      "REPORT",
      "CANCEL_REPORT",
    ]);
  });
  it("rapid duplicate taps coalesce and thrown failures use stable copy", async () => {
    let resolve!: (r: ReportResult) => void;
    let count = 0;
    const c = new PublicMapReportingClient({
      async command(_id, cmd) {
        if (cmd === "GET_STATE") return success(false);
        count++;
        return new Promise((r) => {
          resolve = r;
        });
      },
    });
    await c.select(lead);
    const p = c.toggle();
    await c.toggle();
    expect(count).toBe(1);
    resolve(success());
    await p;
    const f = new PublicMapReportingClient({
      async command() {
        throw new Error("network");
      },
    });
    await f.select(lead);
    await f.toggle();
    expect(f.state.message).toBe("举报失败，请重试");
  });
  it("reuses ambiguous command ID, avoids stale selection update and suppresses hidden target", async () => {
    const ids: string[] = [];
    let fail = true;
    const hidden = vi.fn();
    const c = new PublicMapReportingClient(
      {
        async command(_id, cmd, id) {
          if (cmd === "GET_STATE") return success(false);
          ids.push(id!);
          if (fail) {
            fail = false;
            return { ok: false };
          }
          return success(true, true);
        },
      },
      hidden,
    );
    await c.select(lead);
    await c.toggle();
    await c.toggle();
    expect(ids[0]).toBe(ids[1]);
    expect(hidden).toHaveBeenCalledWith(lead);
    let resolve!: (r: ReportResult) => void;
    const stale = new PublicMapReportingClient({
      async command(id) {
        if (id === lead)
          return new Promise((r) => {
            resolve = r;
          });
        return success(false);
      },
    });
    const old = stale.select(lead);
    await stale.select("b".repeat(32));
    resolve(success(true));
    await old;
    expect(stale.state.active).toBe(false);
  });
});

it("reselects the same target during a pending write using committed server state", async () => {
  let resolve!: (result: ReportResult) => void;
  let committed = false;
  const client = new PublicMapReportingClient({
    async command(_id, command) {
      if (command === "GET_STATE") return success(committed);
      return new Promise((r) => {
        resolve = r;
      });
    },
  });
  await client.select(lead);
  const pending = client.toggle();
  await client.select("b".repeat(32));
  await client.select(lead);
  committed = true;
  resolve(success());
  await pending;
  expect(client.state.active).toBe(true);
});
