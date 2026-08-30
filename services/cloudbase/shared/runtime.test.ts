import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const {
  createRuntime,
  failure,
  recognizedSnapshotSummary,
  stripDatabaseMetadata,
} = require("./runtime.js");
const {
  IchiError,
  hashIdentity,
  hashRecognitionJobToken,
} = require("./domain.js");

type Document = Record<string, unknown>;

const createDocumentDatabase = (
  seed: Record<string, Record<string, Document>>,
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
  const ensureCollection = (name: string) => {
    let documents = collections.get(name);
    if (!documents) {
      documents = new Map();
      collections.set(name, documents);
    }
    return documents;
  };
  let transactionTail = Promise.resolve();
  const database = {
    command: {},
    collection(name: string) {
      const documents = ensureCollection(name);
      return {
        doc(id: string) {
          return {
            async get() {
              const data = documents.get(id);
              if (!data) throw new Error("not found");
              return { data: structuredClone(data) };
            },
            async set(input: { readonly data: Document }) {
              documents.set(id, structuredClone(input.data));
            },
            async update(input: { readonly data: Document }) {
              const current = documents.get(id);
              if (!current) throw new Error("not found");
              documents.set(id, {
                ...current,
                ...structuredClone(input.data),
              });
            },
            async remove() {
              documents.delete(id);
            },
          };
        },
        where(query: Record<string, unknown>) {
          const matching = () =>
            [...documents.entries()]
              .filter(([, value]) =>
                Object.entries(query).every(([key, expected]) =>
                  expected && typeof expected === "object"
                    ? Array.isArray((expected as { $in?: unknown[] }).$in)
                      ? (expected as { $in: unknown[] }).$in.includes(
                          value[key],
                        )
                      : (expected as { $lte?: unknown }).$lte !== undefined
                        ? String(value[key]) <=
                          String((expected as { $lte: unknown }).$lte)
                        : value[key] === expected
                    : value[key] === expected,
                ),
              )
              .map(([id, value]) => ({ _id: id, ...structuredClone(value) }));
          return {
            orderBy() {
              return this;
            },
            async update(input: { readonly data: Document }) {
              matching().forEach((value) => {
                const current = documents.get(String(value._id));
                if (current)
                  documents.set(String(value._id), {
                    ...current,
                    ...structuredClone(input.data),
                  });
              });
            },
            limit() {
              return {
                async get() {
                  return { data: matching() };
                },
                async remove() {
                  matching().forEach((value) => documents.delete(value._id));
                },
              };
            },
          };
        },
        orderBy() {
          return {
            limit() {
              return {
                async get() {
                  return {
                    data: [...documents.entries()].map(([id, value]) => ({
                      _id: id,
                      ...structuredClone(value),
                    })),
                  };
                },
              };
            },
          };
        },
      };
    },
    async runTransaction(callback: (transaction: unknown) => Promise<unknown>) {
      const operation = transactionTail.then(() => callback(database));
      transactionTail = operation.then(
        () => undefined,
        () => undefined,
      );
      return operation;
    },
  };
  return database;
};

const createR2DrawRuntime = (initialRemaining: number) => {
  const appId = "wx-runtime-r2-draw";
  const openId = "runtime-r2-draw-openid";
  const identitySecret = "runtime-r2-draw-secret";
  const accountId = "account-runtime-r2-draw";
  const recordId = "record_0123456789abcdef0123456789abcdef";
  const boardId = "board-runtime-r2-draw";
  const identityId = hashIdentity({ appId, openId, secret: identitySecret });
  const initialSnapshot = {
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
        remainingTickets: initialRemaining,
        isGrandPrize: true,
      },
    ],
  };
  const database = createDocumentDatabase({
    wechatIdentities: { [identityId]: { accountId } },
    accounts: { [accountId]: { status: "active" } },
    observationCandidates: {
      [recordId]: {
        ownerAccountId: accountId,
        recordId,
        boardId,
        sourcePath: "assisted-draw",
        initialSnapshot,
        finalSnapshot: initialSnapshot,
        currentVerificationVersion: 1,
        status: "private_saved",
      },
    },
  });
  const run = createRuntime({
    cloud: {
      DYNAMIC_CURRENT_ENV: "runtime-test",
      init: () => undefined,
      database: () => database,
      getWXContext: () => ({ APPID: appId, OPENID: openId }),
    },
    env: { IDENTITY_HMAC_KEY: identitySecret },
    now: () => Date.parse("2026-08-27T12:00:00.000Z"),
  });
  return { run, database, recordId, boardId };
};

