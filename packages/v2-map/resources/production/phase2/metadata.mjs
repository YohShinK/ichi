import { hash, read, put } from "../shared/security.mjs";
import { uploadedV1ConsentAccepted } from "../shared/uploaded-v1-consent.mjs";

export const profileCacheId = (owner) => `profile:${hash(owner)}`;
export const noteCacheId = (record) => `note:${hash(record)}`;
export const profileVersion = (p) =>
  p
    ? hash(
        JSON.stringify([
          p.accountId,
          p.nickname,
          p.profileState,
          p.avatarState,
          p.avatarFileId,
          p.updatedAt,
        ]),
      )
    : null;
const get = (db, name, id) => read(db.collection(name), id);
const set = (db, name, id, data) => put(db.collection(name), id, data);

// Private owner data is prepared before the atomic admission preview. The
// final admission CAS reads both original profile and version-bound proofs.
export const prepareSourceMetadata = async ({
  db,
  cloud,
  env,
  recordId,
  policy,
  nowMs,
  invocation = {},
}) => {
  const r = await get(db, "observationCandidates", recordId);
  if (!r?.ownerAccountId || !["clue_submitted", "uploaded"].includes(r.status))
    return;
  const owner = r.ownerAccountId,
    terms = policy.terms;
  const account = await get(db, "accounts", owner);
  const consent = await get(
    db,
    "mapContributionConsents",
    hash("consent", owner, terms.version),
  );
  if (
    account?.status !== "active" ||
    !uploadedV1ConsentAccepted(consent, terms, owner, nowMs) ||
    (await get(db, "deletionJobs", `record:${recordId}`)) ||
    (await get(db, "deletionJobs", `account:${owner}`))
  )
    return;
  const profile = await get(db, "profiles", owner);
  const version = profileVersion(profile);
  const cache = await get(db, "mapSourceBridgeState", profileCacheId(owner));
  if (
    profile?.accountId === owner &&
    profile.profileState === "complete" &&
    cache?.profileVersion !== version &&
    profile.avatarState === "wechat-authorized" &&
    /^cloud:\/\/[^/]+\/profile-avatars\//u.test(profile.avatarFileId ?? "") &&
    typeof cloud.downloadFile === "function"
  ) {
    let avatar;
    try {
      avatar = await publishAvatar({
        cloud,
        env,
        profile,
        version,
        policy,
        invocation,
      });
    } catch {
      // Avatar is optional metadata. Unsupported images or storage downtime
      // use the public fallback and never become another board admission gate.
      return;
    }
    try {
      await db.runTransaction(async (tx) => {
        if (
          profileVersion(await get(tx, "profiles", owner)) !== version ||
          (await get(tx, "accounts", owner))?.status !== "active" ||
          (await get(tx, "deletionJobs", `account:${owner}`))
        )
          throw new Error("METADATA_SOURCE_CHANGED");
        const prior = await get(
          tx,
          "mapSourceBridgeState",
          profileCacheId(owner),
        );
        await set(tx, "mapSourceBridgeState", profileCacheId(owner), {
          kind: "PROFILE_METADATA",
          ownerDigest: hash(owner),
          profileVersion: version,
          avatar: { kind: "PUBLIC_URL", url: avatar.url },
          assetFileId: avatar.fileId,
          obsoleteFileIds: [
            ...new Set([
              ...(prior?.obsoleteFileIds ?? []),
              ...(prior?.assetFileId && prior.assetFileId !== avatar.fileId
                ? [prior.assetFileId]
                : []),
            ]),
          ],
        });
      });
    } catch (e) {
      await cloud.deleteFile({ fileList: [avatar.fileId] });
      throw e;
    }
  }
};

export const publishAvatar = async ({
  cloud,
  env,
  profile,
  version,
  policy,
  invocation,
}) => {
  const bucket = env.ICHI_V2_PUBLIC_AVATAR_BUCKET,
    region = env.ICHI_V2_PUBLIC_AVATAR_REGION;
  if (!/^[a-z0-9-]+$/u.test(bucket ?? "") || region !== "ap-shanghai")
    throw new Error("AVATAR_STORAGE_UNBOUND");
  const origin = `https://${bucket}.cos.${region}.myqcloud.com`;
  if (!policy.publicAvatarOrigins?.includes(origin))
    throw new Error("AVATAR_ORIGIN_UNBOUND");
  const { fileContent: bytes } = await cloud.downloadFile({
    fileID: profile.avatarFileId,
  });
  const png =
    Buffer.isBuffer(bytes) &&
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpg =
    Buffer.isBuffer(bytes) &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[bytes.length - 2] === 255 &&
    bytes[bytes.length - 1] === 217;
  if ((!png && !jpg) || bytes.length > 1048576 || bytes.length < 16)
    throw new Error("AVATAR_CONTENT_INVALID");
  const key = `public-map-avatars/${hash("avatar-public-v1", profile.accountId, version)}.${png ? "png" : "jpg"}`;
  const { fileID } = await cloud.uploadFile({
    cloudPath: key,
    fileContent: bytes,
  });
  const { default: COS } = await import("cos-nodejs-sdk-v5");
  // SCF invocation credentials rotate; do not retain credentials in a warm
  // global client. They are never included in a public URL, cache, or log.
  const { default: CloudBase } = await import("@cloudbase/node-sdk");
  const context = CloudBase.getCloudbaseContext(invocation);
  const current =
    typeof invocation.environment === "string"
      ? JSON.parse(invocation.environment)
      : (invocation.environment ?? invocation.environ ?? {});
  const credentials = { ...env, ...context, ...current };
  const cos = new COS({
    SecretId: credentials.TENCENTCLOUD_SECRETID,
    SecretKey: credentials.TENCENTCLOUD_SECRETKEY,
    SecurityToken: credentials.TENCENTCLOUD_SESSIONTOKEN,
  });
  try {
    await new Promise((resolve, reject) =>
      cos.putObjectAcl(
        { Bucket: bucket, Region: region, Key: key, ACL: "public-read" },
        (e) => (e ? reject(new Error("AVATAR_PUBLIC_ACL_FAILED")) : resolve()),
      ),
    );
  } catch (e) {
    await cloud.deleteFile({ fileList: [fileID] });
    throw e;
  }
  return { url: `${origin}/${key}`, fileId: fileID };
};

export const cleanupAccountMetadata = async ({ db, cloud, owner }) => {
  const id = profileCacheId(owner),
    cache = await get(db, "mapSourceBridgeState", id);
  const files = [
    ...new Set(
      [cache?.assetFileId, ...(cache?.obsoleteFileIds ?? [])].filter(
        (x) => typeof x === "string" && /\/public-map-avatars\//u.test(x),
      ),
    ),
  ];
  if (files.length) {
    const result = await cloud.deleteFile({ fileList: files });
    if (result?.fileList?.some((x) => x.status !== 0 && x.status !== -503003))
      throw new Error("AVATAR_CLEANUP_FAILED");
  }
  if (cache)
    await set(db, "mapSourceBridgeState", id, {
      kind: "PROFILE_METADATA",
      ownerDigest: hash(owner),
      deleted: true,
    });
};
