import { describe, expect, it, vi } from "vitest";

import {
  HumanAssistanceClient,
  disabledHumanAssistanceService,
  type HumanAssistanceRequestView,
} from "./human-assistance-client.js";

const pending = (
  overrides: Partial<HumanAssistanceRequestView> = {},
): HumanAssistanceRequestView => ({
  requestId: "req-1",
  recordId: "synthetic-record-1",
  submissionVersion: 2,
  expiresAt: 2000,
  state: "PENDING",
  currentBoardLabel: "本次上传",
  candidateBoardLabel: "可能相关",
  ...overrides,
});

describe("TASK-V2-19 Human Assistance local client", () => {
  it("hides no request, expired, answered, withdrawn and version-changed requests", async () => {
    const requests = [
      pending(),
      pending({ requestId: "expired", expiresAt: 999 }),
      pending({ requestId: "answered", state: "ANSWERED" }),
      pending({ requestId: "withdrawn", state: "WITHDRAWN" }),
      pending({ requestId: "version", recordId: "old", submissionVersion: 1 }),
    ];
    const client = new HumanAssistanceClient(
      {
        listMyRequests: async () => requests,
        answer: async () => ({ ok: true }),
      },
      () => 1000,
    );
    expect(await client.refresh(new Map([["synthetic-record-1", 2]]))).toEqual([
      pending(),
    ]);
    client.invalidateRecord("synthetic-record-1");
    expect(client.visibleRequests).toEqual([]);
    expect(
      await new HumanAssistanceClient(disabledHumanAssistanceService).refresh(
        new Map(),
      ),
    ).toEqual([]);
  });

  it.each(["SAME_BOARD", "DIFFERENT_BOARD", "CANNOT_TELL", "SKIP"] as const)(
    "submits %s once and removes the answered request",
    async (answer) => {
      let finish!: (value: { ok: boolean }) => void;
      const submit = vi.fn(
        () => new Promise<{ ok: boolean }>((resolve) => (finish = resolve)),
      );
      const client = new HumanAssistanceClient(
        { listMyRequests: async () => [pending()], answer: submit },
        () => 1000,
      );
      await client.refresh(new Map([["synthetic-record-1", 2]]));
      const first = client.answer("req-1", answer);
      expect(await client.answer("req-1", answer)).toBe("BUSY");
      finish({ ok: true });
      expect(await first).toBe("ANSWERED");
      expect(submit).toHaveBeenCalledTimes(1);
      expect(submit).toHaveBeenCalledWith({
        requestId: "req-1",
        submissionVersion: 2,
        actionId: `ha:req-1:2:${answer}`,
        answer,
      });
      expect(client.visibleRequests).toEqual([]);
    },
  );

  it("fails closed on list/answer failure without touching upload state", async () => {
    const client = new HumanAssistanceClient(
      {
        listMyRequests: async () => [pending()],
        answer: async () => {
          throw new Error("offline");
        },
      },
      () => 1000,
    );
    await client.refresh(new Map([["synthetic-record-1", 2]]));
    expect(await client.answer("req-1", "SKIP")).toBe("UNAVAILABLE");
    expect(client.visibleRequests).toHaveLength(1);
    client.clear();
    expect(client.visibleRequests).toEqual([]);
  });
});
