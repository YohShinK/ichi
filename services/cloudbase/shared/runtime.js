"use strict";
/* eslint-disable @typescript-eslint/no-require-imports */

const crypto = require("node:crypto");
const domain = require("./domain");
const { TEXT_SAFETY_USAGE, reviewTextSafety } = require("./text-safety-review");

const COLLECTIONS = Object.freeze({
  accounts: "accounts",
  identities: "wechatIdentities",
  profiles: "profiles",
  ids: "ichiIds",
  roles: "accountRoles",
  quotas: "dailyQuotas",
  jobs: "recognitionJobs",
  observations: "observationCandidates",
  draws: "drawSubmissions",
  codes: "recordCodes",
  deletions: "deletionJobs",
  settings: "systemSettings",
  audits: "auditEvents",
});

const nowIso = (timestamp = Date.now()) => new Date(timestamp).toISOString();
const auditId = () => domain.newInternalId("audit");
const storageCleanupId = (fileId) =>
  `storage:${crypto.createHash("sha256").update(fileId).digest("hex").slice(0, 32)}`;
const response = (data) => ({ ok: true, data });
const failure = (error) => ({
  ok: false,
  error: {
    code: error?.code || "INTERNAL_ERROR",
    ...(error?.details ? { details: error.details } : {}),
  },
});
const safeEvent = (event) => (event && typeof event === "object" ? event : {});
const stripDatabaseMetadata = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const document = { ...value };
  delete document._id;
  return document;
};

const isPrizeTicketSubmission = (submission, recordId, boardId) =>
  typeof submission?.verificationId === "string" &&
  submission.verificationId.startsWith(`prize-ticket:${recordId}:${boardId}:`);

const hasOwn = (value, key) =>
  Boolean(value && Object.prototype.hasOwnProperty.call(value, key));

const nullableCount = (value) =>
  Number.isSafeInteger(value) && value >= 0 ? value : null;

const recognizedSnapshotSummary = (result) => {
  const draft = result?.draft;
  if (!draft || typeof draft !== "object") return null;
  const legacyBlockValue = (componentType) =>
    (draft.blocks || []).find((block) => block?.componentType === componentType)
      ?.rawText;
  const ip = hasOwn(draft, "ipName")
    ? typeof draft.ipName === "string"
      ? draft.ipName
      : ""
    : legacyBlockValue("series_identity");
  const pricePerDraw = nullableCount(draft.price?.amount);
  const tiers = Array.isArray(draft.tiers)
    ? draft.tiers.map((tier) => ({
        tierId: domain.normalizeTierId(tier?.label),
        total: hasOwn(tier, "totalTickets")
          ? nullableCount(tier.totalTickets)
          : nullableCount(tier?.slotObservation?.totalSlots),
        remaining: hasOwn(tier, "remainingTickets")
          ? nullableCount(tier.remainingTickets)
          : nullableCount(tier?.slotObservation?.openSlots),
        attached: hasOwn(tier, "pastedTickets")
          ? nullableCount(tier.pastedTickets)
          : nullableCount(tier?.slotObservation?.coveredSlots),
        unknown: hasOwn(tier, "unknownTickets")
          ? nullableCount(tier.unknownTickets)
          : nullableCount(tier?.slotObservation?.unknownSlots),
      }))
    : [];
  return {
    ip: typeof ip === "string" ? ip : "",
    theme:
      (hasOwn(draft, "themeName")
        ? typeof draft.themeName === "string"
          ? draft.themeName
          : ""
        : legacyBlockValue("board_theme")) || "",
    pricePerDraw: Number.isFinite(pricePerDraw) ? pricePerDraw : null,
    tiers,
  };
};

const correctionSummary = (recognized, confirmed) => {
  if (!recognized) return { recognizedResultAvailable: false, fields: [] };
  if (confirmed.schemaVersion === "board-record-r2-1.0.0") {
    const fields = [];
    if (recognized.ip.trim() !== confirmed.ipName)
      fields.push({
        field: "ipName",
        recognized: recognized.ip,
        confirmed: confirmed.ipName,
      });
    if (
      String(recognized.theme || "").trim() !==
      String(confirmed.themeName || "")
    )
      fields.push({
        field: "themeName",
        recognized: recognized.theme || "",
        confirmed: confirmed.themeName || "",
      });
    const recognizedTiers = new Map(
      recognized.tiers.map((tier) => [tier.tierId, tier]),
    );
    for (const tier of confirmed.tiers) {
      const before = recognizedTiers.get(tier.tierCode);
      if (!before || before.remaining !== tier.remainingTickets)
        fields.push({
          field: `tiers.${tier.tierCode}.remainingTickets`,
          recognized: before?.remaining ?? null,
          confirmed: tier.remainingTickets,
        });
      recognizedTiers.delete(tier.tierCode);
    }
    return { recognizedResultAvailable: true, fields };
  }
  const fields = [];
  if (recognized.ip.trim() !== confirmed.ip)
    fields.push({
      field: "ip",
      recognized: recognized.ip,
      confirmed: confirmed.ip,
    });
  if (String(recognized.theme || "").trim() !== String(confirmed.theme || ""))
    fields.push({
      field: "theme",
      recognized: recognized.theme || "",
      confirmed: confirmed.theme || "",
    });
  if (recognized.pricePerDraw !== confirmed.pricePerDraw)
    fields.push({
      field: "pricePerDraw",
      recognized: recognized.pricePerDraw,
      confirmed: confirmed.pricePerDraw,
    });
  const recognizedTiers = new Map(
    recognized.tiers.map((tier) => [tier.tierId, tier]),
  );
  for (const tier of confirmed.tiers) {
    const before = recognizedTiers.get(tier.tierId);
    if (
      !before ||
      before.total !== tier.total ||
      before.remaining !== tier.remaining ||
      before.attached !== tier.attached ||
      before.unknown !== 0
    )
      fields.push({
        field: `tiers.${tier.tierId}`,
        recognized: before || null,
        confirmed: {
          total: tier.total,
          remaining: tier.remaining,
          attached: tier.attached,
        },
      });
    recognizedTiers.delete(tier.tierId);
  }
  for (const [tierId, before] of recognizedTiers)
    fields.push({
      field: `tiers.${tierId}`,
      recognized: before,
      confirmed: null,
    });
  return { recognizedResultAvailable: true, fields };
};

const getDocument = async (source, collection, id) => {
  try {
    const result = await source.collection(collection).doc(id).get();
    return stripDatabaseMetadata(result?.data) || null;
  } catch (error) {
    if (/not exist|not found|-502005/u.test(String(error?.message || error)))
      return null;
    throw error;
  }
};

