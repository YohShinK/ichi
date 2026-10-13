import { describe, it, expect, vi } from "vitest";
import { setup, NOW } from "./fixtures.test-support.mjs";
import { hash } from "../shared/security.mjs";
import { loadSource, normalizeSource } from "./source.mjs";
import {
  prepareSourceMetadata,
  profileCacheId,
  noteCacheId,
  profileVersion,
  cleanupAccountMetadata,
} from "./metadata.mjs";
import notes from "../../../../../services/cloudbase/shared/map-note-metadata.js";
import producer from "../../../../../services/cloudbase/shared/source-bridge-producer.js";
const accepted = (s) => {
  Object.assign(s.policy.terms, {
    uploadSharingScope: "UPLOADED_V1_RECORDS",
    rightsAttestationIncluded: true,
  });
  Object.assign(
    s
      .table("mapContributionConsents")
      .get(hash("consent", "account_a", s.policy.terms.version)),
    {
      uploadSharingScope: "UPLOADED_V1_RECORDS",
      rightsAttested: true,
      acceptedAt: new Date(NOW - 5000).toISOString(),
    },
  );
};
const profile = (s) => {
  const p = {
    accountId: "account_a",
    nickname: "001",
    profileState: "complete",
    avatarState: "wechat-authorized",
    updatedAt: new Date(NOW - 5000).toISOString(),
    avatarFileId: "cloud://private/profile-avatars/owner.jpeg",
  };
  s.table("profiles").set("account_a", p);
  return p;
};
describe("trusted V1 map metadata", () => {
  it("projects the current owner nickname and version bound public avatar, never the private reference", async () => {
    const s = setup(),
      id = s.record(),
      p = profile(s);
    s.table("mapSourceBridgeState").set(profileCacheId("account_a"), {
      ownerDigest: hash("account_a"),
      profileVersion: profileVersion(p),
      avatar: {
        kind: "PUBLIC_URL",
        url: "https://safe.example/public-map-avatars/opaque.jpg",
      },
    });
    const v = normalizeSource(await loadSource(s.db, id), NOW);
    expect(v.contributor).toEqual({
      displayName: "001",
      avatar: {
        kind: "PUBLIC_URL",
        url: "https://safe.example/public-map-avatars/opaque.jpg",
      },
    });
    expect(v.uploadedAt).toBe(
      s.table("observationCandidates").get(id).serverReceivedAt,
    );
    expect(JSON.stringify(v)).not.toContain("profile-avatars");
    p.nickname = "002";
    expect(
      normalizeSource(await loadSource(s.db, id), NOW).contributor.avatar.kind,
    ).toBe("FALLBACK_ASSET");
    p.accountId = "account_b";
    expect(
      normalizeSource(await loadSource(s.db, id), NOW).contributor,
    ).toBeNull();
  });
  it("only exposes an exact NOTE_PASSED hash and uses actual owner text review for legacy notes", async () => {
    const s = setup(),
      id = s.record(),
      r = s.table("observationCandidates").get(id);
    accepted(s);
    r.locationNote = "现场说明";
    s.table("wechatIdentities").set("owner", {
      accountId: "account_a",
      openId: "server-private-openid",
    });
    const review = vi.fn(async () => ({ result: { suggest: "pass" } }));
    s.cloud.openapi = { security: { msgSecCheck: review } };
    await notes.syncOwnedMapNotes({
      db: s.db,
      cloud: s.cloud,
      env: s.env,
      accountId: "account_a",
      openId: "server-private-openid",
      nowMs: NOW,
    });
    expect(review).toHaveBeenCalledWith({
      content: "现场说明",
      version: 2,
      scene: 2,
      openid: "server-private-openid",
    });
    expect(normalizeSource(await loadSource(s.db, id), NOW).note.text).toBe(
      "现场说明",
    );
    r.locationNote = "changed";
    expect(
      normalizeSource(await loadSource(s.db, id), NOW).note.text,
    ).toBeNull();
    expect(
      JSON.stringify(s.table("mapSourceBridgeState").get(noteCacheId(id))),
    ).not.toContain("现场说明");
  });
  it("a failed moderation check never fabricates PASS or blocks the board", async () => {
    const s = setup(),
      id = s.record();
    accepted(s);
    s.table("observationCandidates").get(id).locationNote = "bad";
    s.table("wechatIdentities").set("owner", {
      accountId: "account_a",
      openId: "server-openid",
    });
    s.cloud.openapi = {
      security: { msgSecCheck: async () => ({ result: { suggest: "risky" } }) },
    };
    await notes.syncOwnedMapNotes({
      db: s.db,
      cloud: s.cloud,
      env: s.env,
      accountId: "account_a",
      openId: "server-openid",
      nowMs: NOW,
    });
    const n = normalizeSource(await loadSource(s.db, id), NOW);
    expect(n.ok).toBe(true);
    expect(n.note.text).toBeNull();
    expect(s.table("mapSourceBridgeState").get(noteCacheId(id)).status).toBe(
      "NOTE_REJECTED",
    );
  });
  it("unaccepted or deleted accounts never publish avatar or audit text", async () => {
    const s = setup(),
      id = s.record();
    profile(s);
    s.cloud.downloadFile = vi.fn();
    s.table("observationCandidates").get(id).locationNote = "text";
    await prepareSourceMetadata({
      db: s.db,
      cloud: s.cloud,
      env: s.env,
      recordId: id,
      policy: s.policy,
      nowMs: NOW,
    });
    expect(s.cloud.downloadFile).not.toHaveBeenCalled();
    accepted(s);
    s.table("accounts").get("account_a").status = "deleting";
    await prepareSourceMetadata({
      db: s.db,
      cloud: s.cloud,
      env: s.env,
      recordId: id,
      policy: s.policy,
      nowMs: NOW,
    });
    expect(s.cloud.downloadFile).not.toHaveBeenCalled();
  });
  it("profile changes wake existing/current uploads only after the actual current scope acceptance", async () => {
    const s = setup();
    expect(
      (
        await producer.enqueueProfileChange({
          tx: s.db,
          env: s.env,
          ownerAccountId: "account_a",
          nowMs: NOW,
        })
      ).enabled,
    ).toBe(false);
    accepted(s);
    const r = await producer.enqueueProfileChange({
      tx: s.db,
      env: s.env,
      ownerAccountId: "account_a",
      nowMs: NOW,
    });
    expect(s.table("mapSourceOutbox").get(r.eventId)).toMatchObject({
      kind: "CONSENT_EVENT",
      status: "PENDING",
      cursor: "",
    });
    expect(s.table("mapContributionConsents").size).toBe(2);
  });
  it("account cleanup deletes only public copy references and retains retries on failure", async () => {
    const s = setup();
    s.table("mapSourceBridgeState").set(profileCacheId("account_a"), {
      assetFileId: "cloud://bucket/public-map-avatars/a.jpg",
      obsoleteFileIds: [
        "cloud://bucket/public-map-avatars/b.jpg",
        "cloud://private/profile-avatars/private.jpg",
      ],
    });
    s.cloud.deleteFile = vi.fn(async () => ({ fileList: [{ status: 1 }] }));
    await expect(
      cleanupAccountMetadata({ db: s.db, cloud: s.cloud, owner: "account_a" }),
    ).rejects.toThrow("AVATAR_CLEANUP_FAILED");
    expect(s.cloud.deleteFile).toHaveBeenCalledWith({
      fileList: [
        "cloud://bucket/public-map-avatars/a.jpg",
        "cloud://bucket/public-map-avatars/b.jpg",
      ],
    });
    s.cloud.deleteFile.mockResolvedValue({ fileList: [{ status: 0 }] });
    await cleanupAccountMetadata({
      db: s.db,
      cloud: s.cloud,
      owner: "account_a",
    });
    expect(
      s.table("mapSourceBridgeState").get(profileCacheId("account_a")).deleted,
    ).toBe(true);
  });
});

