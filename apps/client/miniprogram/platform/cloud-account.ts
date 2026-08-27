export interface CloudAccountProfile {
  readonly ichiId: string;
  readonly nickname: string;
  readonly avatarState: string;
  readonly avatarUrl?: string;
  readonly avatarFileId?: string;
  readonly profileState: string;
}

/**
 * Data returned by the supported Mini Program avatar picker.
 *
 * `chooseAvatar` returns a local temporary path (not a durable HTTPS URL).
 * The path is intentionally kept out of the CloudBase function contract;
 * callers pass it through `bindWechatProfileFromSelection`, which uploads it
 * to the private profile avatar area before binding it to the authenticated
 * account.
 */
export interface WechatProfileSelection {
  readonly nickname: string;
  readonly avatarPath: string;
}

export interface WechatProfileMediaAdapter {
  uploadAvatar(filePath: string): Promise<{
    readonly avatarFileId: string;
    readonly avatarUrl?: string;
  }>;
  deleteAvatar?(avatarFileId: string): Promise<void>;
}

export interface WechatAvatarUploadResult {
  readonly avatarFileId?: string;
  readonly avatarUrl?: string;
}

export interface CloudQuotaSummary {
  readonly dateKey: string;
  readonly limit: number;
  readonly used: number;
  readonly reserved: number;
  readonly remaining: number;
  readonly resetAt: string;
}

interface CloudEnvelope<T> {
  readonly ok: boolean;
  readonly data?: T;
  readonly error?: { readonly code?: string };
}

export interface CloudFunctionApi {
  callFunction(options: {
    readonly name: string;
    readonly data?: Record<string, unknown>;
  }): Promise<{ readonly result?: unknown }>;
}

export class CloudAccountError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "CloudAccountError";
  }
}

const classifyCloudInvocationError = (value: unknown): CloudAccountError => {
  if (value instanceof CloudAccountError) return value;
  const source =
    value && typeof value === "object"
      ? (value as { readonly errCode?: unknown; readonly errMsg?: unknown })
      : {};
  const detail = `${String(source.errCode ?? "")} ${String(
    source.errMsg ?? (value instanceof Error ? value.message : ""),
  )}`.toLowerCase();
  if (/network|timeout|timed out|request:fail/u.test(detail)) {
    return new CloudAccountError("CLOUD_NETWORK_FAILED");
  }
  if (/function.*not found|cloud function.*不存在|-501000/u.test(detail)) {
    return new CloudAccountError("CLOUD_FUNCTION_UNAVAILABLE");
  }
  if (/permission|unauthorized|forbidden|auth deny|-50200/u.test(detail)) {
    return new CloudAccountError("CLOUD_PERMISSION_DENIED");
  }
  return new CloudAccountError("CLOUD_CALL_FAILED");
};

const readEnvelope = <T>(value: unknown): T => {
  if (!value || typeof value !== "object") {
    throw new CloudAccountError("INVALID_CLOUD_RESPONSE");
  }
  const envelope = value as CloudEnvelope<T>;
  if (!envelope.ok) {
    throw new CloudAccountError(envelope.error?.code ?? "CLOUD_REQUEST_FAILED");
  }
  if (!envelope.data || typeof envelope.data !== "object") {
    throw new CloudAccountError("INVALID_CLOUD_RESPONSE");
  }
  return envelope.data;
};

export const callCloudFunction = async <T>(
  api: CloudFunctionApi,
  name: string,
  data: Record<string, unknown> = {},
): Promise<T> => {
  try {
    const result = await api.callFunction({ name, data });
    return readEnvelope<T>(result.result);
  } catch (error) {
    throw classifyCloudInvocationError(error);
  }
};

const isProfile = (value: unknown): value is CloudAccountProfile => {
  if (!value || typeof value !== "object") return false;
  const profile = value as Partial<CloudAccountProfile>;
  return (
    typeof profile.ichiId === "string" &&
    /^ICHI-[A-Z0-9]{3,8}$/u.test(profile.ichiId) &&
    typeof profile.nickname === "string" &&
    typeof profile.avatarState === "string" &&
    (profile.avatarUrl === undefined ||
      typeof profile.avatarUrl === "string") &&
    (profile.avatarFileId === undefined ||
      (typeof profile.avatarFileId === "string" &&
        profile.avatarFileId.startsWith("cloud://"))) &&
    typeof profile.profileState === "string"
  );
};

const isHttpsUrl = (value: string): boolean =>
  /^https:\/\/[^\s/]+(?:\/[^\s]*)?$/u.test(value) && value.length <= 1024;

const isTemporaryWechatAvatarPath = (value: string): boolean =>
  value.startsWith("/") || value.startsWith("wxfile://");

