import { createRequire } from "node:module";
import { createHash } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const { main, __test } = require("./index.js") as {
  main(event: unknown, runtime: unknown): Promise<unknown>;
  __test: {
    canonicalizeTier(value: unknown): string | null;
    observedFromTickets(value: unknown): {
      total: number;
      tierCounts: Record<string, number>;
      unknownTickets: number;
      invalid: boolean;
    };
    exactReconcile(
      expected: { total: number; tierCounts: Record<string, number> },
      observed: {
        total: number;
        tierCounts: Record<string, number>;
        unknownTickets: number;
        invalid: boolean;
      },
    ): { status: string; mismatches: unknown[] };
    authoritativeSubmissionFacts(
      event: unknown,
      observation: unknown,
      version: number,
    ): {
      authoritativeDrawEvents: unknown[];
      authoritativeDrawSubmissionVersion: number;
      finalSnapshot: { remainingTickets: number };
    } | null;
    expectedFromAuthoritativeRecord(
      record: unknown,
      submissionVersion: number,
    ): { total: number; tierCounts: Record<string, number> };
    callProvider(input: {
      fetchImpl: typeof fetch;
      apiKey: string;
      workspaceId: string;
      region: string;
      imageUrl: string;
    }): Promise<unknown>;
    isDeletedObservation(record: unknown): boolean;
    noteHash(value: string): string;
    normalizeUserNote(value: unknown): string;
    locationDistanceMeters(left: unknown, right: unknown): number;
    evaluateLocationGate(input: {
      boardLocation: unknown;
      ticketLocation: unknown;
      radius: unknown;
    }): { status: string; reasonCode?: string | null };
    reviewUserNote(input: {
      cloud: unknown;
      openId: string;
      userNote: string;
      runtime: {
        noteReviewer?: (input: unknown) => Promise<unknown>;
      };
    }): Promise<{ status: string; reasonCode?: string; suggest?: string }>;
  };
};
const { hashIdentity } = require("../../shared/domain.js") as {
  hashIdentity(input: {
    appId: string;
    openId: string;
    secret: string;
  }): string;
};

type TestDocument = Record<string, unknown>;
const createTestDatabase = (
  seed: Record<string, Record<string, TestDocument>>,
  options?: { rejectLargeObservationUpdate?: boolean },
) => {
  const collections = new Map(
    Object.entries(seed).map(([name, documents]) => [
      name,
      new Map(
        Object.entries(documents).map(([id, value]) => [
          id,
          structuredClone(value),
        ]),
      ),
    ]),
  );
  const ensure = (name: string) => {
    let documents = collections.get(name);
    if (!documents) {
      documents = new Map();
      collections.set(name, documents);
    }
    return documents;
  };
  const database = {
    collection(name: string) {
      const documents = ensure(name);
      return {
        doc(id: string) {
          return {
            async get() {
              const data = documents.get(id);
              if (!data) throw new Error("not found");
              return { data: structuredClone(data) };
            },
            async set(input: { data: TestDocument }) {
              documents.set(id, structuredClone(input.data));
            },
            async update(input: { data: TestDocument }) {
              const current = documents.get(id);
              if (!current) throw new Error("not found");
              if (
                options?.rejectLargeObservationUpdate &&
                name === "observationCandidates" &&
                ("finalSnapshot" in input.data ||
                  "authoritativeDrawEvents" in input.data)
              )
                throw Object.assign(new Error("database internal error"), {
                  errCode: -502001,
                });
              documents.set(id, { ...current, ...structuredClone(input.data) });
            },
          };
        },
      };
    },
    async runTransaction(callback: (tx: unknown) => Promise<unknown>) {
      return callback(database);
    },
  };
  return database;
};