describe("optional avatar failure and concurrent own auditing", () => {
  it("keeps an otherwise eligible board publishable during avatar storage failure", async () => {
    const s = setup(),
      id = s.record();
    accepted(s);
    profile(s);
    s.env.ICHI_V2_PUBLIC_AVATAR_BUCKET = "test-bucket";
    s.env.ICHI_V2_PUBLIC_AVATAR_REGION = "ap-shanghai";
    s.policy.publicAvatarOrigins = [
      "https://test-bucket.cos.ap-shanghai.myqcloud.com",
    ];
    s.cloud.downloadFile = vi.fn(async () => {
      throw new Error("storage unavailable");
    });
    await expect(
      prepareSourceMetadata({
        db: s.db,
        cloud: s.cloud,
        env: s.env,
        recordId: id,
        policy: s.policy,
        nowMs: NOW,
      }),
    ).resolves.toBeUndefined();
    const n = normalizeSource(await loadSource(s.db, id), NOW);
    expect(n.ok).toBe(true);
    expect(n.contributor.avatar.kind).toBe("FALLBACK_ASSET");
  });
  it("registers one durable source change for concurrent audits of the same exact text", async () => {
    const s = setup(),
      id = s.record();
    accepted(s);
    s.table("observationCandidates").get(id).locationNote = "现场说明";
    s.cloud.openapi = {
      security: { msgSecCheck: async () => ({ result: { suggest: "pass" } }) },
    };
    const params = {
      db: s.db,
      cloud: s.cloud,
      env: s.env,
      accountId: "account_a",
      openId: "transient-owner",
      nowMs: NOW,
    };
    await Promise.all([
      notes.syncOwnedMapNotes(params),
      notes.syncOwnedMapNotes(params),
    ]);
    expect(
      [...s.table("mapSourceOutbox").values()].filter(
        (x) => x.reason === "LEGACY_NOTE_AUDITED",
      ),
    ).toHaveLength(1);
    expect(
      JSON.stringify([...s.table("mapSourceBridgeState").values()]),
    ).not.toContain("transient-owner");
  });
});