export const normalizeWechatNickname = (value: unknown): string => {
  const nickname = typeof value === "string" ? value.trim() : "";
  if (nickname.length < 1 || nickname.length > 32) {
    throw new CloudAccountError("PROFILE_NICKNAME_INVALID");
  }
  return nickname;
};

/**
 * Normalize the result of `bindchooseavatar`/`input type="nickname"`.
 * The old `wx.getUserProfile` result is deliberately not accepted as a
 * special shape: the page supplies the explicit nickname value and avatar
 * path selected by the user.
 */
export const normalizeWechatProfileSelection = (
  value: Partial<WechatProfileSelection> & {
    readonly avatarUrl?: unknown;
  },
): WechatProfileSelection => {
  const nickname = normalizeWechatNickname(value.nickname);
  const avatarPath =
    typeof value.avatarPath === "string"
      ? value.avatarPath.trim()
      : typeof value.avatarUrl === "string"
        ? value.avatarUrl.trim()
        : "";
  if (!avatarPath || avatarPath.startsWith("data:")) {
    throw new CloudAccountError("PROFILE_AVATAR_INVALID");
  }
  if (!isHttpsUrl(avatarPath) && !isTemporaryWechatAvatarPath(avatarPath)) {
    throw new CloudAccountError("PROFILE_AVATAR_INVALID");
  }
  return { nickname, avatarPath };
};

const isAvatarFileId = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length >= 8;

export type WechatProfileBindingInput = {
  readonly nickname: string;
  readonly avatarUrl?: string;
  readonly avatarFileId?: string;
};

export const bindWechatProfile = async (
  api: CloudFunctionApi,
  profile: WechatProfileBindingInput,
): Promise<CloudAccountProfile> => {
  const nickname = normalizeWechatNickname(profile.nickname);
  const avatarUrl = profile.avatarUrl?.trim();
  const avatarFileId = profile.avatarFileId?.trim();
  if (avatarFileId && !isAvatarFileId(avatarFileId)) {
    throw new CloudAccountError("PROFILE_AVATAR_INVALID");
  }
  if (!avatarFileId && (!avatarUrl || !isHttpsUrl(avatarUrl))) {
    throw new CloudAccountError("PROFILE_AVATAR_INVALID");
  }
  const data: WechatProfileBindingInput = {
    nickname,
    ...(avatarFileId ? { avatarFileId } : {}),
    ...(avatarUrl ? { avatarUrl } : {}),
  };
  const result = await callCloudFunction<CloudAccountProfile>(
    api,
    "bind-wechat-profile",
    data,
  );
  if (!isProfile(result)) throw new CloudAccountError("INVALID_CLOUD_RESPONSE");
  return result;
};

/**
 * Bind the explicitly selected avatar and nickname. A local chooseAvatar
 * path is uploaded exactly once and never converted to Base64/Data URL. If
 * the owner-scoped CloudBase bind fails, the newly uploaded object is best
 * effort removed so a rejected profile does not leave an orphan.
 */
export const bindWechatProfileFromSelection = async (
  api: CloudFunctionApi,
  selection: WechatProfileSelection,
  media: WechatProfileMediaAdapter,
): Promise<CloudAccountProfile> => {
  const normalized = normalizeWechatProfileSelection(selection);
  if (isHttpsUrl(normalized.avatarPath)) {
    return bindWechatProfile(api, {
      nickname: normalized.nickname,
      avatarUrl: normalized.avatarPath,
    });
  }

  let upload: WechatAvatarUploadResult;
  try {
    upload = await media.uploadAvatar(normalized.avatarPath);
  } catch {
    throw new CloudAccountError("PROFILE_AVATAR_UPLOAD_FAILED");
  }
  const avatarFileId = upload.avatarFileId?.trim();
  const avatarUrl = upload.avatarUrl?.trim();
  if (!avatarFileId && (!avatarUrl || !isHttpsUrl(avatarUrl))) {
    throw new CloudAccountError("PROFILE_AVATAR_UPLOAD_INVALID");
  }
  try {
    return await bindWechatProfile(api, {
      nickname: normalized.nickname,
      ...(avatarFileId ? { avatarFileId } : {}),
      ...(avatarUrl ? { avatarUrl } : {}),
    });
  } catch (error) {
    if (avatarFileId) {
      let removed = false;
      if (media.deleteAvatar)
        try {
          await media.deleteAvatar(avatarFileId);
          removed = true;
        } catch {
          // Fall through to the durable server cleanup request.
        }
      if (!removed)
        try {
          await callCloudFunction(api, "bind-wechat-profile", {
            action: "cleanup-upload",
            avatarFileId,
          });
        } catch {
          // The scheduled server cleanup must not hide the actionable bind
          // error when the platform is temporarily unavailable.
        }
    }
    throw error;
  }
};

/** Alias used by page adapters that describe the event as a chosen avatar. */
export const bindChosenWechatProfile = bindWechatProfileFromSelection;