const createVerificationHarness = (input?: {
  remainingTickets?: number;
  noteReviewer?: (value: unknown) => Promise<unknown>;
  providerTickets?: unknown[];
  deleteFileFails?: boolean;
  rejectLargeObservationUpdate?: boolean;
}) => {
  const appId = "wx-prize-ticket-test";
  const openId = "openid-prize-ticket-test";
  const secret = "identity-prize-ticket-test-secret";
  const accountId = "account-prize-ticket-test";
  const recordId = "record_0123456789abcdef0123456789abcdef";
  const boardId = "board-prize-ticket-test";
  const identityId = hashIdentity({ appId, openId, secret });
  const database = createTestDatabase(
    {
      wechatIdentities: { [identityId]: { accountId } },
      observationCandidates: {
        [recordId]: {
          ownerAccountId: accountId,
          recordId,
          boardId,
          sourcePath: "assisted-draw",
          status: "private_saved",
          location: {
            latitude: 31.23,
            longitude: 121.47,
            accuracy: 10,
          },
          latestPrizeTicketSubmissionVersion: 0,
          initialSnapshot: {
            schemaVersion: "board-record-r2-1.0.0",
            recognitionVersion: "R2",
            ipName: "世界之外",
            themeName: "此间即无间",
            pricePerDraw: 65,
            currency: "CNY",
            tiers: [
              {
                tierCode: "A",
                rawLabel: "A賞",
                remainingTickets: input?.remainingTickets ?? 1,
                isGrandPrize: true,
              },
            ],
          },
        },
      },
    },
    { rejectLargeObservationUpdate: input?.rejectLargeObservationUpdate },
  );
  const deleteFile = vi.fn(async () => {
    if (input?.deleteFileFails) throw new Error("temporary storage failure");
    return {};
  });
  const fetchImpl = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      id: "provider-request",
      choices: [
        {
          message: {
            content: JSON.stringify(
              observable(
                input?.providerTickets ?? [
                  { ticketIndex: 1, tierRaw: "A賞", tierCode: "A" },
                ],
              ),
            ),
          },
        },
      ],
    }),
  }));
  const cloud = {
    DYNAMIC_CURRENT_ENV: "test",
    init: () => undefined,
    database: () => database,
    getWXContext: () => ({ APPID: appId, OPENID: openId }),
    getTempFileURL: async () => ({
      fileList: [{ tempFileURL: "https://example.test/ticket.jpg" }],
    }),
    deleteFile,
    openapi: { security: { msgSecCheck: vi.fn() } },
  };
  const runtime = {
    cloud,
    fetchImpl: fetchImpl as unknown as typeof fetch,
    noteReviewer:
      input?.noteReviewer ?? (async () => ({ result: { suggest: "pass" } })),
    env: {
      IDENTITY_HMAC_KEY: secret,
      PRIZE_TICKET_LOCATION_RADIUS_METERS: "50",
      DASHSCOPE_API_KEY: "test-key",
      DASHSCOPE_WORKSPACE_ID: "test-workspace",
    },
    logger: { info: vi.fn(), error: vi.fn() },
  };
  const event = (version = 1) => ({
    recordId,
    boardId,
    submissionVersion: version,
    imageFileId: `cloud://test/recognition-temp/prize-ticket-${recordId}-v${version}/ticket.jpg`,
    captureSource: version === 1 ? "camera" : "gallery",
    capturedAt: 1,
    userNote: "入口右侧，A赏已抽出",
    ticketLocation: {
      latitude: 31.23,
      longitude: 121.47,
      accuracy: 12,
      source: "camera",
      capturedAt: "2026-08-27T12:00:00.000Z",
      consentVersion: "v1-location",
    },
    authoritativeDrawEvents: [{ eventId: "draw-1", tierCode: "A" }],
  });
  return { database, deleteFile, fetchImpl, runtime, event, recordId, boardId };
};

const observable = (tickets: unknown[]) => ({
  protocolVersion: "prize-ticket-verification-2",
  evidenceType: "physical_tickets",
  tickets,
});
const expected = { total: 6, tierCounts: { A: 2, B: 1, C: 3 } };

