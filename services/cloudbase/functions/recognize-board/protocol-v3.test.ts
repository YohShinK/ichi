import { describe, expect, it } from "vitest";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const recognizeBoard = require("./index.js") as {
  __test: { normalizeExtraction: (raw: unknown, request: unknown) => unknown };
};

const request = { requestId: "protocol-v3", width: 1200, height: 1600 };

type NormalizedResult = {
  status: string;
  draft: {
    ipName: string | null;
    themeName: string | null;
    tiers: Array<{
      totalTickets: number | null;
      pastedTickets: number | null;
      remainingTickets: number | null;
      slotObservation: {
        totalSlots: number | null;
        coveredSlots: number | null;
        openSlots: number | null;
        unknownSlots: number | null;
      };
    }>;
  };
  issues: Array<{ code: string; action?: string }>;
};

const normalize = (raw: unknown): NormalizedResult =>
  recognizeBoard.__test.normalizeExtraction(raw, request) as NormalizedResult;

const base = () => ({
  target: "target_board",
  frame: "complete",
  allRegularTiersDetected: true,
  oneSlotOneTicketConfirmed: true,
  confidence: 0.95,
  ipName: "PERSONA",
  ipRawText: "PERSONA 30th Anniversary",
  themeName: "30周年",
  price: {
    amount: 58,
    currency: "CNY",
    rawText: "58元/抽",
    confidence: 0.95,
    handwritten: false,
  },
  tiers: [],
  warnings: [],
});

describe("board recognition protocol 3", () => {
  it("keeps total and pasted independent and maps direct fields", () => {
    const raw = base();
    raw.tiers = [
      {
        label: "A",
        rawLabel: "A赏",
        prizeName: null,
        variants: [],
        totalSlots: 10,
        pastedSlots: 3,
        unknownSlots: 0,
        totalSlotsEvidence: "complete_slot_layout",
        slotRows: [{ total: 10, pasted: 3, open: 7, unknown: 0 }],
        confidence: 0.95,
      },
    ];
    const result = normalize(raw);
    expect(result.draft.ipName).toBe("女神异闻录");
    expect(result.draft.themeName).toBe("30周年");
    expect(result.draft.tiers[0]).toMatchObject({
      totalTickets: 10,
      pastedTickets: 3,
      remainingTickets: 7,
      slotObservation: {
        totalSlots: 10,
        coveredSlots: 3,
        openSlots: 7,
        unknownSlots: 0,
      },
    });
  });

  it("keeps pasted null when only capacity is known", () => {
    const raw = base();
    raw.tiers = [
      {
        label: "H",
        rawLabel: "H赏",
        prizeName: null,
        variants: [],
        totalSlots: 16,
        pastedSlots: null,
        unknownSlots: null,
        totalSlotsEvidence: "physical_ticket_count",
        slotRows: [],
        confidence: 0.8,
      },
    ];
    const result = normalize(raw);
    expect(result.draft.tiers[0]).toMatchObject({
      totalTickets: 16,
      pastedTickets: null,
      remainingTickets: null,
    });
    expect(result.status).toBe("needs_user_input");
  });

  it("does not infer full coverage from an empty open list", () => {
    const raw = base();
    raw.tiers = [
      {
        label: "H",
        rawLabel: "H赏",
        prizeName: null,
        variants: [],
        totalSlots: 16,
        pastedSlots: 14,
        unknownSlots: 2,
        totalSlotsEvidence: "physical_ticket_count",
        slotRows: [],
        confidence: 0.8,
      },
    ];
    const result = normalize(raw);
    expect(result.draft.tiers[0].pastedTickets).toBe(14);
    expect(result.draft.tiers[0].pastedTickets).not.toBe(16);
  });

  it("nulls conflicting aggregate fields and emits a blocking issue", () => {
    const raw = base();
    raw.tiers = [
      {
        label: "F",
        rawLabel: "F赏",
        prizeName: null,
        variants: [],
        totalSlots: 10,
        pastedSlots: 10,
        unknownSlots: 0,
        totalSlotsEvidence: "complete_slot_layout",
        slotRows: [{ total: 10, pasted: 3, open: 7, unknown: 0 }],
        confidence: 0.9,
      },
    ];
    const result = normalize(raw);
    expect(result.draft.tiers[0].pastedTickets).toBeNull();
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "TICKET_COUNT_CONFLICT" }),
      ]),
    );
  });

  it("does not fabricate an OTHER tier when no prize tier is observed", () => {
    const result = normalize(base());
    expect(result).not.toHaveProperty("draft");
    expect(result.status).toBe("retake_required");
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "NO_TIERS", action: "retake_image" }),
      ]),
    );
  });

  it("rejects numeric strings before Normalize can coerce them", () => {
    const raw = base() as unknown as {
      tiers: Array<Record<string, unknown>>;
    };
    raw.tiers = [
      {
        label: "A",
        rawLabel: "A赏",
        prizeName: null,
        variants: [],
        totalSlots: 10,
        pastedSlots: 3,
        unknownSlots: 0,
        totalSlotsEvidence: "complete_slot_layout",
        slotRows: [{ total: "10", pasted: 3, open: 7, unknown: 0 }],
        confidence: 0.95,
      },
    ];
    expect(() => normalize(raw)).toThrow("provider_schema_invalid");
  });
});