describe("V1 CloudBase runtime envelope", () => {
  it("silently creates one idempotent account with server-owned default profile values", async () => {
    const appId = "wx-silent-bootstrap";
    const openId = "fresh-silent-openid";
    const identitySecret = "silent-bootstrap-secret";
    const identityId = hashIdentity({ appId, openId, secret: identitySecret });
    const database = createDocumentDatabase({});
    const run = createRuntime({
      cloud: {
        DYNAMIC_CURRENT_ENV: "runtime-test",
        init: () => undefined,
        database: () => database,
        getWXContext: () => ({ APPID: appId, OPENID: openId }),
      },
      env: { IDENTITY_HMAC_KEY: identitySecret },
      now: () => Date.parse("2026-08-29T01:00:00.000Z"),
    });

    const first = await run("bootstrap-account", {});
    const second = await run("bootstrap-account", {});
    expect(first).toMatchObject({
      ok: true,
      data: {
        nickname: "ICHI 玩家",
        profileState: "incomplete",
        created: true,
      },
    });
    expect(second).toMatchObject({
      ok: true,
      data: { nickname: "ICHI 玩家", created: false },
    });
    const identity = await database
      .collection("wechatIdentities")
      .doc(identityId)
      .get();
    const accountId = String(identity.data.accountId);
    await expect(
      database.collection("profiles").doc(accountId).get(),
    ).resolves.toMatchObject({
      data: { nickname: "ICHI 玩家", avatarFileId: null },
    });
  });

  it.each([
    {
      label: "nickname and avatar",
      stored: {
        nickname: "老玩家",
        avatarFileId: "cloud://test/profile-avatars/old.jpg",
      },
      expected: {
        nickname: "老玩家",
        avatarFileId: "cloud://test/profile-avatars/old.jpg",
      },
    },
    {
      label: "nickname only",
      stored: { nickname: "老玩家" },
      expected: { nickname: "老玩家" },
    },
    {
      label: "avatar only",
      stored: {
        nickname: "",
        avatarFileId: "cloud://test/profile-avatars/old.jpg",
      },
      expected: {
        nickname: "ICHI 玩家",
        avatarFileId: "cloud://test/profile-avatars/old.jpg",
      },
    },
    {
      label: "neither nickname nor avatar",
      stored: { nickname: null },
      expected: { nickname: "ICHI 玩家" },
    },
  ])(
    "preserves existing profile compatibility for $label",
    async ({ stored, expected }) => {
      const appId = "wx-existing-profile";
      const openId = `existing-${String(stored.nickname)}`;
      const secret = "existing-profile-secret";
      const accountId = "account-existing-profile";
      const identityId = hashIdentity({ appId, openId, secret });
      const database = createDocumentDatabase({
        wechatIdentities: { [identityId]: { accountId } },
        accounts: { [accountId]: { status: "active" } },
        profiles: {
          [accountId]: {
            canonicalIchiId: "ICHI-777",
            avatarState: stored.avatarFileId ? "wechat-authorized" : "default",
            profileState: "incomplete",
            ...stored,
          },
        },
      });
      const run = createRuntime({
        cloud: {
          DYNAMIC_CURRENT_ENV: "runtime-test",
          init: () => undefined,
          database: () => database,
          getWXContext: () => ({ APPID: appId, OPENID: openId }),
          getTempFileURL: async () => ({ fileList: [] }),
        },
        env: { IDENTITY_HMAC_KEY: secret },
      });

      await expect(run("get-my-profile", {})).resolves.toMatchObject({
        ok: true,
        data: expected,
      });
    },
  );

  it("removes server-owned document metadata before whole-document writes", () => {
    expect(
      stripDatabaseMetadata({
        _id: "server-owned-id",
        dateKey: "2026-08-19",
        reservations: {},
      }),
    ).toEqual({ dateKey: "2026-08-19", reservations: {} });
  });

  it("returns stable public error codes without stack or secrets", () => {
    const result = failure(
      new IchiError("QUOTA_EXHAUSTED", "secret message", { remaining: 0 }),
    );
    expect(result).toEqual({
      ok: false,
      error: { code: "QUOTA_EXHAUSTED", details: { remaining: 0 } },
    });
    expect(JSON.stringify(result)).not.toContain("secret message");
    expect(JSON.stringify(result)).not.toContain("stack");
  });

  it("keeps direct recognition counts independent, including explicit nulls", () => {
    expect(
      recognizedSnapshotSummary({
        draft: {
          ipName: "女神异闻录",
          themeName: "30周年",
          price: { amount: 58 },
          tiers: [
            {
              label: "H",
              totalTickets: 16,
              pastedTickets: null,
              remainingTickets: null,
              unknownTickets: 2,
              slotObservation: {
                totalSlots: 16,
                coveredSlots: 16,
                openSlots: 0,
                unknownSlots: 0,
              },
            },
          ],
        },
      }),
    ).toEqual({
      ip: "女神异闻录",
      theme: "30周年",
      pricePerDraw: 58,
      tiers: [
        {
          tierId: "H",
          total: 16,
          remaining: null,
          attached: null,
          unknown: 2,
        },
      ],
    });
  });

  it("runs timer maintenance with a fixed clock and an empty job queue", async () => {
    const get = async () => ({ data: [] });
    const database = {
      command: { lte: (value: string) => ({ $lte: value }) },
      collection: () => ({
        where: () => ({ limit: () => ({ get }) }),
      }),
    };
    const cloud = {
      DYNAMIC_CURRENT_ENV: "dynamic-current-env",
      init: () => undefined,
      database: () => database,
      getWXContext: () => ({}),
    };
    const run = createRuntime({
      cloud,
      now: () => Date.parse("2026-08-18T12:00:00.000Z"),
    });

    await expect(
      run("release-stuck-reservations", { Type: "Timer" }),
    ).resolves.toEqual({
      ok: true,
      data: {
        action: "release-stuck-reservations",
        generatedAt: "2026-08-18T12:00:00.000Z",
        status: "completed",
        processed: 0,
      },
    });
  });

  it("reconciles due storage cleanup jobs on the ten-minute maintenance path", async () => {
    const fileId = "cloud://test/recognition-temp/expired/ticket.jpg";
    const database = createDocumentDatabase({
      deletionJobs: {
        "storage-cleanup": {
          targetType: "storage-object",
          fileId,
          status: "pending",
          nextAttemptAt: "2026-08-18T11:59:00.000Z",
        },
      },
    });
    const deleteFile = vi.fn(async () => ({}));
    const run = createRuntime({
      cloud: {
        DYNAMIC_CURRENT_ENV: "runtime-test",
        init: () => undefined,
        database: () => ({
          ...database,
          command: {
            lte: (value: string) => ({ $lte: value }),
            in: (value: unknown[]) => ({ $in: value }),
            inc: (value: number) => ({ $inc: value }),
          },
        }),
        getWXContext: () => ({}),
        deleteFile,
      },
      now: () => Date.parse("2026-08-18T12:00:00.000Z"),
    });

    await expect(
      run("reconcile-stuck-jobs", { Type: "Timer" }),
    ).resolves.toMatchObject({
      ok: true,
      data: { status: "completed", processed: 1 },
    });
    expect(deleteFile).toHaveBeenCalledWith({ fileList: [fileId] });
    await expect(
      database.collection("deletionJobs").doc("storage-cleanup").get(),
    ).resolves.toMatchObject({
      data: { status: "completed", completedAt: "2026-08-18T12:00:00.000Z" },
    });
  });

  it("rejects direct maintenance calls when no development token is configured", async () => {
    const cloud = {
      DYNAMIC_CURRENT_ENV: "dynamic-current-env",
      init: () => undefined,
      database: () => ({ command: {} }),
      getWXContext: () => ({}),
    };
    const run = createRuntime({ cloud });

    await expect(run("retry-deletions", {})).resolves.toEqual({
      ok: false,
      error: { code: "MAINTENANCE_TRIGGER_REQUIRED" },
    });
  });

  it("updates authorized WeChat profile fields without changing account ownership", async () => {
    const appId = "wx-profile-test";
    const openId = "profile-openid";
    const identitySecret = "profile-identity-secret";
    const accountId = "account-profile-test";
    const identityId = hashIdentity({
      appId,
      openId,
      secret: identitySecret,
    });
    const database = createDocumentDatabase({
      wechatIdentities: { [identityId]: { accountId } },
      accounts: { [accountId]: { status: "active" } },
      profiles: {
        [accountId]: {
          canonicalIchiId: "ICHI-001",
          nickname: "ICHI 玩家",
          avatarState: "default",
          profileState: "incomplete",
        },
      },
    });
    let minted = 0;
    const deleteFile = vi.fn(async () => ({}));
    const textSafetyReviewer = vi.fn(
      async ({ content }: { readonly content: string }) => ({
        result: { suggest: content === "拒绝昵称" ? "risky" : "pass" },
      }),
    );
    const cloud = {
      DYNAMIC_CURRENT_ENV: "runtime-test",
      init: () => undefined,
      database: () => database,
      getWXContext: () => ({ APPID: appId, OPENID: openId }),
      deleteFile,
      getTempFileURL: async ({
        fileList,
      }: {
        readonly fileList: readonly { readonly fileID: string }[];
      }) => {
        minted += 1;
        return {
          fileList: [
            {
              fileID: fileList[0]?.fileID,
              tempFileURL: `https://avatar.example/${minted}.jpg`,
            },
          ],
        };
      },
    };
    const run = createRuntime({
      cloud,
      env: { IDENTITY_HMAC_KEY: identitySecret },
      textSafetyReviewer,
    });

    await expect(
      run("bind-wechat-profile", { nickname: "仅修改昵称" }),
    ).resolves.toMatchObject({
      ok: true,
      data: {
        nickname: "仅修改昵称",
        avatarState: "default",
        profileState: "complete",
      },
    });
    await expect(run("get-my-profile", {})).resolves.toMatchObject({
      ok: true,
      data: { nickname: "仅修改昵称", avatarState: "default" },
    });

    await expect(
      run("bind-wechat-profile", {
        nickname: "新玩家",
        avatarFileId:
          "cloud://cloud1-d7gxqfwv783a1f131/profile-avatars/avatar-1.jpg",
      }),
    ).resolves.toMatchObject({
      ok: true,
      data: {
        nickname: "新玩家",
        profileState: "complete",
        avatarFileId:
          "cloud://cloud1-d7gxqfwv783a1f131/profile-avatars/avatar-1.jpg",
        avatarUrl: "https://avatar.example/1.jpg",
      },
    });
    await expect(run("get-my-profile", {})).resolves.toMatchObject({
      ok: true,
      data: {
        nickname: "新玩家",
        avatarFileId:
          "cloud://cloud1-d7gxqfwv783a1f131/profile-avatars/avatar-1.jpg",
        avatarUrl: "https://avatar.example/2.jpg",
      },
    });
    await expect(
      run("bind-wechat-profile", {
        nickname: "更新后的玩家",
        avatarFileId:
          "cloud://cloud1-d7gxqfwv783a1f131/profile-avatars/avatar-2.jpg",
      }),
    ).resolves.toMatchObject({
      ok: true,
      data: {
        ichiId: "ICHI-001",
        nickname: "更新后的玩家",
        avatarFileId:
          "cloud://cloud1-d7gxqfwv783a1f131/profile-avatars/avatar-2.jpg",
        created: false,
        updated: true,
      },
    });
    expect(minted).toBe(3);
    expect(deleteFile).toHaveBeenCalledWith({
      fileList: [
        "cloud://cloud1-d7gxqfwv783a1f131/profile-avatars/avatar-1.jpg",
      ],
    });
    await expect(
      run("bind-wechat-profile", {
        nickname: "拒绝昵称",
        openid: "forged-client-openid",
        scene: 2,
        avatarFileId:
          "cloud://cloud1-d7gxqfwv783a1f131/profile-avatars/avatar-3.jpg",
      }),
    ).resolves.toEqual({
      ok: false,
      error: { code: "PROFILE_NICKNAME_REVIEW_FAILED" },
    });
    await expect(run("get-my-profile", {})).resolves.toMatchObject({
      ok: true,
      data: {
        nickname: "更新后的玩家",
        avatarFileId:
          "cloud://cloud1-d7gxqfwv783a1f131/profile-avatars/avatar-2.jpg",
      },
    });
    expect(textSafetyReviewer).toHaveBeenLastCalledWith({
      content: "拒绝昵称",
      version: 2,
      scene: 1,
      openid: openId,
    });
  });

  it("retries a replaced profile avatar cleanup without deleting the active avatar", async () => {
    const appId = "wx-profile-cleanup-test";
    const openId = "profile-cleanup-openid";
    const identitySecret = "profile-cleanup-identity-secret";
    const accountId = "account-profile-cleanup";
    const oldAvatar = "cloud://test/profile-avatars/old.jpg";
    const newAvatar = "cloud://test/profile-avatars/new.jpg";
    const identityId = hashIdentity({
      appId,
      openId,
      secret: identitySecret,
    });
    const database = createDocumentDatabase({
      wechatIdentities: { [identityId]: { accountId } },
      accounts: { [accountId]: { status: "active" } },
      profiles: {
        [accountId]: {
          canonicalIchiId: "ICHI-002",
          nickname: "旧昵称",
          avatarFileId: oldAvatar,
          avatarState: "wechat-authorized",
          profileState: "complete",
        },
      },
    });
    let failOldAvatarOnce = true;
    const deleteFile = vi.fn(
      async ({ fileList }: { readonly fileList: readonly string[] }) => {
        if (fileList[0] === oldAvatar && failOldAvatarOnce) {
          failOldAvatarOnce = false;
          throw new Error("temporary storage failure");
        }
        return {};
      },
    );
    const run = createRuntime({
      cloud: {
        DYNAMIC_CURRENT_ENV: "runtime-test",
        init: () => undefined,
        database: () => ({
          ...database,
          command: {
            lte: (value: string) => ({ $lte: value }),
            in: (value: unknown[]) => ({ $in: value }),
            inc: (value: number) => ({ $inc: value }),
          },
        }),
        getWXContext: () => ({ APPID: appId, OPENID: openId }),
        deleteFile,
        getTempFileURL: async () => ({ fileList: [] }),
      },
      env: { IDENTITY_HMAC_KEY: identitySecret },
      now: () => Date.parse("2026-08-28T01:00:00.000Z"),
      textSafetyReviewer: async () => ({ result: { suggest: "pass" } }),
    });

    await expect(
      run("bind-wechat-profile", {
        nickname: "新昵称",
        avatarFileId: newAvatar,
      }),
    ).resolves.toMatchObject({ ok: true });
    const cleanupId = `storage:${createHash("sha256")
      .update(oldAvatar)
      .digest("hex")
      .slice(0, 32)}`;
    await expect(
      database.collection("deletionJobs").doc(cleanupId).get(),
    ).resolves.toMatchObject({
      data: {
        targetType: "storage-object",
        fileId: oldAvatar,
        status: "pending",
      },
    });
    await expect(run("retry-deletions", { Type: "Timer" })).resolves.toEqual({
      ok: true,
      data: {
        status: "completed",
        action: "retry-deletions",
        processed: 1,
        failed: 0,
        generatedAt: "2026-08-28T01:00:00.000Z",
      },
    });
    expect(deleteFile).toHaveBeenLastCalledWith({ fileList: [oldAvatar] });
    expect(deleteFile).not.toHaveBeenCalledWith({ fileList: [newAvatar] });
  });

  it("deletes the durable profile avatar before completing account deletion", async () => {
    const appId = "wx-account-avatar-delete";
    const openId = "account-avatar-delete-openid";
    const secret = "account-avatar-delete-secret";
    const accountId = "account-avatar-delete";
    const avatarFileId = "cloud://test/profile-avatars/account-delete.jpg";
    const identityId = hashIdentity({ appId, openId, secret });
    const database = createDocumentDatabase({
      wechatIdentities: { [identityId]: { accountId } },
      accounts: { [accountId]: { status: "active" } },
      profiles: {
        [accountId]: {
          canonicalIchiId: "ICHI-003",
          nickname: "待删除玩家",
          avatarFileId,
          profileState: "complete",
        },
      },
      ichiIds: {
        "ICHI-003": { accountId, state: "active" },
      },
    });
    const deleteFile = vi.fn(async () => ({}));
    const run = createRuntime({
      cloud: {
        DYNAMIC_CURRENT_ENV: "runtime-test",
        init: () => undefined,
        database: () => ({
          ...database,
          command: {
            lte: (value: string) => ({ $lte: value }),
            in: (value: unknown[]) => ({ $in: value }),
            inc: (value: number) => ({ $inc: value }),
          },
        }),
        getWXContext: () => ({ APPID: appId, OPENID: openId }),
        deleteFile,
      },
      env: { IDENTITY_HMAC_KEY: secret },
      now: () => Date.parse("2026-08-28T02:00:00.000Z"),
    });

    await expect(run("delete-my-account", {})).resolves.toMatchObject({
      ok: true,
      data: { status: "pending" },
    });
    await expect(run("retry-deletions", { Type: "Timer" })).resolves.toEqual({
      ok: true,
      data: {
        status: "completed",
        action: "retry-deletions",
        processed: 1,
        failed: 0,
        generatedAt: "2026-08-28T02:00:00.000Z",
      },
    });
    expect(deleteFile).toHaveBeenCalledWith({ fileList: [avatarFileId] });
    await expect(
      database.collection("profiles").doc(accountId).get(),
    ).rejects.toThrow("not found");
    await expect(
      database.collection("accounts").doc(accountId).get(),
    ).rejects.toThrow("not found");
  });

  it("releases a recognized but uncommitted result without consuming quota", async () => {
    const appId = "wx-runtime-test";
    const openId = "runtime-release-openid";
    const identitySecret = "runtime-identity-secret";
    const accountId = "account-runtime-release";
    const jobId = "job-runtime-release";
    const jobToken = "runtime-release-job-token";
    const identityId = hashIdentity({ appId, openId, secret: identitySecret });
    const database = createDocumentDatabase({
      wechatIdentities: { [identityId]: { accountId } },
      accounts: { [accountId]: { status: "active" } },
      recognitionJobs: {
        [jobId]: {
          ownerAccountId: accountId,
          quotaId: "quota-runtime-release",
          keyHash: "key-runtime-release",
          status: "recognized",
          accessTokenHash: hashRecognitionJobToken(jobToken),
        },
      },
      dailyQuotas: {
        "quota-runtime-release": {
          limit: 5,
          used: 1,
          reservations: {
            "key-runtime-release": {
              status: "reserved",
              jobId,
            },
          },
        },
      },
    });
    const cloud = {
      DYNAMIC_CURRENT_ENV: "runtime-test",
      init: () => undefined,
      database: () => database,
      getWXContext: () => ({ APPID: appId, OPENID: openId }),
    };
    const run = createRuntime({
      cloud,
      env: { IDENTITY_HMAC_KEY: identitySecret },
      now: () => Date.parse("2026-08-21T12:00:00.000Z"),
    });

    await expect(
      run("release-recognition", { jobId, jobToken }),
    ).resolves.toMatchObject({
      ok: true,
      data: {
        jobId,
        status: "recognized_released",
        released: true,
        quota: { used: 1, reserved: 0, remaining: 4 },
      },
    });
    await expect(
      run("release-recognition", { jobId, jobToken }),
    ).resolves.toMatchObject({
      ok: true,
      data: { jobId, status: "recognized_released", released: false },
    });
  });

  it("rejects source swaps and keeps a successful finalization idempotent", async () => {
    const appId = "wx-runtime-test";
    const openId = "runtime-openid";
    const identitySecret = "runtime-identity-secret";
    const accountId = "account-runtime-test";
    const quotaId = `${accountId}:2026-08-21`;
    const identityId = hashIdentity({
      appId,
      openId,
      secret: identitySecret,
    });
    const database = createDocumentDatabase({
      wechatIdentities: {
        [identityId]: { accountId },
      },
      accounts: {
        [accountId]: { status: "active" },
      },
      recognitionJobs: {
        "job-source-check": {
          ownerAccountId: accountId,
          status: "recognized",
          sourcePath: "assisted-draw",
          quotaId,
          keyHash: "key-source-check",
          structuredResult: null,
        },
      },
      dailyQuotas: {
        [quotaId]: {
          accountId,
          dateKey: "2026-08-21",
          reservations: {
            "key-source-check": { status: "reserved" },
          },
          limit: 5,
          used: 0,
        },
      },
    });
    const cloud = {
      DYNAMIC_CURRENT_ENV: "runtime-test",
      init: () => undefined,
      database: () => database,
      getWXContext: () => ({ APPID: appId, OPENID: openId }),
    };
    const run = createRuntime({
      cloud,
      env: { IDENTITY_HMAC_KEY: identitySecret },
      now: () => Date.parse("2026-08-21T12:00:00.000Z"),
    });
    const snapshot = {
      schemaVersion: "board-snapshot-1.0.0",
      ip: "测试 IP",
      pricePerDraw: 10,
      currency: "CNY",
      totalTickets: 1,
      remainingTickets: 1,
      attachedTickets: 0,
      tiers: [
        {
          tierId: "A",
          sourceLabels: ["A"],
          total: 1,
          remaining: 1,
          attached: 0,
        },
      ],
      issues: [],
    };

    const event = {
      recognitionJobId: "job-source-check",
      sourcePath: "direct-upload",
      confirmedSnapshot: snapshot,
      location: {
        latitude: 31.23,
        longitude: 121.47,
        accuracy: 12,
        source: "camera",
        capturedAt: "2026-08-21T11:59:00.000Z",
        consentVersion: "v1-location",
      },
      locationNote: "测试地点",
      observedAt: "2026-08-21T11:59:00.000Z",
      promptVersion: "test-prompt",
      consentVersion: "v1-location",
      disclosureVersion: "v1-no-photo-retention",
    };

    await expect(run("finalize-board-observation", event)).resolves.toEqual({
      ok: false,
      error: { code: "RECOGNITION_JOB_INVALID" },
    });

    const matchingEvent = { ...event, sourcePath: "assisted-draw" };
    await expect(
      run("finalize-board-observation", matchingEvent),
    ).resolves.toMatchObject({
      ok: true,
      data: { status: "private_saved", idempotent: false },
    });
    await expect(run("get-quota-status", {})).resolves.toMatchObject({
      ok: true,
      data: { used: 1, reserved: 0, remaining: 4 },
    });
    await expect(
      run("finalize-board-observation", matchingEvent),
    ).resolves.toMatchObject({
      ok: true,
      data: { status: "private_saved", idempotent: true },
    });
    await expect(run("get-quota-status", {})).resolves.toMatchObject({
      ok: true,
      data: { used: 1, reserved: 0, remaining: 4 },
    });
  });

  it("persists an R2 board as queryable fields without T/P or provider raw", async () => {
    const appId = "wx-runtime-r2";
    const openId = "runtime-r2-openid";
    const identitySecret = "runtime-identity-secret";
    const accountId = "account-runtime-r2";
    const quotaId = `${accountId}:2026-08-27`;
    const jobId = "job-runtime-r2";
    const identityId = hashIdentity({ appId, openId, secret: identitySecret });
    const database = createDocumentDatabase({
      wechatIdentities: { [identityId]: { accountId } },
      accounts: { [accountId]: { status: "active" } },
      recognitionJobs: {
        [jobId]: {
          ownerAccountId: accountId,
          status: "recognized",
          sourcePath: "assisted-draw",
          quotaId,
          keyHash: "key-runtime-r2",
          structuredResult: {
            draft: {
              ipName: "世界之外",
              themeName: "此间即无间",
              tiers: [
                {
                  label: "A",
                  totalTickets: null,
                  pastedTickets: null,
                  remainingTickets: 2,
                },
              ],
              visibleNumberRuns: [{ rawText: "2" }],
            },
          },
        },
      },
      dailyQuotas: {
        [quotaId]: {
          accountId,
          dateKey: "2026-08-27",
          reservations: {
            "key-runtime-r2": { status: "reserved" },
          },
          limit: 5,
          used: 0,
        },
      },
    });
    const cloud = {
      DYNAMIC_CURRENT_ENV: "runtime-test",
      init: () => undefined,
      database: () => database,
      getWXContext: () => ({ APPID: appId, OPENID: openId }),
    };
    const run = createRuntime({
      cloud,
      env: { IDENTITY_HMAC_KEY: identitySecret },
      now: () => Date.parse("2026-08-27T12:00:00.000Z"),
    });
    const result = await run("finalize-board-observation", {
      recognitionJobId: jobId,
      sourcePath: "assisted-draw",
      confirmedSnapshot: {
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
            remainingTickets: 2,
            isGrandPrize: false,
          },
          {
            tierCode: "SP1",
            rawLabel: "SP賞",
            remainingTickets: 0,
            isGrandPrize: true,
          },
        ],
      },
      location: {
        latitude: 31.23,
        longitude: 121.47,
        accuracy: 12,
        source: "camera",
        capturedAt: "2026-08-27T11:59:00.000Z",
        consentVersion: "v1-location",
      },
      observedAt: "2026-08-27T11:59:00.000Z",
      promptVersion: "ichi-board-vlm-r2-direct-remaining-1.0.0",
      consentVersion: "v1-location",
      disclosureVersion: "v1-no-photo-retention",
    });

    expect(result).toMatchObject({
      ok: true,
      data: { status: "private_saved" },
    });
    const recordId = (result as { data: { recordId: string } }).data.recordId;
    const record = (
      await database.collection("observationCandidates").doc(recordId).get()
    ).data;
    expect(record).toMatchObject({
      schemaVersion: "board-record-r2-1.0.0",
      recognitionVersion: "R2",
      ipName: "世界之外",
      themeName: "此间即无间",
      pricePerDraw: 65,
      tiers: [
        { tierCode: "A", remainingTickets: 2, isGrandPrize: false },
        { tierCode: "SP1", remainingTickets: 0, isGrandPrize: true },
      ],
      location: { latitude: 31.23, longitude: 121.47 },
    });
    expect(JSON.stringify(record)).not.toMatch(
      /totalTickets|pastedTickets|visibleNumberRuns|recognizedStructuredResult/u,
    );
  });

  it("never recreates a publication after an explicit deletion tombstone", async () => {
    const appId = "wx-observation-recovery";
    const ownerOpenId = "observation-owner";
    const otherOpenId = "observation-other";
    const secret = "observation-recovery-secret";
    const ownerId = "account-observation-owner";
    const otherId = "account-observation-other";
    const oldRecordId = "record_0123456789abcdef0123456789abcdef";
    const boardId = "board-stable-origin";
    const jobId = "job-observation-origin";
    const quotaId = `${ownerId}:2026-08-28`;
    const previouslyDeletedFreshRecordId = `record_${createHash("sha256")
      .update(`${ownerId}:${oldRecordId}:${boardId}:next-upload-observation`)
      .digest("hex")
      .slice(0, 32)}`;
    const ownerIdentity = hashIdentity({ appId, openId: ownerOpenId, secret });
    const otherIdentity = hashIdentity({ appId, openId: otherOpenId, secret });
    const snapshot = {
      schemaVersion: "board-record-r2-1.0.0",
      recognitionVersion: "R2",
      ipName: "世界之外",
      pricePerDraw: 65,
      currency: "CNY",
      tiers: [
        {
          tierCode: "A",
          rawLabel: "A賞",
          remainingTickets: 3,
          isGrandPrize: true,
        },
      ],
    };
    const database = createDocumentDatabase({
      wechatIdentities: {
        [ownerIdentity]: { accountId: ownerId },
        [otherIdentity]: { accountId: otherId },
      },
      accounts: {
        [ownerId]: { status: "active" },
        [otherId]: { status: "active" },
      },
      recognitionJobs: {
        [jobId]: {
          ownerAccountId: ownerId,
          status: "committed",
          sourcePath: "assisted-draw",
          recordId: oldRecordId,
          quotaId,
          keyHash: "origin-key",
        },
      },
      dailyQuotas: {
        [quotaId]: {
          accountId: ownerId,
          used: 1,
          reservations: { "origin-key": { status: "committed" } },
        },
      },
      deletionJobs: {
        [`record:${oldRecordId}`]: {
          ownerAccountId: ownerId,
          targetType: "record",
          targetId: oldRecordId,
          boardId,
          status: "completed",
        },
        [`record:${previouslyDeletedFreshRecordId}`]: {
          ownerAccountId: ownerId,
          targetType: "record",
          targetId: previouslyDeletedFreshRecordId,
          boardId,
          status: "completed",
        },
      },
      observationCandidates: {
        record_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa: {
          ownerAccountId: otherId,
          recordId: "record_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          recordCode: "SAME12",
          boardId: "board-unrelated",
          sourcePath: "assisted-draw",
          status: "private_saved",
        },
      },
      recordCodes: {
        SAME12: {
          recordId: "record_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          ownerAccountId: otherId,
          state: "active",
        },
      },
    });
    let activeOpenId = ownerOpenId;
    const run = createRuntime({
      cloud: {
        DYNAMIC_CURRENT_ENV: "runtime-test",
        init: () => undefined,
        database: () => database,
        getWXContext: () => ({ APPID: appId, OPENID: activeOpenId }),
      },
      env: { IDENTITY_HMAC_KEY: secret },
      now: () => Date.parse("2026-08-28T12:00:00.000Z"),
    });
    const event = {
      action: "prepare-new-upload",
      currentRecordId: oldRecordId,
      recognitionJobId: jobId,
      boardId,
      sourcePath: "assisted-draw",
      confirmedSnapshot: snapshot,
      location: {
        latitude: 31.23,
        longitude: 121.47,
        accuracy: 12,
        source: "camera",
        capturedAt: "2026-08-28T11:59:00.000Z",
        consentVersion: "v1-location",
      },
      observedAt: "2026-08-28T11:59:00.000Z",
      promptVersion: "ichi-board-vlm-r2-direct-remaining-1.0.0",
      consentVersion: "v1-location",
      disclosureVersion: "v1-no-photo-retention",
    };

    await expect(run("finalize-board-observation", event)).resolves.toEqual({
      ok: false,
      error: { code: "RECORD_DELETED" },
    });
    expect(
      (await database.collection("dailyQuotas").doc(quotaId).get()).data.used,
    ).toBe(1);
    await expect(
      database.collection("observationCandidates").doc(oldRecordId).get(),
    ).rejects.toThrow("not found");
    await expect(
      database
        .collection("observationCandidates")
        .doc(previouslyDeletedFreshRecordId)
        .get(),
    ).rejects.toThrow("not found");
    await expect(
      database
        .collection("observationCandidates")
        .doc("record_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
        .get(),
    ).resolves.toMatchObject({
      data: {
        ownerAccountId: otherId,
        recordCode: "SAME12",
        boardId: "board-unrelated",
      },
    });

    activeOpenId = otherOpenId;
    await expect(run("finalize-board-observation", event)).resolves.toEqual({
      ok: false,
      error: { code: "RECORD_NOT_FOUND" },
    });
  });

  it("keeps the current publication unchanged before asynchronous ticket verification", async () => {
    const appId = "wx-runtime-test";
    const openId = "runtime-ticket-openid";
    const identitySecret = "runtime-identity-secret";
    const accountId = "account-ticket-test";
    const identityId = hashIdentity({
      appId,
      openId,
      secret: identitySecret,
    });
    const initialSnapshot = {
      schemaVersion: "board-snapshot-1.0.0",
      ip: "测试 IP",
      pricePerDraw: 10,
      currency: "CNY",
      totalTickets: 3,
      remainingTickets: 3,
      attachedTickets: 0,
      tiers: [
        {
          tierId: "A",
          sourceLabels: ["A"],
          total: 2,
          remaining: 2,
          attached: 0,
        },
        {
          tierId: "B",
          sourceLabels: ["B"],
          total: 1,
          remaining: 1,
          attached: 0,
        },
      ],
      issues: [],
    };
    const database = createDocumentDatabase({
      wechatIdentities: { [identityId]: { accountId } },
      accounts: { [accountId]: { status: "active" } },
      observationCandidates: {
        record_0123456789abcdef0123456789abcdef: {
          ownerAccountId: accountId,
          recordId: "record_0123456789abcdef0123456789abcdef",
          boardId: "board-ticket-test",
          sourcePath: "assisted-draw",
          initialSnapshot,
          status: "private_saved",
          currentVerificationVersion: 1,
        },
      },
    });
    const run = createRuntime({
      cloud: {
        DYNAMIC_CURRENT_ENV: "runtime-test",
        init: () => undefined,
        database: () => database,
        getWXContext: () => ({ APPID: appId, OPENID: openId }),
      },
      env: { IDENTITY_HMAC_KEY: identitySecret },
      now: () => Date.parse("2026-08-25T12:00:00.000Z"),
    });

    await expect(
      run("finalize-draw-update", {
        recordId: "record_0123456789abcdef0123456789abcdef",
        boardId: "board-ticket-test",
        submissionVersion: 1,
        preparePrizeTicketVerification: true,
        authoritativeDrawEvents: [
          { eventId: "draw-1", tierCode: "A", occurredAt: 1 },
          { eventId: "draw-2", tierCode: "B", occurredAt: 2 },
        ],
      }),
    ).resolves.toMatchObject({
      ok: true,
      data: {
        status: "verification_prepared",
        authoritativeDrawCount: 2,
      },
    });
    await expect(
      database
        .collection("observationCandidates")
        .doc("record_0123456789abcdef0123456789abcdef")
        .get(),
    ).resolves.toMatchObject({
      data: {
        initialSnapshot,
        status: "private_saved",
      },
    });
    const unchanged = (
      await database
        .collection("observationCandidates")
        .doc("record_0123456789abcdef0123456789abcdef")
        .get()
    ).data;
    expect(unchanged.authoritativeDrawEvents).toBeUndefined();
    expect(unchanged.authoritativeDrawSubmissionVersion).toBeUndefined();
    expect(unchanged.finalSnapshot).toBeUndefined();
  });

  it("projects the published submission while exposing a newer failed attempt status", async () => {
    const appId = "wx-runtime-publication-test";
    const openId = "runtime-publication-openid";
    const identitySecret = "runtime-publication-secret";
    const accountId = "account-runtime-publication";
    const recordId = "record_0123456789abcdef0123456789abcdef";
    const boardId = "board-runtime-publication";
    const identityId = hashIdentity({
      appId,
      openId,
      secret: identitySecret,
    });
    const initialSnapshot = {
      schemaVersion: "board-record-r2-1.0.0",
      recognitionVersion: "R2",
      ipName: "测试 IP",
      themeName: "测试主题",
      pricePerDraw: 65,
      currency: "CNY",
      tiers: [{ tierCode: "A", remainingTickets: 2, isGrandPrize: true }],
    };
    const publishedSnapshot = {
      ...initialSnapshot,
      tiers: [{ tierCode: "A", remainingTickets: 1, isGrandPrize: true }],
    };
    const database = createDocumentDatabase({
      wechatIdentities: { [identityId]: { accountId } },
      accounts: { [accountId]: { status: "active" } },
      observationCandidates: {
        [recordId]: {
          ownerAccountId: accountId,
          recordId,
          recordCode: "ABC123",
          boardId,
          sourcePath: "assisted-draw",
          initialSnapshot,
          publishedSubmissionVersion: 1,
          publicationState: "current",
          status: "uploaded",
        },
      },
      drawSubmissions: {
        [`prize-ticket:${recordId}:${boardId}:2`]: {
          verificationId: `prize-ticket:${recordId}:${boardId}:2`,
          ownerAccountId: accountId,
          recordId,
          boardId,
          submissionVersion: 2,
          status: "PROVIDER_FAILED",
          finalSnapshot: initialSnapshot,
          createdAt: "2026-08-28T12:02:00.000Z",
        },
        [`prize-ticket:${recordId}:${boardId}:1`]: {
          verificationId: `prize-ticket:${recordId}:${boardId}:1`,
          ownerAccountId: accountId,
          recordId,
          boardId,
          submissionVersion: 1,
          status: "APPROVED",
          finalSnapshot: publishedSnapshot,
          authoritativeDrawEvents: [{ eventId: "draw-1", tierCode: "A" }],
          userNote: "已批准备注",
          ticketLocation: { latitude: 31.23, longitude: 121.47 },
          createdAt: "2026-08-28T12:01:00.000Z",
        },
      },
    });
    const run = createRuntime({
      cloud: {
        DYNAMIC_CURRENT_ENV: "runtime-test",
        init: () => undefined,
        database: () => database,
        getWXContext: () => ({ APPID: appId, OPENID: openId }),
      },
      env: { IDENTITY_HMAC_KEY: identitySecret },
    });

    await expect(run("get-my-records", {})).resolves.toMatchObject({
      ok: true,
      data: {
        records: [
          {
            recordId,
            finalSnapshot: publishedSnapshot,
            userNote: "已批准备注",
            latestPrizeTicketSubmission: {
              submissionVersion: 2,
              status: "PROVIDER_FAILED",
            },
          },
        ],
      },
    });
  });

  it("keeps the R2 baseline immutable and derives current remaining from the event batch", async () => {
    const { run, database, recordId, boardId } = createR2DrawRuntime(5);
    const request = {
      recordId,
      boardId,
      submissionVersion: 1,
      preparePrizeTicketVerification: true,
      authoritativeDrawEvents: [
        { eventId: "draw-1", tierCode: "A", occurredAt: 1 },
        { eventId: "draw-2", tierCode: "A", occurredAt: 2 },
      ],
    };

    await expect(run("finalize-draw-update", request)).resolves.toMatchObject({
      ok: true,
      data: { authoritativeDrawCount: 2, idempotent: false },
    });
    await expect(run("finalize-draw-update", request)).resolves.toMatchObject({
      ok: true,
      data: { authoritativeDrawCount: 2, idempotent: false },
    });
    const record = (
      await database.collection("observationCandidates").doc(recordId).get()
    ).data;
    expect(record).toMatchObject({
      initialSnapshot: { tiers: [{ remainingTickets: 5 }] },
    });
    expect(record.finalSnapshot).toEqual(record.initialSnapshot);
    expect(record.authoritativeDrawEvents).toBeUndefined();
  });

  it("validates competing prepare batches without mutating the R2 publication", async () => {
    const { run, database, recordId, boardId } = createR2DrawRuntime(1);
    const base = {
      recordId,
      boardId,
      submissionVersion: 1,
      preparePrizeTicketVerification: true,
    };
    const results = await Promise.all([
      run("finalize-draw-update", {
        ...base,
        authoritativeDrawEvents: [{ eventId: "draw-a", tierCode: "A" }],
      }),
      run("finalize-draw-update", {
        ...base,
        authoritativeDrawEvents: [{ eventId: "draw-b", tierCode: "A" }],
      }),
    ]);

    expect(
      results.every((result: unknown) => (result as { ok: boolean }).ok),
    ).toBe(true);
    const record = (
      await database.collection("observationCandidates").doc(recordId).get()
    ).data;
    expect(record).toMatchObject({
      initialSnapshot: { tiers: [{ remainingTickets: 1 }] },
    });
    expect(record.finalSnapshot).toEqual(record.initialSnapshot);
  });

  it("rejects an authoritative R2 event batch that exceeds the initial tier baseline", async () => {
    const { run, database, recordId, boardId } = createR2DrawRuntime(1);
    await expect(
      run("finalize-draw-update", {
        recordId,
        boardId,
        submissionVersion: 1,
        preparePrizeTicketVerification: true,
        authoritativeDrawEvents: [
          { eventId: "draw-a", tierCode: "A" },
          { eventId: "draw-b", tierCode: "A" },
        ],
      }),
    ).resolves.toMatchObject({ ok: false });
    const record = (
      await database.collection("observationCandidates").doc(recordId).get()
    ).data;
    expect(record.authoritativeDrawEvents).toBeUndefined();
    expect(record.initialSnapshot).toMatchObject({
      tiers: [{ remainingTickets: 1 }],
    });
  });

  it("authoritatively hides an owned uploaded record, preserves draw history, and cleans only prize-ticket evidence", async () => {
    const appId = "wx-delete-test";
    const ownerOpenId = "delete-owner";
    const otherOpenId = "delete-other";
    const secret = "delete-secret";
    const ownerId = "account-delete-owner";
    const otherId = "account-delete-other";
    const ownerIdentity = hashIdentity({ appId, openId: ownerOpenId, secret });
    const otherIdentity = hashIdentity({ appId, openId: otherOpenId, secret });
    const recordId = "record_0123456789abcdef0123456789abcdef";
    const boardId = "board-delete-test";
    const verificationId = `prize-ticket:${recordId}:${boardId}:1`;
    const database = createDocumentDatabase({
      wechatIdentities: {
        [ownerIdentity]: { accountId: ownerId },
        [otherIdentity]: { accountId: otherId },
      },
      accounts: {
        [ownerId]: { status: "active" },
        [otherId]: { status: "active" },
      },
      observationCandidates: {
        [recordId]: {
          ownerAccountId: ownerId,
          recordId,
          boardId,
          status: "uploaded",
          originalEvidenceFileId: "cloud://private/v1.jpg",
        },
      },
      drawSubmissions: {
        [verificationId]: {
          verificationId,
          recordId,
          boardId,
          ownerAccountId: ownerId,
          imageFileId: "cloud://private/v1.jpg",
          originalEvidenceFileId: "cloud://private/v1.jpg",
        },
        [`${recordId}:1`]: {
          recordId,
          ownerAccountId: ownerId,
          status: "confirmed",
          resolvedDrawCountsByTier: { A: 1 },
        },
      },
    });
    const deletedFileLists: string[][] = [];
    let activeOpenId = ownerOpenId;
    const run = createRuntime({
      cloud: {
        DYNAMIC_CURRENT_ENV: "runtime-test",
        init: () => undefined,
        database: () => ({
          ...database,
          command: {
            lte: (value: string) => ({ $lte: value }),
            in: (value: unknown[]) => ({ $in: value }),
          },
        }),
        getWXContext: () => ({ APPID: appId, OPENID: activeOpenId }),
        deleteFile: async ({ fileList }: { fileList: string[] }) => {
          deletedFileLists.push(fileList);
        },
      },
      env: {
        IDENTITY_HMAC_KEY: secret,
        DEVELOPMENT_MAINTENANCE_TOKEN: "delete-maintenance-token",
      },
      now: () => Date.parse("2026-08-25T12:00:00.000Z"),
    });

    await expect(
      run("delete-my-record", { recordId, boardId }),
    ).resolves.toMatchObject({
      ok: true,
      data: { status: "pending", idempotent: false },
    });
    const hiddenRecords = await run("get-my-records", {});
    expect(hiddenRecords).toMatchObject({
      ok: true,
      data: { records: [] },
    });
    activeOpenId = otherOpenId;
    await expect(
      run("delete-my-record", { recordId, boardId }),
    ).resolves.toEqual({
      ok: false,
      error: { code: "FORBIDDEN" },
    });
    activeOpenId = ownerOpenId;
    await expect(
      run("retry-deletions", {
        type: "timer",
        __developmentMaintenanceToken: "delete-maintenance-token",
      }),
    ).resolves.toMatchObject({ ok: true, data: { processed: 1, failed: 0 } });
    await expect(
      database.collection("observationCandidates").doc(recordId).get(),
    ).rejects.toThrow("not found");
    await expect(
      database.collection("drawSubmissions").doc(verificationId).get(),
    ).rejects.toThrow("not found");
    await expect(
      database.collection("drawSubmissions").doc(`${recordId}:1`).get(),
    ).resolves.toMatchObject({ data: { resolvedDrawCountsByTier: { A: 1 } } });
    expect(deletedFileLists).toEqual([["cloud://private/v1.jpg"]]);
    await expect(
      run("delete-my-record", { recordId, boardId }),
    ).resolves.toMatchObject({
      ok: true,
      data: { idempotent: true },
    });
  });

  it("treats missing evidence as deleted and keeps only a partial cleanup failure retryable", async () => {
    const completedRecordId = "record_missing_evidence";
    const retryRecordId = "record_retry_evidence";
    const completedBoardId = "board-missing-evidence";
    const retryBoardId = "board-retry-evidence";
    const ownerAccountId = "account-delete-owner";
    const completedVerificationId = `prize-ticket:${completedRecordId}:${completedBoardId}:1`;
    const retryVerificationId = `prize-ticket:${retryRecordId}:${retryBoardId}:1`;
    const database = createDocumentDatabase({
      observationCandidates: {
        [completedRecordId]: {
          ownerAccountId,
          recordId: completedRecordId,
          boardId: completedBoardId,
          originalEvidenceFileId: "cloud://private/already-missing.jpg",
        },
        [retryRecordId]: {
          ownerAccountId,
          recordId: retryRecordId,
          boardId: retryBoardId,
          originalEvidenceFileId: "cloud://private/transient-failure.jpg",
        },
      },
      drawSubmissions: {
        [completedVerificationId]: {
          verificationId: completedVerificationId,
          recordId: completedRecordId,
          boardId: completedBoardId,
          ownerAccountId,
          imageFileId: "cloud://private/already-missing.jpg",
        },
        [retryVerificationId]: {
          verificationId: retryVerificationId,
          recordId: retryRecordId,
          boardId: retryBoardId,
          ownerAccountId,
          imageFileId: "cloud://private/transient-failure.jpg",
        },
        unrelated: {
          verificationId: "prize-ticket:record_other:board-other:1",
          recordId: "record_other",
          boardId: "board-other",
          ownerAccountId: "account-other",
          imageFileId: "cloud://private/unrelated.jpg",
        },
      },
      deletionJobs: {
        "record:missing": {
          ownerAccountId,
          targetType: "record",
          targetId: completedRecordId,
          boardId: completedBoardId,
          status: "pending",
          nextAttemptAt: "2026-08-25T11:00:00.000Z",
          attempts: 0,
        },
        "record:retry": {
          ownerAccountId,
          targetType: "record",
          targetId: retryRecordId,
          boardId: retryBoardId,
          status: "pending",
          nextAttemptAt: "2026-08-25T11:00:00.000Z",
          attempts: 0,
        },
      },
    });
    const run = createRuntime({
      cloud: {
        DYNAMIC_CURRENT_ENV: "runtime-test",
        init: () => undefined,
        database: () => ({
          ...database,
          command: {
            lte: (value: string) => ({ $lte: value }),
            in: (value: unknown[]) => ({ $in: value }),
            inc: (value: number) => ({ $inc: value }),
          },
        }),
        getWXContext: () => ({}),
        deleteFile: async ({ fileList }: { fileList: string[] }) => {
          if (fileList.includes("cloud://private/transient-failure.jpg"))
            throw new Error("temporary storage failure");
          return {
            fileList: fileList.map((fileID) => ({
              fileID,
              status: "not_found",
            })),
          };
        },
      },
      now: () => Date.parse("2026-08-25T12:00:00.000Z"),
    });

    await expect(run("retry-deletions", { Type: "Timer" })).resolves.toEqual({
      ok: true,
      data: {
        status: "completed",
        action: "retry-deletions",
        processed: 1,
        failed: 1,
        generatedAt: "2026-08-25T12:00:00.000Z",
      },
    });
    await expect(
      database.collection("observationCandidates").doc(completedRecordId).get(),
    ).rejects.toThrow("not found");
    await expect(
      database.collection("drawSubmissions").doc(completedVerificationId).get(),
    ).rejects.toThrow("not found");
    await expect(
      database.collection("observationCandidates").doc(retryRecordId).get(),
    ).resolves.toMatchObject({ data: { ownerAccountId } });
    await expect(
      database.collection("deletionJobs").doc("record:retry").get(),
    ).resolves.toMatchObject({
      data: {
        status: "retry",
        nextAttemptAt: "2026-08-25T13:00:00.000Z",
      },
    });
    await expect(
      database.collection("drawSubmissions").doc("unrelated").get(),
    ).resolves.toMatchObject({
      data: { ownerAccountId: "account-other" },
    });
  });
});