describe("PrizeTicketVerificationProviderV1", () => {
  it("canonicalizes NFKC letter-tier labels and counts physical ticket items", () => {
    expect(__test.canonicalizeTier("Ａ 賞券")).toBe("A");
    expect(
      __test.observedFromTickets(
        observable([
          { ticketIndex: 1, tierRaw: "A賞", tierCode: "A" },
          { ticketIndex: 2, tierRaw: "A 赏", tierCode: "A" },
          { ticketIndex: 3, tierRaw: "C賞", tierCode: "C" },
        ]),
      ),
    ).toMatchObject({
      total: 3,
      tierCounts: { A: 2, C: 1 },
      unknownTickets: 0,
    });
  });

  it("treats duplicate printed text within one ticket as one physical ticket", () => {
    expect(
      __test.observedFromTickets(
        observable([
          { ticketIndex: 1, tierRaw: "A賞 / A PRIZE / A赏奖品", tierCode: "A" },
        ]),
      ),
    ).toMatchObject({ total: 1, tierCounts: { A: 1 } });
  });

  it("requires an exact match, not merely an equal total", () => {
    const observed = __test.observedFromTickets(
      observable([
        { ticketIndex: 1, tierRaw: "A賞", tierCode: "A" },
        { ticketIndex: 2, tierRaw: "B賞", tierCode: "B" },
        { ticketIndex: 3, tierRaw: "C賞", tierCode: "C" },
        { ticketIndex: 4, tierRaw: "C賞", tierCode: "C" },
        { ticketIndex: 5, tierRaw: "C賞", tierCode: "C" },
        { ticketIndex: 6, tierRaw: "C賞", tierCode: "C" },
      ]),
    );
    expect(__test.exactReconcile(expected, observed)).toMatchObject({
      status: "MISMATCH",
    });
  });

  it("keeps unknown tickets out of deterministic guesses", () => {
    const observed = __test.observedFromTickets(
      observable([
        { ticketIndex: 1, tierRaw: "A賞", tierCode: "A" },
        { ticketIndex: 2, tierRaw: "A賞", tierCode: "A" },
        { ticketIndex: 3, tierRaw: null, tierCode: null },
      ]),
    );
    expect(
      __test.exactReconcile({ total: 3, tierCounts: { A: 2, B: 1 } }, observed),
    ).toMatchObject({ status: "NEEDS_REVIEW" });
  });

  it("never verifies digital evidence and routes uncertain physical evidence to review", () => {
    expect(
      __test.exactReconcile(
        { total: 1, tierCounts: { A: 1 } },
        __test.observedFromTickets({
          protocolVersion: "prize-ticket-verification-2",
          evidenceType: "digital_or_screen",
          tickets: [],
        }),
      ),
    ).toMatchObject({ status: "INVALID_EVIDENCE" });
    expect(
      __test.exactReconcile(
        { total: 1, tierCounts: { A: 1 } },
        __test.observedFromTickets({
          protocolVersion: "prize-ticket-verification-2",
          evidenceType: "uncertain",
          tickets: [],
        }),
      ),
    ).toMatchObject({ status: "NEEDS_REVIEW" });
  });

  it("detects missing and extra physical tickets", () => {
    const ticket = { ticketIndex: 1, tierRaw: "A賞", tierCode: "A" };
    expect(
      __test.exactReconcile(
        { total: 3, tierCounts: { A: 3 } },
        __test.observedFromTickets(
          observable([
            ticket,
            { ...ticket, ticketIndex: 2 },
            { ...ticket, ticketIndex: 3 },
            { ...ticket, ticketIndex: 4 },
          ]),
        ),
      ),
    ).toMatchObject({ status: "MISMATCH" });
    expect(
      __test.exactReconcile(
        { total: 4, tierCounts: { A: 4 } },
        __test.observedFromTickets(
          observable([
            ticket,
            { ...ticket, ticketIndex: 2 },
            { ...ticket, ticketIndex: 3 },
          ]),
        ),
      ),
    ).toMatchObject({ status: "MISMATCH" });
  });

  it("sends no expected result or draw history to Qwen", async () => {
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.stringify(JSON.parse(String(init?.body)));
      expect(body).not.toContain("expected");
      expect(body).not.toContain("draw");
      expect(body).toContain("qwen3.7-flash");
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(observable([])) } }],
        }),
      } as Response;
    });
    await __test.callProvider({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      apiKey: "test",
      workspaceId: "test",
      region: "cn-beijing",
      imageUrl: "https://example.test/evidence.jpg",
    });
  });

  it("persists the authoritative draw facts with the same submission version", () => {
    const facts = __test.authoritativeSubmissionFacts(
      {
        authoritativeDrawEvents: [
          { eventId: "round-1", tierCode: "A", occurredAt: 1 },
          { eventId: "round-2", tierCode: "B", occurredAt: 2 },
        ],
      },
      {
        initialSnapshot: {
          ip: "世界之外",
          pricePerDraw: 58,
          tiers: [
            { tierId: "A", total: 2, remaining: 2, attached: 0 },
            { tierId: "B", total: 1, remaining: 1, attached: 0 },
          ],
          totalTickets: 3,
          remainingTickets: 3,
          attachedTickets: 0,
        },
      },
      1,
    );
    expect(facts).toMatchObject({
      authoritativeDrawSubmissionVersion: 1,
      finalSnapshot: { remainingTickets: 1 },
    });
    expect(__test.expectedFromAuthoritativeRecord(facts, 1)).toEqual({
      total: 2,
      tierCounts: { A: 1, B: 1 },
    });
  });

  it("replays the production five-draw shape through schema and exact reconciliation", async () => {
    const providerFixture = observable([
      { ticketIndex: 1, tierRaw: "A賞", tierCode: "A" },
      { ticketIndex: 2, tierRaw: "B賞", tierCode: "B" },
      { ticketIndex: 3, tierRaw: "B賞", tierCode: "B" },
      { ticketIndex: 4, tierRaw: "C賞", tierCode: "C" },
      { ticketIndex: 5, tierRaw: "D賞", tierCode: "D" },
    ]);
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify(providerFixture) } }],
      }),
    })) as unknown as typeof fetch;
    const provider = await __test.callProvider({
      fetchImpl,
      apiKey: "test",
      workspaceId: "test",
      region: "cn-beijing",
      imageUrl: "https://example.test/current-submission.jpg",
    });
    const facts = __test.authoritativeSubmissionFacts(
      {
        authoritativeDrawEvents: [
          { eventId: "draw-1", tierCode: "A", occurredAt: 1 },
          { eventId: "draw-2", tierCode: "B", occurredAt: 2 },
          { eventId: "draw-3", tierCode: "B", occurredAt: 3 },
          { eventId: "draw-4", tierCode: "C", occurredAt: 4 },
          { eventId: "draw-5", tierCode: "D", occurredAt: 5 },
        ],
      },
      {
        initialSnapshot: {
          ip: "世界之外",
          pricePerDraw: 58,
          tiers: [
            { tierId: "A", total: 1, remaining: 1, attached: 0 },
            { tierId: "B", total: 2, remaining: 2, attached: 0 },
            { tierId: "C", total: 1, remaining: 1, attached: 0 },
            { tierId: "D", total: 1, remaining: 1, attached: 0 },
          ],
          totalTickets: 5,
          remainingTickets: 5,
          attachedTickets: 0,
        },
      },
      1,
    );
    const expectedDraws = __test.expectedFromAuthoritativeRecord(facts, 1);
    const observedTickets = __test.observedFromTickets(provider);

    expect(expectedDraws).toEqual({
      total: 5,
      tierCounts: { A: 1, B: 2, C: 1, D: 1 },
    });
    expect(__test.exactReconcile(expectedDraws, observedTickets)).toEqual({
      status: "VERIFIED",
      mismatches: [],
    });
  });

  it("keeps an incorrect five-ticket fixture terminally mismatched", () => {
    const expectedDraws = {
      total: 5,
      tierCounts: { A: 1, B: 2, C: 1, D: 1 },
    };
    const observedTickets = __test.observedFromTickets(
      observable([
        { ticketIndex: 1, tierRaw: "A賞", tierCode: "A" },
        { ticketIndex: 2, tierRaw: "B賞", tierCode: "B" },
        { ticketIndex: 3, tierRaw: "B賞", tierCode: "B" },
        { ticketIndex: 4, tierRaw: "B賞", tierCode: "B" },
        { ticketIndex: 5, tierRaw: "D賞", tierCode: "D" },
      ]),
    );

    expect(__test.exactReconcile(expectedDraws, observedTickets)).toMatchObject(
      {
        status: "MISMATCH",
        mismatches: [
          { tier: "B", expected: 2, observed: 3 },
          { tier: "C", expected: 1, observed: 0 },
        ],
      },
    );
  });

  it("lets an authoritative deletion win over an in-flight verification result", () => {
    expect(__test.isDeletedObservation({ status: "deleting" })).toBe(true);
    expect(__test.isDeletedObservation(null)).toBe(true);
    expect(__test.isDeletedObservation({ status: "uploaded" })).toBe(false);
  });

  it("keeps the prompt example identical to the required provider envelope", async () => {
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as {
        messages: Array<{ content: Array<{ type: string; text?: string }> }>;
      };
      const text = body.messages[0]?.content.find(
        (item) => item.type === "text",
      )?.text;
      expect(text).toContain('"protocolVersion":"prize-ticket-verification-2"');
      expect(text).toContain('"evidenceType":"physical_tickets"');
      return {
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(observable([])) } }],
        }),
      } as Response;
    });
    await __test.callProvider({
      fetchImpl: fetchImpl as unknown as typeof fetch,
      apiKey: "test",
      workspaceId: "test",
      region: "cn-beijing",
      imageUrl: "https://example.test/evidence.jpg",
    });
  });

  it("never passes location without an explicit configured radius", () => {
    const boardLocation = { latitude: 31.23, longitude: 121.47, accuracy: 10 };
    const ticketLocation = { latitude: 31.23, longitude: 121.47, accuracy: 12 };
    expect(
      __test.evaluateLocationGate({
        boardLocation,
        ticketLocation,
        radius: undefined,
      }),
    ).toEqual({
      status: "LOCATION_PENDING",
      reasonCode: "LOCATION_REVIEW_UNAVAILABLE",
    });
    expect(
      __test.evaluateLocationGate({
        boardLocation,
        ticketLocation,
        radius: "25",
      }),
    ).toMatchObject({ status: "LOCATION_PASSED" });
  });

  it("marks an out-of-range location terminal without inventing an accuracy adjustment", () => {
    expect(
      __test.evaluateLocationGate({
        boardLocation: { latitude: 31.23, longitude: 121.47, accuracy: 10 },
        ticketLocation: { latitude: 31.24, longitude: 121.47, accuracy: 10 },
        radius: "25",
      }),
    ).toMatchObject({
      status: "LOCATION_FAILED",
      reasonCode: "LOCATION_OUT_OF_RANGE",
    });
  });

  it("passes notes only on an explicit real-review pass and fails closed otherwise", async () => {
    await expect(
      __test.reviewUserNote({
        cloud: {},
        openId: "openid",
        userNote: "现场备注",
        runtime: {
          noteReviewer: async () => ({ result: { suggest: "pass" } }),
        },
      }),
    ).resolves.toEqual({ status: "NOTE_PASSED" });
    await expect(
      __test.reviewUserNote({
        cloud: {},
        openId: "openid",
        userNote: "现场备注",
        runtime: {
          noteReviewer: async () => ({ result: { suggest: "review" } }),
        },
      }),
    ).resolves.toEqual({ status: "NOTE_FAILED" });
    await expect(
      __test.reviewUserNote({
        cloud: {},
        openId: "openid",
        userNote: "现场备注",
        runtime: { noteReviewer: async () => ({}) },
      }),
    ).resolves.toEqual({ status: "NOTE_FAILED" });
    await expect(
      __test.reviewUserNote({
        cloud: {},
        openId: "openid",
        userNote: "现场备注",
        runtime: {
          noteReviewer: async () => {
            throw new Error("unavailable");
          },
        },
      }),
    ).resolves.toEqual({ status: "NOTE_FAILED" });
  });

  it("invalidates a prior note decision whenever the exact trimmed text changes", () => {
    expect(__test.noteHash("入口右侧")).toHaveLength(64);
    expect(__test.noteHash("入口右侧")).toBe(__test.noteHash("入口右侧"));
    expect(__test.noteHash("入口左侧")).not.toBe(__test.noteHash("入口右侧"));
  });

  it("requires a non-empty userNote and preserves the user's trimmed text", () => {
    expect(__test.normalizeUserNote("  入口右侧，A赏已抽出  ")).toBe(
      "入口右侧，A赏已抽出",
    );
    expect(() => __test.normalizeUserNote("")).toThrow("USER_NOTE_REQUIRED");
    expect(() => __test.normalizeUserNote("   ")).toThrow("USER_NOTE_REQUIRED");
  });

  it("runs LOCATION then PHOTO then NOTE and writes one idempotent APPROVED record", async () => {
    const noteReviewer = vi.fn(async () => ({ result: { suggest: "pass" } }));
    const harness = createVerificationHarness({ noteReviewer });
    const submission = await main(
      { action: "submit", ...harness.event() },
      harness.runtime,
    );
    expect(submission).toMatchObject({
      ok: true,
      data: { status: "PHOTO_PENDING" },
    });
    const approved = await main(
      { action: "verify", ...harness.event() },
      harness.runtime,
    );
    expect(approved).toMatchObject({
      ok: true,
      data: { status: "APPROVED", photoStatus: "VERIFIED" },
    });
    const retry = await main(
      { action: "verify", ...harness.event() },
      harness.runtime,
    );
    expect(retry).toMatchObject({
      ok: true,
      data: { status: "APPROVED", idempotent: true },
    });
    await expect(
      main(
        {
          action: "submit",
          ...harness.event(),
          authoritativeDrawEvents: [{ eventId: "draw-2", tierCode: "A" }],
        },
        harness.runtime,
      ),
    ).resolves.toEqual({
      ok: false,
      error: { code: "SUBMISSION_VERSION_CONFLICT" },
    });
    expect(harness.fetchImpl).toHaveBeenCalledOnce();
    expect(noteReviewer).toHaveBeenCalledWith({
      content: "入口右侧，A赏已抽出",
      version: 2,
      scene: 2,
      openid: "openid-prize-ticket-test",
    });
    const record = (
      await harness.database
        .collection("observationCandidates")
        .doc(harness.recordId)
        .get()
    ).data;
    expect(record).toMatchObject({
      ownerAccountId: "account-prize-ticket-test",
      verificationStatus: "APPROVED",
      prizeTicketVerificationStatus: "APPROVED",
      status: "uploaded",
      initialSnapshot: {
        tiers: [{ remainingTickets: 1 }],
      },
    });
    expect(JSON.stringify(record)).not.toMatch(
      /totalTickets|pastedTickets|originalEvidenceFileId|imageFileId/u,
    );
    const attempt = (
      await harness.database
        .collection("drawSubmissions")
        .doc(`prize-ticket:${harness.recordId}:${harness.boardId}:1`)
        .get()
    ).data;
    expect(attempt).toMatchObject({
      status: "APPROVED",
      imageFileId: null,
      userNote: "入口右侧，A赏已抽出",
    });
    const cleanupId = `storage:${createHash("sha256")
      .update(harness.event().imageFileId)
      .digest("hex")
      .slice(0, 32)}`;
    await expect(
      harness.database.collection("deletionJobs").doc(cleanupId).get(),
    ).resolves.toMatchObject({
      data: {
        targetType: "storage-object",
        status: "completed",
        verificationId: `prize-ticket:${harness.recordId}:${harness.boardId}:1`,
      },
    });
    expect(harness.deleteFile).toHaveBeenCalledOnce();
  });

  it("publishes by version pointer when CloudBase rejects large observation updates", async () => {
    const harness = createVerificationHarness({
      rejectLargeObservationUpdate: true,
    });
    await main({ action: "submit", ...harness.event() }, harness.runtime);

    await expect(
      main({ action: "verify", ...harness.event() }, harness.runtime),
    ).resolves.toMatchObject({
      ok: true,
      data: { status: "APPROVED", photoStatus: "VERIFIED" },
    });
    const record = (
      await harness.database
        .collection("observationCandidates")
        .doc(harness.recordId)
        .get()
    ).data;
    expect(record).toMatchObject({
      publishedSubmissionVersion: 1,
      status: "uploaded",
      verificationStatus: "APPROVED",
    });
    expect(record.finalSnapshot).toBeUndefined();
    expect(record.authoritativeDrawEvents).toBeUndefined();
  });

  it("keeps failed terminal evidence deletion retryable in the existing maintenance queue", async () => {
    const harness = createVerificationHarness({ deleteFileFails: true });
    await main({ action: "submit", ...harness.event() }, harness.runtime);
    await expect(
      main({ action: "verify", ...harness.event() }, harness.runtime),
    ).resolves.toMatchObject({
      ok: true,
      data: { status: "APPROVED" },
    });
    const cleanupId = `storage:${createHash("sha256")
      .update(harness.event().imageFileId)
      .digest("hex")
      .slice(0, 32)}`;
    await expect(
      harness.database.collection("deletionJobs").doc(cleanupId).get(),
    ).resolves.toMatchObject({
      data: {
        targetType: "storage-object",
        status: "retry",
      },
    });
  });

  it("keeps LOCATION_FAILED terminal and never calls PHOTO or NOTE", async () => {
    const noteReviewer = vi.fn(async () => ({ result: { suggest: "pass" } }));
    const harness = createVerificationHarness({ noteReviewer });
    const result = await main(
      {
        action: "submit",
        ...harness.event(),
        ticketLocation: {
          ...harness.event().ticketLocation,
          latitude: 32.23,
        },
      },
      harness.runtime,
    );
    expect(result).toMatchObject({
      ok: true,
      data: {
        status: "LOCATION_FAILED",
        reasonCode: "LOCATION_OUT_OF_RANGE",
      },
    });
    expect(harness.fetchImpl).not.toHaveBeenCalled();
    expect(noteReviewer).not.toHaveBeenCalled();
    expect(harness.deleteFile).toHaveBeenCalledOnce();
  });

  it.each([
    [0.001, "PHOTO_PENDING"],
    [0.003, "LOCATION_FAILED"],
  ] as const)(
    "uses the approved 200m production radius for latitude delta %s",
    async (latitudeDelta, expectedStatus) => {
      const harness = createVerificationHarness();
      const runtime = {
        ...harness.runtime,
        env: {
          ...harness.runtime.env,
          PRIZE_TICKET_LOCATION_RADIUS_METERS: "200",
        },
      };
      await expect(
        main(
          {
            action: "submit",
            ...harness.event(),
            ticketLocation: {
              ...harness.event().ticketLocation,
              latitude: 31.23 + latitudeDelta,
            },
          },
          runtime,
        ),
      ).resolves.toMatchObject({
        ok: true,
        data: { status: expectedStatus },
      });
      expect(harness.fetchImpl).not.toHaveBeenCalled();
    },
  );

  it("blocks the attempt before PHOTO when the production location radius is not configured", async () => {
    const harness = createVerificationHarness();
    const runtime = {
      ...harness.runtime,
      env: {
        ...harness.runtime.env,
        PRIZE_TICKET_LOCATION_RADIUS_METERS: undefined,
      },
    };
    await expect(
      main({ action: "submit", ...harness.event() }, runtime),
    ).resolves.toMatchObject({
      ok: true,
      data: {
        status: "LOCATION_PENDING",
        reasonCode: "LOCATION_REVIEW_UNAVAILABLE",
      },
    });
    await expect(
      main({ action: "verify", ...harness.event() }, runtime),
    ).resolves.toMatchObject({
      ok: true,
      data: { status: "LOCATION_PENDING" },
    });
    expect(harness.fetchImpl).not.toHaveBeenCalled();
  });

  it.each(["not-a-number", "0", "-1"])(
    "fails LOCATION closed for invalid radius %s",
    async (radius) => {
      const harness = createVerificationHarness();
      await expect(
        main(
          { action: "submit", ...harness.event() },
          {
            ...harness.runtime,
            env: {
              ...harness.runtime.env,
              PRIZE_TICKET_LOCATION_RADIUS_METERS: radius,
            },
          },
        ),
      ).resolves.toMatchObject({
        ok: true,
        data: {
          status: "LOCATION_PENDING",
          reasonCode: "LOCATION_REVIEW_UNAVAILABLE",
        },
      });
      expect(harness.fetchImpl).not.toHaveBeenCalled();
    },
  );

  it("retries PHOTO with the prior LOCATION pass and does not require a second location", async () => {
    const harness = createVerificationHarness({ providerTickets: [] });
    await main({ action: "submit", ...harness.event() }, harness.runtime);
    await expect(
      main({ action: "verify", ...harness.event() }, harness.runtime),
    ).resolves.toMatchObject({
      ok: true,
      data: { status: "PHOTO_FAILED" },
    });

    const retryHarnessEvent = harness.event(2);
    delete (retryHarnessEvent as { ticketLocation?: unknown }).ticketLocation;
    await expect(
      main(
        { action: "submit", ...retryHarnessEvent },
        {
          ...harness.runtime,
          fetchImpl: vi.fn(async () => ({
            ok: true,
            status: 200,
            json: async () => ({
              choices: [
                {
                  message: {
                    content: JSON.stringify(
                      observable([
                        { ticketIndex: 1, tierRaw: "A賞", tierCode: "A" },
                      ]),
                    ),
                  },
                },
              ],
            }),
          })) as unknown as typeof fetch,
        },
      ),
    ).resolves.toMatchObject({
      ok: true,
      data: { status: "PHOTO_PENDING" },
    });
    const retryAttempt = (
      await harness.database
        .collection("drawSubmissions")
        .doc(`prize-ticket:${harness.recordId}:${harness.boardId}:2`)
        .get()
    ).data;
    expect(retryAttempt).toMatchObject({
      locationReview: { status: "LOCATION_PASSED" },
      ticketLocation: { source: "camera" },
    });
  });

  it("keeps a provider transport failure retryable on the same submission and image", async () => {
    const harness = createVerificationHarness();
    await main({ action: "submit", ...harness.event() }, harness.runtime);
    const unavailableRuntime = {
      ...harness.runtime,
      fetchImpl: vi.fn(async () => ({
        ok: false,
        status: 503,
        json: async () => ({}),
      })) as unknown as typeof fetch,
    };

    await expect(
      main({ action: "verify", ...harness.event() }, unavailableRuntime),
    ).resolves.toMatchObject({
      ok: true,
      data: {
        status: "PROVIDER_FAILED",
        errorCode: "PRIZE_TICKET_PROVIDER_FAILED",
        providerDiagnostics: { httpStatus: 503, stage: "HTTP_RESPONSE" },
      },
    });
    const attemptAfterFailure = (
      await harness.database
        .collection("drawSubmissions")
        .doc(`prize-ticket:${harness.recordId}:${harness.boardId}:1`)
        .get()
    ).data;
    expect(attemptAfterFailure).toMatchObject({
      status: "PROVIDER_FAILED",
      imageFileId: harness.event().imageFileId,
      errorCode: "PRIZE_TICKET_PROVIDER_FAILED",
      providerDiagnostics: { httpStatus: 503, stage: "HTTP_RESPONSE" },
    });
    expect(harness.deleteFile).not.toHaveBeenCalled();

    await expect(
      main({ action: "verify", ...harness.event() }, harness.runtime),
    ).resolves.toMatchObject({
      ok: true,
      data: { status: "APPROVED", photoStatus: "VERIFIED" },
    });
    expect(harness.deleteFile).toHaveBeenCalledOnce();
  });

  it("fails NOTE closed when msgSecCheck is unknown or unavailable", async () => {
    const harness = createVerificationHarness({
      noteReviewer: async () => ({}),
    });
    await main({ action: "submit", ...harness.event() }, harness.runtime);
    await expect(
      main({ action: "verify", ...harness.event() }, harness.runtime),
    ).resolves.toMatchObject({
      ok: true,
      data: {
        status: "NOTE_FAILED",
      },
    });
    const record = (
      await harness.database
        .collection("observationCandidates")
        .doc(harness.recordId)
        .get()
    ).data;
    expect(record.verificationStatus).toBeUndefined();
    expect(record.status).not.toBe("uploaded");
  });

  it("retries only NOTE after failure and invalidates the old note decision first", async () => {
    let resolveNoteReview!: (value: unknown) => void;
    const pendingNoteReview = new Promise((resolve) => {
      resolveNoteReview = resolve;
    });
    const noteReviewer = vi
      .fn()
      .mockResolvedValueOnce({ result: { suggest: "risky" } })
      .mockReturnValueOnce(pendingNoteReview);
    const harness = createVerificationHarness({ noteReviewer });
    await main({ action: "submit", ...harness.event() }, harness.runtime);
    await expect(
      main({ action: "verify", ...harness.event() }, harness.runtime),
    ).resolves.toMatchObject({
      ok: true,
      data: { status: "NOTE_FAILED" },
    });
    expect(harness.fetchImpl).toHaveBeenCalledOnce();
    const retry = main(
      {
        action: "review-note",
        recordId: harness.recordId,
        boardId: harness.boardId,
        submissionVersion: 1,
        userNote: "修改后的现场备注",
      },
      harness.runtime,
    );
    await vi.waitFor(() => expect(noteReviewer).toHaveBeenCalledTimes(2));
    const pendingRecord = (
      await harness.database
        .collection("observationCandidates")
        .doc(harness.recordId)
        .get()
    ).data;
    expect(pendingRecord).toMatchObject({ status: "private_saved" });
    expect(pendingRecord.verificationStatus).toBeUndefined();
    expect(pendingRecord.userNote).toBeUndefined();
    resolveNoteReview({ result: { suggest: "pass" } });
    await expect(retry).resolves.toMatchObject({
      ok: true,
      data: { status: "APPROVED" },
    });
    expect(harness.fetchImpl).toHaveBeenCalledOnce();
    expect(noteReviewer).toHaveBeenCalledTimes(2);
    const record = (
      await harness.database
        .collection("observationCandidates")
        .doc(harness.recordId)
        .get()
    ).data;
    expect(record).toMatchObject({
      verificationStatus: "APPROVED",
    });
    const updatedAttempt = (
      await harness.database
        .collection("drawSubmissions")
        .doc(`prize-ticket:${harness.recordId}:${harness.boardId}:1`)
        .get()
    ).data;
    expect(updatedAttempt).toMatchObject({
      status: "APPROVED",
      userNote: "修改后的现场备注",
    });
  });
});
