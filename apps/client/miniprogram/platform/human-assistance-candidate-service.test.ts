import { describe, expect, it, vi } from "vitest";

import { CandidateHumanAssistanceService } from "./human-assistance-candidate-service.js";
import { HumanAssistanceClient } from "./human-assistance-client.js";

const request = {
  requestId: `ha:${"a".repeat(40)}`,
  candidateRecordRef: `candidate:${"b".repeat(40)}`,
  observationVersion: "verified-v3",
  expiresAt: "2026-09-29T00:00:00.000Z",
  currentCard: { ipName: "本次版面", tiers: [] },
  comparisonCard: { ipName: "候选版面", tiers: [] },
};

describe("candidate HA CloudBase transport", () => {
  it("uses server-issued candidate lineage without V1 record lookup", async () => {
    const callFunction = vi.fn(async ({ name }: { name: string }) => ({
      result:
        name === "v2-shadow-get-my-assistance"
          ? { ok: true, data: [request] }
          : { ok: true, duplicate: false },
    }));
    const service = new CandidateHumanAssistanceService(
      { callFunction },
      "trial",
    );
    const client = new HumanAssistanceClient(service, () =>
      Date.parse("2026-09-28T00:00:00Z"),
    );
    expect(
      await client.refresh(
        new Map([[request.candidateRecordRef, "verified-v3"]]),
      ),
    ).toMatchObject([
      {
        recordId: request.candidateRecordRef,
        submissionVersion: "verified-v3",
      },
    ]);
    expect(await client.answer(request.requestId, "SKIP")).toBe("ANSWERED");
    expect(callFunction).toHaveBeenLastCalledWith({
      name: "v2-shadow-answer-assistance",
      data: expect.objectContaining({
        requestId: request.requestId,
        submissionVersion: "verified-v3",
        candidateRecordRef: request.candidateRecordRef,
        answer: "SKIP",
      }),
    });
    expect(JSON.stringify(callFunction.mock.calls)).not.toContain("openid");
  });

  it("rejects malformed candidate lineage and release calls", async () => {
    const callFunction = vi.fn(async () => ({
      result: {
        ok: true,
        data: [{ ...request, candidateRecordRef: "record-v1" }],
      },
    }));
    expect(
      await new CandidateHumanAssistanceService(
        { callFunction },
        "develop",
      ).listMyRequests(),
    ).toEqual([]);
    callFunction.mockClear();
    expect(
      await new CandidateHumanAssistanceService(
        { callFunction },
        "release",
      ).listMyRequests(),
    ).toEqual([]);
    expect(callFunction).not.toHaveBeenCalled();
  });
});