const profileAvatarCloudPath = () => {
  const stamp = Date.now().toString(36);
  const random = Math.floor(Math.random() * 0x100000000)
    .toString(36)
    .padStart(7, "0");
  return `profile-avatars/${stamp}-${random}.jpg`;
};

/**
 * Native CloudBase storage adapter for `bindchooseavatar` temporary paths.
 * CloudBase keeps the object private; the server stores the fileID and emits
 * a fresh short-lived URL only when a profile is read.
 */
export const getWxWechatProfileMediaAdapter = (): WechatProfileMediaAdapter => {
  const cloud = (
    wx as unknown as {
      readonly cloud?: {
        readonly uploadFile?: (options: {
          readonly cloudPath: string;
          readonly filePath: string;
        }) => Promise<{ readonly fileID?: unknown }>;
        readonly deleteFile?: (options: {
          readonly fileList: readonly string[];
        }) => Promise<unknown>;
      };
    }
  ).cloud;
  if (!cloud?.uploadFile) {
    throw new CloudAccountError("PROFILE_AVATAR_UPLOAD_UNAVAILABLE");
  }
  const uploadFile = cloud.uploadFile;
  return {
    async uploadAvatar(filePath) {
      try {
        const result = await uploadFile({
          cloudPath: profileAvatarCloudPath(),
          filePath,
        });
        if (!isAvatarFileId(result.fileID)) {
          throw new Error("missing avatar fileID");
        }
        return { avatarFileId: result.fileID };
      } catch {
        throw new CloudAccountError("PROFILE_AVATAR_UPLOAD_FAILED");
      }
    },
    ...(cloud.deleteFile
      ? {
          async deleteAvatar(avatarFileId: string) {
            await cloud.deleteFile?.({ fileList: [avatarFileId] });
          },
        }
      : {}),
  };
};

export const getWxWechatProfileMedia = getWxWechatProfileMediaAdapter;

const isSafeNonNegativeInteger = (value: unknown): value is number =>
  Number.isSafeInteger(value) && Number(value) >= 0;

export const isCloudQuotaSummary = (
  value: unknown,
): value is CloudQuotaSummary => {
  if (!value || typeof value !== "object") return false;
  const quota = value as Partial<CloudQuotaSummary>;
  return (
    typeof quota.dateKey === "string" &&
    isSafeNonNegativeInteger(quota.limit) &&
    isSafeNonNegativeInteger(quota.used) &&
    isSafeNonNegativeInteger(quota.reserved) &&
    isSafeNonNegativeInteger(quota.remaining) &&
    typeof quota.resetAt === "string" &&
    quota.used + quota.reserved <= quota.limit &&
    quota.remaining === quota.limit - quota.used - quota.reserved
  );
};

export const parseCloudQuotaSummary = (value: unknown): CloudQuotaSummary => {
  if (!isCloudQuotaSummary(value)) {
    throw new CloudAccountError("INVALID_CLOUD_RESPONSE");
  }
  return value;
};

export const loadCloudAccount = async (
  api: CloudFunctionApi,
): Promise<{
  readonly profile: CloudAccountProfile;
  readonly quota: CloudQuotaSummary;
}> => {
  await callCloudFunction(api, "bootstrap-account");
  const [profile, quota] = await Promise.all([
    callCloudFunction<CloudAccountProfile>(api, "get-my-profile"),
    callCloudFunction<CloudQuotaSummary>(api, "get-quota-status"),
  ]);
  if (!isProfile(profile) || !isCloudQuotaSummary(quota)) {
    throw new CloudAccountError("INVALID_CLOUD_RESPONSE");
  }
  return { profile, quota };
};

/**
 * Refresh only the server-authoritative quota snapshot.
 *
 * This is intentionally separate from `loadCloudAccount`: the frozen-photo
 * confirmation path must not reserve (or otherwise mutate) quota merely to
 * open the correction editor. Account bootstrap and profile reads happen at
 * the entry gate; this helper is the read-only availability check performed
 * immediately before routing to the correction page.
 */
export const refreshCloudQuota = async (
  api: CloudFunctionApi,
): Promise<CloudQuotaSummary> =>
  parseCloudQuotaSummary(
    await callCloudFunction<CloudQuotaSummary>(api, "get-quota-status"),
  );

export const getWxCloudFunctionApi = (): CloudFunctionApi => {
  const cloud = (wx as unknown as { cloud?: CloudFunctionApi }).cloud;
  if (!cloud?.callFunction) throw new CloudAccountError("CLOUD_UNAVAILABLE");
  return cloud;
};

export const quotaUsedPercent = (quota: CloudQuotaSummary): number =>
  quota.limit > 0
    ? Math.min(
        100,
        Math.round(((quota.used + quota.reserved) / quota.limit) * 100),
      )
    : 100;