const createRuntime = ({
  cloud,
  env = process.env,
  now = Date.now,
  textSafetyReviewer,
}) => {
  cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
  const db = cloud.database();
  const trustedIdentity = () => {
    const context = cloud.getWXContext();
    const appId = context.APPID;
    const openId = context.OPENID;
    domain.assert(appId && openId, "TRUSTED_IDENTITY_UNAVAILABLE");
    return {
      appId,
      openId,
      identityId: domain.hashIdentity({
        appId,
        openId,
        secret: env.IDENTITY_HMAC_KEY,
      }),
    };
  };
  const accountForCaller = async (source = db) => {
    const identity = trustedIdentity();
    const mapping = await getDocument(
      source,
      COLLECTIONS.identities,
      identity.identityId,
    );
    domain.assert(mapping?.accountId, "ACCOUNT_REQUIRED");
    const account = await getDocument(
      source,
      COLLECTIONS.accounts,
      mapping.accountId,
    );
    domain.assert(
      account?.status === "active",
      account?.status === "deleting" ? "ACCOUNT_DELETING" : "ACCOUNT_REQUIRED",
    );
    return { accountId: mapping.accountId, identity };
  };
  const addAudit = (source, data) =>
    source
      .collection(COLLECTIONS.audits)
      .doc(auditId())
      .set({ data: { ...data, createdAt: nowIso(now()) } });

  const enqueueStorageCleanup = async ({
    fileId,
    ownerAccountId,
    reason,
    nextAttemptAt = nowIso(now()),
    linkedSubmission,
  }) => {
    if (typeof fileId !== "string" || !fileId) return;
    const timestamp = nowIso(now());
    await db
      .collection(COLLECTIONS.deletions)
      .doc(storageCleanupId(fileId))
      .set({
        data: {
          ownerAccountId,
          targetType: "storage-object",
          targetId: storageCleanupId(fileId),
          fileId,
          reason,
          ...(linkedSubmission || {}),
          status: "pending",
          requestedAt: timestamp,
          deadlineAt: nextAttemptAt,
          nextAttemptAt,
          attempts: 0,
          updatedAt: timestamp,
        },
      });
  };

  const processStorageObjectDeletion = async (deletion, timestamp) => {
    domain.assert(
      typeof deletion.fileId === "string" && deletion.fileId,
      "STORAGE_CLEANUP_TARGET_INVALID",
    );
    if (/(?:^|\/)profile-avatars\//u.test(deletion.fileId)) {
      const references = await db
        .collection(COLLECTIONS.profiles)
        .where({ avatarFileId: deletion.fileId })
        .limit(1)
        .get();
      if ((references.data || []).length)
        return { skippedReason: "ACTIVE_PROFILE_REFERENCE" };
    }
    await cloud.deleteFile({ fileList: [deletion.fileId] });
    if (typeof deletion.verificationId === "string") {
      const submission = await getDocument(
        db,
        COLLECTIONS.draws,
        deletion.verificationId,
      );
      if (submission?.imageFileId === deletion.fileId)
        await db
          .collection(COLLECTIONS.draws)
          .doc(deletion.verificationId)
          .update({
            data: {
              imageFileId: null,
              ...(new Set([
                "LOCATION_PENDING",
                "PHOTO_PENDING",
                "PROCESSING",
                "PROVIDER_FAILED",
              ]).has(submission.status)
                ? {
                    status: "PHOTO_FAILED",
                    errorCode: "TEMP_EVIDENCE_EXPIRED",
                  }
                : {}),
              updatedAt: timestamp,
            },
          });
    }
    return {};
  };

  const completeStorageObjectDeletion = async (deletion, timestamp) => {
    const result = await processStorageObjectDeletion(deletion, timestamp);
    await db
      .collection(COLLECTIONS.deletions)
      .doc(deletion._id)
      .update({
        data: {
          status: "completed",
          completedAt: timestamp,
          ...(result.skippedReason
            ? { skippedReason: result.skippedReason }
            : {}),
          updatedAt: timestamp,
        },
      });
  };

  const allocateIchiId = async (transaction, accountId, preferred) => {
    const candidates = preferred
      ? [preferred]
      : Array.from({ length: 12 }, () => domain.newPublicIchiId());
    for (const candidate of candidates) {
      const normalized = domain.normalizeIchiId(candidate);
      if (!preferred)
        domain.assert(!domain.isReservedIchiId(normalized), "ICHI_ID_RESERVED");
      const existing = await getDocument(
        transaction,
        COLLECTIONS.ids,
        normalized,
      );
      if (!existing) {
        await transaction
          .collection(COLLECTIONS.ids)
          .doc(normalized)
          .set({
            data: { accountId, state: "active", createdAt: nowIso(now()) },
          });
        return normalized;
      }
    }
    throw new domain.IchiError("ICHI_ID_ALLOCATION_FAILED");
  };

  const bootstrapAccount = async () => {
    const identity = trustedIdentity();
    return db.runTransaction(async (transaction) => {
      const existing = await getDocument(
        transaction,
        COLLECTIONS.identities,
        identity.identityId,
      );
      if (existing?.accountId) {
        const profile = await getDocument(
          transaction,
          COLLECTIONS.profiles,
          existing.accountId,
        );
        return response({
          ichiId: profile.canonicalIchiId,
          nickname: profile.nickname,
          profileState: profile.profileState,
          created: false,
        });
      }
      const accountId = domain.newInternalId("acct");
      const canonicalIchiId = await allocateIchiId(transaction, accountId);
      const timestamp = nowIso(now());
      await transaction
        .collection(COLLECTIONS.accounts)
        .doc(accountId)
        .set({
          data: {
            status: "active",
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        });
      await transaction
        .collection(COLLECTIONS.identities)
        .doc(identity.identityId)
        .set({
          data: { accountId, appId: identity.appId, createdAt: timestamp },
        });
      await transaction
        .collection(COLLECTIONS.profiles)
        .doc(accountId)
        .set({
          data: {
            accountId,
            canonicalIchiId,
            nickname: "ICHI 玩家",
            avatarState: "default",
            profileState: "incomplete",
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        });
      await addAudit(transaction, {
        type: "account.created",
        actorAccountId: accountId,
        subjectType: "account",
        subjectId: accountId,
      });
      return response({
        ichiId: canonicalIchiId,
        nickname: "ICHI 玩家",
        profileState: "incomplete",
        created: true,
      });
    });
  };

  const freshProfileAvatarUrl = async (profile) => {
    if (typeof profile?.avatarFileId !== "string" || !profile.avatarFileId)
      return typeof profile?.avatarUrl === "string"
        ? profile.avatarUrl
        : undefined;
    if (typeof cloud.getTempFileURL !== "function") return undefined;
    try {
      const result = await cloud.getTempFileURL({
        fileList: [{ fileID: profile.avatarFileId, maxAge: 300 }],
      });
      const url = result?.fileList?.[0]?.tempFileURL;
      return typeof url === "string" && url.startsWith("https://")
        ? url
        : undefined;
    } catch {
      // A profile read must remain usable when a short-lived avatar URL
      // cannot be minted. The private fileID remains the durable source.
      return undefined;
    }
  };

  const profileResponse = async (profile) => {
    const avatarUrl = await freshProfileAvatarUrl(profile);
    return {
      ichiId: profile.canonicalIchiId,
      nickname: profile.nickname,
      avatarState: profile.avatarState,
      ...(typeof profile.avatarFileId === "string" && profile.avatarFileId
        ? { avatarFileId: profile.avatarFileId }
        : {}),
      ...(avatarUrl ? { avatarUrl } : {}),
      profileState: profile.profileState,
    };
  };

  const getMyProfile = async () => {
    const { accountId } = await accountForCaller();
    const profile = await getDocument(db, COLLECTIONS.profiles, accountId);
    return response(await profileResponse(profile));
  };

  const bindWechatProfile = async (event) => {
    const { accountId, identity } = await accountForCaller();
    const nickname = String(event.nickname || "").trim();
    const avatarUrl = String(event.avatarUrl || "").trim();
    const avatarFileId = String(event.avatarFileId || "").trim();
    const validAvatarFileId =
      avatarFileId.length >= 8 &&
      /^cloud:\/\//u.test(avatarFileId) &&
      /(?:^|\/)profile-avatars\//u.test(avatarFileId);
    if (event.action === "cleanup-upload") {
      domain.assert(validAvatarFileId, "PROFILE_AVATAR_INVALID");
      const references = await db
        .collection(COLLECTIONS.profiles)
        .where({ avatarFileId })
        .limit(1)
        .get();
      domain.assert(
        (references.data || []).length === 0,
        "PROFILE_AVATAR_IN_USE",
      );
      try {
        await cloud.deleteFile({ fileList: [avatarFileId] });
        return response({ status: "deleted" });
      } catch {
        await enqueueStorageCleanup({
          fileId: avatarFileId,
          ownerAccountId: accountId,
          reason: "rejected_profile_upload",
        });
        return response({ status: "pending" });
      }
    }
    domain.assert(
      nickname.length >= 1 && nickname.length <= 32,
      "PROFILE_NICKNAME_INVALID",
    );
    domain.assert(
      validAvatarFileId ||
        (/^https:\/\//u.test(avatarUrl) && avatarUrl.length <= 1024),
      "PROFILE_AVATAR_INVALID",
    );
    const textReview = await reviewTextSafety({
      cloud,
      usage: TEXT_SAFETY_USAGE.PROFILE_NICKNAME,
      content: nickname,
      openId: identity.openId,
      reviewer: textSafetyReviewer,
    });
    domain.assert(textReview.passed, "PROFILE_NICKNAME_REVIEW_FAILED");
    const update = await db.runTransaction(async (transaction) => {
      const profile = await getDocument(
        transaction,
        COLLECTIONS.profiles,
        accountId,
      );
      domain.assert(profile, "ACCOUNT_REQUIRED");
      const timestamp = nowIso(now());
      await transaction
        .collection(COLLECTIONS.profiles)
        .doc(accountId)
        .update({
          data: {
            nickname,
            ...(avatarFileId ? { avatarFileId } : { avatarUrl }),
            avatarState: "wechat-authorized",
            profileState: "complete",
            updatedAt: timestamp,
          },
        });
      await addAudit(transaction, {
        type:
          profile.profileState === "complete"
            ? "profile.wechat-updated"
            : "profile.wechat-bound",
        actorAccountId: accountId,
        subjectType: "account",
        subjectId: accountId,
      });
      const boundProfile = {
        ...profile,
        nickname,
        ...(avatarFileId ? { avatarFileId } : { avatarUrl }),
        avatarState: "wechat-authorized",
        profileState: "complete",
      };
      return {
        profile: boundProfile,
        previousAvatarFileId:
          typeof profile.avatarFileId === "string"
            ? profile.avatarFileId
            : undefined,
        created: profile.profileState !== "complete",
      };
    });
    if (
      update.previousAvatarFileId &&
      update.previousAvatarFileId !== update.profile.avatarFileId &&
      typeof cloud.deleteFile === "function"
    ) {
      try {
        await cloud.deleteFile({ fileList: [update.previousAvatarFileId] });
      } catch {
        await enqueueStorageCleanup({
          fileId: update.previousAvatarFileId,
          ownerAccountId: accountId,
          reason: "replaced_profile_avatar",
        });
      }
    }
    return response({
      ...(await profileResponse(update.profile)),
      created: update.created,
      updated: !update.created,
    });
  };

  const getQuotaStatus = async () => {
    const { accountId } = await accountForCaller();
    const { dateKey } = domain.quotaWindow(now());
    const quota = await getDocument(
      db,
      COLLECTIONS.quotas,
      `${accountId}:${dateKey}`,
    );
    return response(domain.quotaSummary(quota, now()));
  };

  const reserveRecognition = async (event) => {
    const { accountId } = await accountForCaller();
    const keyHash = domain.hashIdempotencyKey(accountId, event.idempotencyKey);
    const jobId = `${accountId}:${keyHash}`;
    return db.runTransaction(async (transaction) => {
      const existingJob = await getDocument(
        transaction,
        COLLECTIONS.jobs,
        jobId,
      );
      if (existingJob) {
        let jobToken;
        if (["reserved", "recognized"].includes(existingJob.status)) {
          jobToken = domain.newRecognitionJobToken();
          await transaction
            .collection(COLLECTIONS.jobs)
            .doc(jobId)
            .update({
              data: {
                accessTokenHash: domain.hashRecognitionJobToken(jobToken),
                updatedAt: nowIso(now()),
              },
            });
        }
        if (
          existingJob.status === "recognized_released" &&
          existingJob.structuredResult
        ) {
          const quota = await getDocument(
            transaction,
            COLLECTIONS.quotas,
            existingJob.quotaId,
          );
          const summary = domain.quotaSummary(quota, now());
          domain.assert(summary.remaining > 0, "QUOTA_EXHAUSTED", summary);
          const timestamp = nowIso(now());
          jobToken = domain.newRecognitionJobToken();
          quota.reservations[existingJob.keyHash] = {
            status: "reserved",
            jobId,
            reservedAt: timestamp,
            expiresAt: new Date(now() + 30 * 60 * 1000).toISOString(),
          };
          quota.updatedAt = timestamp;
          await transaction
            .collection(COLLECTIONS.quotas)
            .doc(existingJob.quotaId)
            .set({ data: quota });
          await transaction
            .collection(COLLECTIONS.jobs)
            .doc(jobId)
            .update({
              data: {
                status: "recognized",
                accessTokenHash: domain.hashRecognitionJobToken(jobToken),
                leaseExpiresAt:
                  quota.reservations[existingJob.keyHash].expiresAt,
                errorCode: null,
                completedAt: null,
                updatedAt: timestamp,
              },
            });
          return response({
            jobId,
            jobToken,
            status: "recognized",
            quota: domain.quotaSummary(quota, now()),
          });
        }
        return response({
          jobId,
          status: existingJob.status,
          ...(jobToken ? { jobToken } : {}),
          quota: domain.quotaSummary(
            await getDocument(
              transaction,
              COLLECTIONS.quotas,
              existingJob.quotaId,
            ),
            now(),
          ),
        });
      }
      const settings = await getDocument(
        transaction,
        COLLECTIONS.settings,
        "recognition",
      );
      domain.assert(settings?.enabled !== false, "RECOGNITION_CIRCUIT_OPEN");
      const { dateKey } = domain.quotaWindow(now());
      const quotaId = `${accountId}:${dateKey}`;
      const quota = (await getDocument(
        transaction,
        COLLECTIONS.quotas,
        quotaId,
      )) || {
        accountId,
        dateKey,
        limit: settings?.dailyAccountLimit || domain.QUOTA_LIMIT,
        used: 0,
        reservations: {},
      };
      const summary = domain.quotaSummary(quota, now());
      domain.assert(summary.remaining > 0, "QUOTA_EXHAUSTED", summary);
      const timestamp = nowIso(now());
      const jobToken = domain.newRecognitionJobToken();
      quota.reservations[keyHash] = {
        status: "reserved",
        jobId,
        reservedAt: timestamp,
        expiresAt: new Date(now() + 10 * 60 * 1000).toISOString(),
      };
      quota.updatedAt = timestamp;
      await transaction
        .collection(COLLECTIONS.quotas)
        .doc(quotaId)
        .set({ data: quota });
      await transaction
        .collection(COLLECTIONS.jobs)
        .doc(jobId)
        .set({
          data: {
            ownerAccountId: accountId,
            quotaId,
            keyHash,
            sourcePath: event.sourcePath,
            status: "reserved",
            accessTokenHash: domain.hashRecognitionJobToken(jobToken),
            createdAt: timestamp,
            updatedAt: timestamp,
            leaseExpiresAt: quota.reservations[keyHash].expiresAt,
          },
        });
      await addAudit(transaction, {
        type: "quota.reserved",
        actorAccountId: accountId,
        subjectType: "recognitionJob",
        subjectId: jobId,
      });
      return response({
        jobId,
        jobToken,
        status: "reserved",
        quota: domain.quotaSummary(quota, now()),
      });
    });
  };

  const releaseRecognition = async (event) => {
    const { accountId } = await accountForCaller();
    const jobId = String(event.jobId || "");
    const jobToken = String(event.jobToken || "");
    domain.assert(jobId && jobToken, "RECOGNITION_JOB_TOKEN_REQUIRED");
    return db.runTransaction(async (transaction) => {
      const job = await getDocument(transaction, COLLECTIONS.jobs, jobId);
      domain.assert(
        job?.ownerAccountId === accountId,
        "RECOGNITION_JOB_NOT_FOUND",
      );
      const quota = await getDocument(
        transaction,
        COLLECTIONS.quotas,
        job.quotaId,
      );
      if (!["reserved", "recognized"].includes(job.status)) {
        return response({
          jobId,
          status: job.status,
          released: false,
          quota: domain.quotaSummary(quota, now()),
        });
      }
      domain.assert(
        job.accessTokenHash === domain.hashRecognitionJobToken(jobToken),
        "RECOGNITION_JOB_TOKEN_INVALID",
      );
      const reservation = quota?.reservations?.[job.keyHash];
      domain.assert(
        reservation?.status === "reserved",
        "RECOGNITION_RESERVATION_INVALID",
      );
      const timestamp = nowIso(now());
      quota.reservations[job.keyHash] = {
        ...reservation,
        status: "released",
        releasedAt: timestamp,
        releaseReason: "client_terminal_failure",
      };
      quota.updatedAt = timestamp;
      await transaction
        .collection(COLLECTIONS.quotas)
        .doc(job.quotaId)
        .set({ data: quota });
      const recognized = job.status === "recognized";
      await transaction
        .collection(COLLECTIONS.jobs)
        .doc(jobId)
        .update({
          data: {
            status: recognized ? "recognized_released" : "failed",
            errorCode: "RECOGNITION_CLIENT_TERMINATED",
            accessTokenHash: null,
            completedAt: timestamp,
            updatedAt: timestamp,
          },
        });
      await addAudit(transaction, {
        type: "quota.released",
        actorAccountId: accountId,
        subjectType: "recognitionJob",
        subjectId: jobId,
      });
      return response({
        jobId,
        status: recognized ? "recognized_released" : "failed",
        released: true,
        quota: domain.quotaSummary(quota, now()),
      });
    });
  };

  const getRecognitionJob = async (event) => {
    const { accountId } = await accountForCaller();
    const job = await getDocument(
      db,
      COLLECTIONS.jobs,
      String(event.jobId || ""),
    );
    domain.assert(
      job?.ownerAccountId === accountId,
      "RECOGNITION_JOB_NOT_FOUND",
    );
    return response({
      jobId: event.jobId,
      status: job.status,
      result: job.structuredResult
        ? {
            ...job.structuredResult,
            imageHandling: {
              retention: "ephemeral",
              published: false,
              storedInSessionHistory: false,
            },
          }
        : null,
      errorCode: job.errorCode || null,
    });
  };

  const finalizeObservation = async (event) => {
    domain.assertNoImagePayload(event);
    const { accountId } = await accountForCaller();
    const snapshot = domain.validateSnapshot(event.confirmedSnapshot);
    const location = domain.assertLocation(event.location);
    domain.assert(
      ["direct-upload", "assisted-draw"].includes(event.sourcePath),
      "SOURCE_PATH_INVALID",
    );
    const locationNote = String(event.locationNote || "").trim();
    domain.assert(locationNote.length <= 300, "LOCATION_NOTE_INVALID");
    if (event.sourcePath === "direct-upload")
      domain.assert(locationNote, "LOCATION_NOTE_REQUIRED");
    domain.assert(
      typeof event.recognitionJobId === "string" && event.recognitionJobId,
      "RECOGNITION_JOB_INVALID",
    );
    const recordId = `record_${crypto
      .createHash("sha256")
      .update(`${accountId}:${event.recognitionJobId}`)
      .digest("hex")
      .slice(0, 32)}`;
    return db.runTransaction(async (transaction) => {
      const existing = await getDocument(
        transaction,
        COLLECTIONS.observations,
        recordId,
      );
      if (existing) {
        domain.assert(
          existing.ownerAccountId === accountId &&
            existing.sourcePath === event.sourcePath,
          "RECORD_NOT_FOUND",
        );
        return response({
          recordId,
          recordCode: existing.recordCode,
          boardId: existing.boardId,
          status: existing.status,
          idempotent: true,
        });
      }
      const job = await getDocument(
        transaction,
        COLLECTIONS.jobs,
        String(event.recognitionJobId || ""),
      );
      domain.assert(
        job?.ownerAccountId === accountId &&
          ["recognized", "succeeded"].includes(job.status) &&
          job.sourcePath === event.sourcePath,
        "RECOGNITION_JOB_INVALID",
      );
      const quota = await getDocument(
        transaction,
        COLLECTIONS.quotas,
        job.quotaId,
      );
      const reservation = quota?.reservations?.[job.keyHash];
      const legacyCommitted = job.status === "succeeded";
      domain.assert(
        reservation?.status === (legacyCommitted ? "committed" : "reserved"),
        "QUOTA_RESERVATION_INVALID",
      );
      const recordCode = domain.newRecordCode();
      domain.assert(
        !(await getDocument(transaction, COLLECTIONS.codes, recordCode)),
        "RECORD_CODE_COLLISION",
      );
      const boardId = event.boardId || domain.newInternalId("board");
      const timestamp = nowIso(now());
      if (!legacyCommitted) {
        reservation.status = "committed";
        reservation.committedAt = timestamp;
        quota.used = (quota.used || 0) + 1;
        quota.updatedAt = timestamp;
        await transaction
          .collection(COLLECTIONS.quotas)
          .doc(job.quotaId)
          .set({ data: quota });
      }
      const observation = {
        ownerAccountId: accountId,
        recordId,
        recordCode,
        boardId,
        sourcePath: event.sourcePath,
        initialSnapshot: snapshot,
        finalSnapshot: event.sourcePath === "direct-upload" ? snapshot : null,
        ...(snapshot.schemaVersion === "board-record-r2-1.0.0"
          ? {
              recognitionVersion: "R2",
              ipName: snapshot.ipName,
              ...(snapshot.themeName ? { themeName: snapshot.themeName } : {}),
              pricePerDraw: snapshot.pricePerDraw,
              tiers: snapshot.tiers,
            }
          : {}),
        location,
        ...(locationNote ? { locationNote } : {}),
        observedAt: event.observedAt || timestamp,
        serverReceivedAt: timestamp,
        recognitionJobId: event.recognitionJobId,
        promptVersion: event.promptVersion,
        schemaVersion: snapshot.schemaVersion || "board-snapshot-1.0.0",
        normalizationVersion: "tier-normalization-1.0.0",
        ...(snapshot.schemaVersion === "board-record-r2-1.0.0"
          ? {}
          : { recognizedStructuredResult: job.structuredResult || null }),
        correctionSummary: correctionSummary(
          recognizedSnapshotSummary(job.structuredResult),
          snapshot,
        ),
        consentVersion: event.consentVersion,
        disclosureVersion: event.disclosureVersion,
        status:
          event.sourcePath === "direct-upload"
            ? "clue_submitted"
            : "private_saved",
        v2Eligibility: "pending",
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      domain.assertNoImagePayload(observation);
      await transaction
        .collection(COLLECTIONS.jobs)
        .doc(event.recognitionJobId)
        .update({
          data: {
            status: "committed",
            recordId,
            accessTokenHash: null,
            completedAt: timestamp,
            updatedAt: timestamp,
          },
        });
      await transaction
        .collection(COLLECTIONS.codes)
        .doc(recordCode)
        .set({
          data: {
            recordId,
            ownerAccountId: accountId,
            state: "active",
            createdAt: timestamp,
          },
        });
      await transaction
        .collection(COLLECTIONS.observations)
        .doc(recordId)
        .set({ data: observation });
      await addAudit(transaction, {
        type: "observation.finalized",
        actorAccountId: accountId,
        subjectType: "record",
        subjectId: recordId,
      });
      if (!legacyCommitted) {
        await addAudit(transaction, {
          type: "quota.committed",
          actorAccountId: accountId,
          subjectType: "recognitionJob",
          subjectId: event.recognitionJobId,
        });
      }
      return response({
        recordId,
        recordCode,
        boardId,
        status: observation.status,
        idempotent: false,
      });
    });
  };

  const finalizeDrawUpdate = async (event) => {
    domain.assertNoImagePayload(event);
    const { accountId } = await accountForCaller();
    const recordId = String(event.recordId || "");
    const normalizeDrawEvent = (item) => {
      const eventId = String(item?.eventId || item?.operationId || "").trim();
      const tierCode = domain.normalizeTierId(item?.tierCode);
      domain.assert(
        eventId.length > 0 && eventId.length <= 160 && tierCode !== "OTHER",
        "AUTHORITATIVE_DRAW_RECORD_INVALID",
      );
      return {
        eventId,
        tierCode,
        ...(Number.isFinite(item?.occurredAt)
          ? { occurredAt: Number(item.occurredAt) }
          : {}),
      };
    };
    if (event.preparePrizeTicketVerification === true) {
      return db.runTransaction(async (transaction) => {
        const observation = await getDocument(
          transaction,
          COLLECTIONS.observations,
          recordId,
        );
        domain.assert(
          observation?.ownerAccountId === accountId &&
            observation.sourcePath === "assisted-draw",
          "RECORD_NOT_FOUND",
        );
        const version = Number(event.submissionVersion);
        domain.assert(
          Number.isSafeInteger(version) &&
            version > 0 &&
            version === Number(observation.currentVerificationVersion || 0),
          "SUBMISSION_SUPERSEDED",
        );
        domain.assert(
          Array.isArray(event.authoritativeDrawEvents) &&
            event.authoritativeDrawEvents.length > 0,
          "AUTHORITATIVE_DRAW_RECORD_UNAVAILABLE",
        );
        const seen = new Set();
        const supplied = event.authoritativeDrawEvents.map((item) => {
          const normalized = normalizeDrawEvent(item);
          domain.assert(
            !seen.has(normalized.eventId),
            "AUTHORITATIVE_DRAW_RECORD_INVALID",
          );
          seen.add(normalized.eventId);
          return normalized;
        });
        const persisted = Array.isArray(observation.authoritativeDrawEvents)
          ? observation.authoritativeDrawEvents.map(normalizeDrawEvent)
          : [];
        const suppliedById = new Map(
          supplied.map((item) => [item.eventId, item]),
        );
        for (const item of persisted)
          domain.assert(
            suppliedById.get(item.eventId)?.tierCode === item.tierCode,
            "SUBMISSION_VERSION_CONFLICT",
          );
        const sameVersion =
          Number(observation.authoritativeDrawSubmissionVersion || 0) ===
          version;
        if (sameVersion)
          domain.assert(
            JSON.stringify(persisted) === JSON.stringify(supplied),
            "SUBMISSION_VERSION_CONFLICT",
          );
        const counts = supplied.reduce((result, item) => {
          result[item.tierCode] = (result[item.tierCode] || 0) + 1;
          return result;
        }, {});
        const finalSnapshot = domain.deriveFinalSnapshot(
          observation.initialSnapshot,
          counts,
        );
        if (!sameVersion) {
          const timestamp = nowIso(now());
          await transaction
            .collection(COLLECTIONS.observations)
            .doc(recordId)
            .update({
              data: {
                authoritativeDrawEvents: supplied,
                authoritativeDrawSubmissionVersion: version,
                finalSnapshot,
                ...(finalSnapshot.schemaVersion === "board-record-r2-1.0.0"
                  ? { tiers: finalSnapshot.tiers }
                  : {}),
                status: "private_saved",
                updatedAt: timestamp,
              },
            });
          await addAudit(transaction, {
            type: "draw.verification_prepared",
            actorAccountId: accountId,
            subjectType: "record",
            subjectId: recordId,
          });
        }
        return response({
          recordId,
          status: "verification_prepared",
          authoritativeDrawCount: supplied.length,
          idempotent: sameVersion,
        });
      });
    }
    return db.runTransaction(async (transaction) => {
      const observation = await getDocument(
        transaction,
        COLLECTIONS.observations,
        recordId,
      );
      domain.assert(
        observation?.ownerAccountId === accountId &&
          observation.sourcePath === "assisted-draw",
        "RECORD_NOT_FOUND",
      );
      const inApp = domain.normalizeTierCounts(event.inAppDrawCounts || {});
      const ticket = domain.normalizeTierCounts(
        event.confirmedTicketCounts || {},
      );
      const same = JSON.stringify(inApp) === JSON.stringify(ticket);
      if (!same && !event.conflictResolution)
        return response({
          recordId,
          status: "needs_user_confirmation",
          reconciliationDiffs: { inApp, ticket },
        });
      const resolved = event.conflictResolution === "ticket" ? ticket : inApp;
      const finalSnapshot = domain.deriveFinalSnapshot(
        observation.initialSnapshot,
        resolved,
      );
      const version = Number(event.submissionVersion || 1);
      const submissionId = `${recordId}:${version}`;
      const existing = await getDocument(
        transaction,
        COLLECTIONS.draws,
        submissionId,
      );
      if (existing)
        return response({
          recordId,
          status: existing.status,
          finalSnapshot: existing.finalSnapshot,
          idempotent: true,
        });
      const timestamp = nowIso(now());
      const submission = {
        ownerAccountId: accountId,
        recordId,
        submissionVersion: version,
        inAppDrawCounts: inApp,
        ticketUserConfirmed: ticket,
        reconciliationDiffs: same ? null : { inApp, ticket },
        resolvedDrawCountsByTier: resolved,
        derivationVersion: "snapshot-subtraction-1.0.0",
        finalSnapshot,
        status: "confirmed",
        createdAt: timestamp,
      };
      await transaction
        .collection(COLLECTIONS.draws)
        .doc(submissionId)
        .set({ data: submission });
      await transaction
        .collection(COLLECTIONS.observations)
        .doc(recordId)
        .update({
          data: {
            finalSnapshot,
            ...(finalSnapshot.schemaVersion === "board-record-r2-1.0.0"
              ? { tiers: finalSnapshot.tiers }
              : {}),
            status: "private_saved",
            updatedAt: timestamp,
          },
        });
      await addAudit(transaction, {
        type: "draw.finalized",
        actorAccountId: accountId,
        subjectType: "record",
        subjectId: recordId,
      });
      return response({
        recordId,
        status: "confirmed",
        finalSnapshot,
        idempotent: false,
      });
    });
  };

  const getMyRecords = async (event) => {
    const { accountId } = await accountForCaller();
    const limit = Math.max(1, Math.min(50, Number(event.limit) || 20));
    const result = await db
      .collection(COLLECTIONS.observations)
      .where({ ownerAccountId: accountId })
      .orderBy("updatedAt", "desc")
      .limit(limit)
      .get();
    const records = await Promise.all(
      (result.data || [])
        .filter((record) => record.status !== "deleting")
        .map(async (record) => {
          const sanitized = { ...record };
          delete sanitized.ownerAccountId;
          const version = Number(record.currentVerificationVersion || 0);
          if (version > 0 && record.boardId) {
            const submission = await getDocument(
              db,
              COLLECTIONS.draws,
              `prize-ticket:${record.recordId}:${record.boardId}:${version}`,
            );
            if (submission?.ownerAccountId === accountId) {
              sanitized.latestPrizeTicketSubmission = {
                submissionVersion: version,
                status: submission.status,
                submittedAt:
                  submission.submittedAt || submission.createdAt || null,
                uploadedAt:
                  submission.uploadedAt ||
                  submission.submittedAt ||
                  submission.createdAt ||
                  null,
                completedAt: submission.completedAt || null,
                verifiedAt:
                  submission.verifiedAt ||
                  (submission.status === "VERIFIED"
                    ? submission.completedAt || null
                    : null),
                captureSource: submission.captureSource || null,
                originalEvidenceCapturedAt:
                  submission.capturedAt ||
                  sanitized.originalEvidenceCapturedAt ||
                  null,
                ...((submission.originalEvidenceFileId ||
                  sanitized.originalEvidenceFileId) &&
                submission.imageFileId
                  ? {
                      originalEvidenceFileId:
                        submission.originalEvidenceFileId ||
                        sanitized.originalEvidenceFileId,
                      currentEvidenceFileId: submission.imageFileId,
                    }
                  : {}),
                userNote:
                  typeof submission.userNote === "string"
                    ? submission.userNote
                    : sanitized.userNote || "",
                locationNote:
                  typeof submission.locationNote === "string"
                    ? submission.locationNote
                    : sanitized.locationNote || "",
                finalSnapshot: submission.finalSnapshot || null,
                result: submission.result || null,
                authoritativeDrawReference: {
                  verificationId: submission.verificationId,
                  submissionVersion: version,
                  eventCount: Array.isArray(submission.authoritativeDrawEvents)
                    ? submission.authoritativeDrawEvents.length
                    : 0,
                },
              };
            }
          }
          return sanitized;
        }),
    );
    return response({
      records,
      hasMore: (result.data || []).length === limit,
    });
  };

  const deleteMyRecord = async (event) => {
    const { accountId } = await accountForCaller();
    const recordId = String(event.recordId || "");
    const requestedBoardId = String(event.boardId || "");
    return db.runTransaction(async (transaction) => {
      const record = await getDocument(
        transaction,
        COLLECTIONS.observations,
        recordId,
      );
      const deletionId = `record:${recordId}`;
      const existingDeletion = await getDocument(
        transaction,
        COLLECTIONS.deletions,
        deletionId,
      );
      if (!record) {
        domain.assert(
          existingDeletion?.ownerAccountId === accountId,
          existingDeletion ? "FORBIDDEN" : "RECORD_NOT_FOUND",
        );
        return response({
          deletionId,
          status: existingDeletion.status || "completed",
          idempotent: true,
        });
      }
      domain.assert(record.ownerAccountId === accountId, "FORBIDDEN");
      domain.assert(
        !requestedBoardId || requestedBoardId === record.boardId,
        "RECORD_NOT_FOUND",
      );
      if (record.status === "deleting")
        return response({
          deletionId,
          status: existingDeletion?.status || "pending",
          idempotent: true,
        });
      const timestamp = nowIso(now());
      await transaction
        .collection(COLLECTIONS.observations)
        .doc(recordId)
        .update({
          data: {
            status: "deleting",
            published: false,
            publicationStatus: "deleted",
            deletionRequestedAt: timestamp,
            updatedAt: timestamp,
          },
        });
      await transaction
        .collection(COLLECTIONS.deletions)
        .doc(deletionId)
        .set({
          data: {
            ownerAccountId: accountId,
            targetType: "record",
            targetId: recordId,
            boardId: record.boardId,
            status: "pending",
            requestedAt: timestamp,
            deadlineAt: new Date(now() + 24 * 60 * 60 * 1000).toISOString(),
            nextAttemptAt: timestamp,
            attempts: 0,
          },
        });
      await addAudit(transaction, {
        type: "record.deletion_requested",
        actorAccountId: accountId,
        subjectType: "record",
        subjectId: recordId,
      });
      return response({ deletionId, status: "pending", idempotent: false });
    });
  };

  const deleteMyAccount = async () => {
    const { accountId } = await accountForCaller();
    const timestamp = nowIso(now());
    await db.runTransaction(async (transaction) => {
      const profile = await getDocument(
        transaction,
        COLLECTIONS.profiles,
        accountId,
      );
      await transaction
        .collection(COLLECTIONS.accounts)
        .doc(accountId)
        .update({
          data: {
            status: "deleting",
            deletionRequestedAt: timestamp,
            updatedAt: timestamp,
          },
        });
      await transaction
        .collection(COLLECTIONS.deletions)
        .doc(`account:${accountId}`)
        .set({
          data: {
            ownerAccountId: accountId,
            targetType: "account",
            targetId: accountId,
            status: "pending",
            requestedAt: timestamp,
            deadlineAt: new Date(now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            nextAttemptAt: timestamp,
            attempts: 0,
            ...(typeof profile?.avatarFileId === "string" &&
            profile.avatarFileId
              ? { avatarFileId: profile.avatarFileId }
              : {}),
          },
        });
      await addAudit(transaction, {
        type: "account.deletion_requested",
        actorAccountId: accountId,
        subjectType: "account",
        subjectId: accountId,
      });
    });
    return response({ deletionId: `account:${accountId}`, status: "pending" });
  };

  const assignSpecialIchiId = async (event) => {
    const { accountId } = await accountForCaller();
    const desired = domain.normalizeIchiId(event.desiredIchiId);
    domain.assert(domain.isReservedIchiId(desired), "SPECIAL_ICHI_ID_INVALID");
    return db.runTransaction(async (transaction) => {
      const role = await getDocument(
        transaction,
        COLLECTIONS.roles,
        `${accountId}:id_admin`,
      );
      const founder = await getDocument(
        transaction,
        COLLECTIONS.roles,
        `${accountId}:founder`,
      );
      domain.assert(role?.active || founder?.active, "ADMIN_REQUIRED");
      const targetRegistry = await getDocument(
        transaction,
        COLLECTIONS.ids,
        domain.normalizeIchiId(event.targetIchiId),
      );
      domain.assert(targetRegistry?.accountId, "TARGET_ACCOUNT_NOT_FOUND");
      const desiredRegistry = await getDocument(
        transaction,
        COLLECTIONS.ids,
        desired,
      );
      domain.assert(
        !desiredRegistry || desiredRegistry.state === "reserved",
        "ICHI_ID_UNAVAILABLE",
      );
      const profile = await getDocument(
        transaction,
        COLLECTIONS.profiles,
        targetRegistry.accountId,
      );
      const previous = profile.canonicalIchiId;
      const timestamp = nowIso(now());
      await transaction
        .collection(COLLECTIONS.ids)
        .doc(previous)
        .update({ data: { state: "alias", updatedAt: timestamp } });
      await transaction
        .collection(COLLECTIONS.ids)
        .doc(desired)
        .set({
          data: {
            accountId: targetRegistry.accountId,
            state: "active",
            createdAt: desiredRegistry?.createdAt || timestamp,
            updatedAt: timestamp,
          },
        });
      await transaction
        .collection(COLLECTIONS.profiles)
        .doc(targetRegistry.accountId)
        .update({ data: { canonicalIchiId: desired, updatedAt: timestamp } });
      await addAudit(transaction, {
        type: "ichi_id.assigned",
        actorAccountId: accountId,
        subjectType: "account",
        subjectId: targetRegistry.accountId,
        previousIchiId: previous,
        newIchiId: desired,
      });
      return response({ ichiId: desired, previousIchiId: previous });
    });
  };

  const maintenance = async (action, event) => {
    domain.assert(
      event.Type === "Timer" ||
        event.type === "timer" ||
        (Boolean(env.DEVELOPMENT_MAINTENANCE_TOKEN) &&
          event.__developmentMaintenanceToken ===
            env.DEVELOPMENT_MAINTENANCE_TOKEN),
      "MAINTENANCE_TRIGGER_REQUIRED",
    );
    const timestamp = nowIso(now());
    const _ = db.command;
    if (
      action === "release-stuck-reservations" ||
      action === "reconcile-stuck-jobs"
    ) {
      const statuses =
        action === "release-stuck-reservations"
          ? ["reserved", "recognized"]
          : ["processing"];
      const results = [];
      for (const status of statuses) {
        const result = await db
          .collection(COLLECTIONS.jobs)
          .where({ status, leaseExpiresAt: _.lte(timestamp) })
          .limit(100)
          .get();
        results.push(...(result.data || []));
      }
      let processed = 0;
      for (const job of results) {
        await db.runTransaction(async (transaction) => {
          const current = await getDocument(
            transaction,
            COLLECTIONS.jobs,
            job._id,
          );
          if (
            !current ||
            !statuses.includes(current.status) ||
            current.leaseExpiresAt > timestamp
          )
            return;
          const quota = await getDocument(
            transaction,
            COLLECTIONS.quotas,
            current.quotaId,
          );
          const reservation = quota?.reservations?.[current.keyHash];
          if (reservation?.status === "reserved") {
            reservation.status = "released";
            reservation.releasedAt = timestamp;
            reservation.releaseReason = "lease_expired";
            quota.updatedAt = timestamp;
            await transaction
              .collection(COLLECTIONS.quotas)
              .doc(current.quotaId)
              .set({ data: quota });
          }
          const nextStatus =
            current.status === "recognized" ? "recognized_released" : "expired";
          await transaction
            .collection(COLLECTIONS.jobs)
            .doc(job._id)
            .update({
              data: {
                status: nextStatus,
                errorCode: "LEASE_EXPIRED",
                accessTokenHash: null,
                updatedAt: timestamp,
              },
            });
          await addAudit(transaction, {
            type: "recognition.expired",
            subjectType: "recognitionJob",
            subjectId: job._id,
          });
          processed += 1;
        });
      }
      if (action === "reconcile-stuck-jobs") {
        const cleanupResult = await db
          .collection(COLLECTIONS.deletions)
          .where({
            status: _.in(["pending", "retry"]),
            nextAttemptAt: _.lte(timestamp),
          })
          .limit(50)
          .get();
        for (const deletion of (cleanupResult.data || []).filter(
          (candidate) => candidate.targetType === "storage-object",
        )) {
          try {
            await completeStorageObjectDeletion(deletion, timestamp);
            processed += 1;
          } catch {
            await db
              .collection(COLLECTIONS.deletions)
              .doc(deletion._id)
              .update({
                data: {
                  status: "retry",
                  attempts: _.inc(1),
                  nextAttemptAt: new Date(now() + 60 * 60 * 1000).toISOString(),
                  updatedAt: timestamp,
                },
              });
          }
        }
      }
      return response({
        status: "completed",
        action,
        processed,
        generatedAt: timestamp,
      });
    }
    if (action === "retry-deletions") {
      const result = await db
        .collection(COLLECTIONS.deletions)
        .where({
          status: _.in(["pending", "retry"]),
          nextAttemptAt: _.lte(timestamp),
        })
        .limit(50)
        .get();
      let processed = 0;
      let failed = 0;
      const removeOwned = async (collection, ownerAccountId) => {
        await db
          .collection(collection)
          .where({ ownerAccountId })
          .limit(100)
          .remove();
      };
      for (const deletion of result.data || []) {
        try {
          if (deletion.targetType === "record") {
            const observation = await getDocument(
              db,
              COLLECTIONS.observations,
              deletion.targetId,
            );
            if (observation?.ownerAccountId === deletion.ownerAccountId) {
              const scopedSubmissions = await db
                .collection(COLLECTIONS.draws)
                .where({
                  recordId: deletion.targetId,
                  ownerAccountId: deletion.ownerAccountId,
                })
                .limit(100)
                .get();
              const prizeTicketSubmissions = (
                scopedSubmissions.data || []
              ).filter((submission) =>
                isPrizeTicketSubmission(
                  submission,
                  deletion.targetId,
                  observation.boardId,
                ),
              );
              const evidenceFileIds = new Set(
                prizeTicketSubmissions.flatMap((submission) =>
                  [
                    submission.imageFileId,
                    submission.originalEvidenceFileId,
                  ].filter((fileId) => typeof fileId === "string" && fileId),
                ),
              );
              if (typeof observation.originalEvidenceFileId === "string")
                evidenceFileIds.add(observation.originalEvidenceFileId);
              if (evidenceFileIds.size)
                await cloud.deleteFile({ fileList: [...evidenceFileIds] });
              await Promise.all(
                prizeTicketSubmissions.map((submission) =>
                  db
                    .collection(COLLECTIONS.draws)
                    .doc(submission.verificationId)
                    .remove(),
                ),
              );
              await db
                .collection(COLLECTIONS.observations)
                .doc(deletion.targetId)
                .remove();
            }
          } else if (deletion.targetType === "account") {
            if (typeof deletion.avatarFileId === "string")
              await cloud.deleteFile({
                fileList: [deletion.avatarFileId],
              });
            for (const collection of [
              COLLECTIONS.observations,
              COLLECTIONS.draws,
              COLLECTIONS.jobs,
              COLLECTIONS.codes,
            ])
              await removeOwned(collection, deletion.ownerAccountId);
            await db
              .collection(COLLECTIONS.quotas)
              .where({ accountId: deletion.ownerAccountId })
              .limit(100)
              .remove();
            await db
              .collection(COLLECTIONS.roles)
              .where({ accountId: deletion.ownerAccountId })
              .limit(100)
              .remove();
            await db
              .collection(COLLECTIONS.ids)
              .where({ accountId: deletion.ownerAccountId })
              .update({ data: { state: "retired", updatedAt: timestamp } });
            await db
              .collection(COLLECTIONS.identities)
              .where({ accountId: deletion.ownerAccountId })
              .limit(10)
              .remove();
            await db
              .collection(COLLECTIONS.profiles)
              .doc(deletion.ownerAccountId)
              .remove();
            await db
              .collection(COLLECTIONS.accounts)
              .doc(deletion.ownerAccountId)
              .remove();
          } else if (deletion.targetType === "storage-object") {
            await completeStorageObjectDeletion(deletion, timestamp);
            processed += 1;
            continue;
          }
          await db
            .collection(COLLECTIONS.deletions)
            .doc(deletion._id)
            .update({
              data: {
                status: "completed",
                completedAt: timestamp,
                updatedAt: timestamp,
              },
            });
          processed += 1;
        } catch {
          failed += 1;
          await db
            .collection(COLLECTIONS.deletions)
            .doc(deletion._id)
            .update({
              data: {
                status: "retry",
                attempts: _.inc(1),
                nextAttemptAt: new Date(now() + 60 * 60 * 1000).toISOString(),
                updatedAt: timestamp,
              },
            });
        }
      }
      return response({
        status: "completed",
        action,
        processed,
        failed,
        generatedAt: timestamp,
      });
    }
    if (action === "prepare-v2-backfill") {
      const result = await db
        .collection(COLLECTIONS.observations)
        .where({ v2Eligibility: "pending" })
        .limit(100)
        .get();
      let processed = 0;
      for (const record of result.data || []) {
        const eligible = Boolean(
          record.location &&
          record.initialSnapshot &&
          record.observedAt &&
          record.consentVersion &&
          record.disclosureVersion,
        );
        await db
          .collection(COLLECTIONS.observations)
          .doc(record._id)
          .update({
            data: {
              v2Eligibility: eligible
                ? "eligible_private"
                : "incomplete_private",
              v2EligibilityCheckedAt: timestamp,
              updatedAt: timestamp,
            },
          });
        processed += 1;
      }
      return response({
        status: "private_report_only",
        generatedAt: timestamp,
        processed,
        publicWrites: 0,
      });
    }
    throw new domain.IchiError("FUNCTION_ACTION_UNSUPPORTED");
  };

  const handlers = {
    "bootstrap-account": bootstrapAccount,
    "get-my-profile": getMyProfile,
    "bind-wechat-profile": bindWechatProfile,
    "get-quota-status": getQuotaStatus,
    "reserve-recognition": reserveRecognition,
    "release-recognition": releaseRecognition,
    "get-recognition-job": getRecognitionJob,
    "finalize-board-observation": finalizeObservation,
    "finalize-draw-update": finalizeDrawUpdate,
    "get-my-records": getMyRecords,
    "delete-my-record": deleteMyRecord,
    "delete-my-account": deleteMyAccount,
    "assign-special-ichi-id": assignSpecialIchiId,
  };
  return async (action, event) => {
    try {
      const input = safeEvent(event);
      if (
        [
          "release-stuck-reservations",
          "reconcile-stuck-jobs",
          "retry-deletions",
          "prepare-v2-backfill",
        ].includes(action)
      )
        return await maintenance(action, input);
      domain.assert(handlers[action], "FUNCTION_ACTION_UNSUPPORTED");
      return await handlers[action](input);
    } catch (error) {
      // Only emit an allowlisted diagnostic envelope. Never log the event,
      // runtime context, environment, headers, identity values, or secrets.
      console.error("ICHI_RUNTIME_ERROR", {
        action,
        code: error?.code || "INTERNAL_ERROR",
        platformCode: error?.errCode || null,
        name: error?.name || "Error",
        stackFrames: String(error?.stack || "")
          .split("\n")
          .filter((line) => /^\s*at\s/u.test(line))
          .slice(0, 3),
      });
      return failure(error);
    }
  };
};

const createHandler = (action) => {
  let dispatch;
  return async (event) => {
    if (!dispatch) {
      const cloud = require("wx-server-sdk");
      dispatch = createRuntime({ cloud });
    }
    return dispatch(action, event);
  };
};

module.exports = {
  COLLECTIONS,
  createHandler,
  createRuntime,
  failure,
  recognizedSnapshotSummary,
  stripDatabaseMetadata,
};
