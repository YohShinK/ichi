import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const domain = require("./domain.js");

describe("V1 CloudBase domain", () => {
  it("uses Asia/Shanghai calendar days and exposes the next reset", () => {
    expect(domain.quotaWindow(Date.parse("2026-08-18T15:59:59.000Z"))).toEqual({
      dateKey: "2026-08-18",
      resetAt: "2026-08-18T16:00:00.000Z",
    });
    expect(
      domain.quotaWindow(Date.parse("2026-08-18T16:00:00.000Z")).dateKey,
    ).toBe("2026-08-19");
  });

  it("reports used, reserved and remaining separately", () => {
    const summary = domain.quotaSummary(
      {
        limit: 5,
        used: 2,
        reservations: { a: { status: "reserved" }, b: { status: "released" } },
      },
      Date.parse("2026-08-18T00:00:00Z"),
    );
    expect(summary).toMatchObject({
      limit: 5,
      used: 2,
      reserved: 1,
      remaining: 2,
      dateKey: "2026-08-18",
    });
  });

  it("merges numbered regular tiers but preserves SP tiers", () => {
    expect(
      domain.normalizeTierCounts({ D1: 2, D2: 3, SP1: 1, SP2: 2 }),
    ).toEqual({ D: 5, SP1: 1, SP2: 2 });
  });

  it("derives the final snapshot deterministically and preserves conservation", () => {
    const initial = {
      ip: "界外",
      pricePerDraw: 58,
      totalTickets: 8,
      remainingTickets: 7,
      tiers: [
        { tierId: "D1", total: 5, remaining: 4 },
        { tierId: "SP1", total: 3, remaining: 3 },
      ],
    };
    const final = domain.deriveFinalSnapshot(initial, { D2: 2, SP1: 1 });
    expect(final.remainingTickets).toBe(4);
    expect(final.tiers).toMatchObject([
      { tierId: "D", remaining: 2 },
      { tierId: "SP1", remaining: 2 },
    ]);
  });

  it("validates R2 without T/P and derives events without mutating its baseline", () => {
    const initial = {
      schemaVersion: "board-record-r2-1.0.0",
      recognitionVersion: "R2",
      ipName: "世界之外",
      themeName: "此间即无间",
      pricePerDraw: 65,
      tiers: [
        {
          tierCode: "A",
          rawLabel: "A賞",
          remainingTickets: 5,
          isGrandPrize: false,
        },
        {
          tierCode: "SP1",
          rawLabel: "SP賞",
          remainingTickets: 0,
          isGrandPrize: true,
        },
      ],
    };

    const validated = domain.validateSnapshot(initial);
    expect(validated.tiers).toEqual(initial.tiers);
    expect(JSON.stringify(validated)).not.toMatch(
      /totalTickets|pastedTickets/u,
    );

    const final = domain.deriveFinalSnapshot(initial, { A: 5 });
    expect(final.tiers).toEqual([
      expect.objectContaining({
        tierCode: "A",
        remainingTickets: 0,
        isGrandPrize: false,
      }),
      expect.objectContaining({
        tierCode: "SP1",
        remainingTickets: 0,
        isGrandPrize: true,
      }),
    ]);
    expect(initial.tiers[0]!.remainingTickets).toBe(5);
    expect(() => domain.deriveFinalSnapshot(initial, { A: 6 })).toThrowError(
      /DRAW_EXCEEDS_REMAINING/u,
    );
  });

  it("rejects negative derivations and persistent image material", () => {
    const snapshot = {
      ip: "测试",
      pricePerDraw: 58,
      tiers: [{ tierId: "A", total: 1, remaining: 1 }],
    };
    expect(() => domain.deriveFinalSnapshot(snapshot, { A: 2 })).toThrowError(
      /DRAW_EXCEEDS_REMAINING/u,
    );
    expect(() =>
      domain.assertNoImagePayload({
        nested: { imageDataUrl: "data:image/jpeg;base64,x" },
      }),
    ).toThrowError(/PERSISTED_IMAGE_FIELD_FORBIDDEN/u);
  });

  it("accepts camera locations but rejects album sources", () => {
    const location = {
      latitude: 31.23,
      longitude: 121.47,
      accuracy: 12,
      source: "camera",
      capturedAt: "2026-08-21T11:59:00.000Z",
      consentVersion: "v1-location",
    };
    expect(domain.assertLocation(location)).toMatchObject({ source: "camera" });
    expect(() =>
      domain.assertLocation({ ...location, source: "album" }),
    ).toThrowError(/LOCATION_SOURCE_INVALID/u);
  });

  it("keeps reserved ICHI IDs out of the public random format", () => {
    expect(domain.isReservedIchiId("ICHI-001")).toBe(true);
    expect(domain.isReservedIchiId("ICHI-999")).toBe(true);
    expect(domain.isReservedIchiId("ICHI-7KQ2M")).toBe(false);
  });

  it("issues opaque recognition job tokens and stores only their hash", () => {
    const token = domain.newRecognitionJobToken((length: number) =>
      Buffer.alloc(length, 7),
    );
    expect(token).toHaveLength(32);
    expect(domain.hashRecognitionJobToken(token)).toMatch(/^[a-f0-9]{64}$/u);
    expect(domain.hashRecognitionJobToken(token)).not.toContain(token);
    expect(() => domain.hashRecognitionJobToken("short")).toThrowError(
      /RECOGNITION_JOB_TOKEN_INVALID/u,
    );
  });
});
