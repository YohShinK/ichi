import { describe, expect, it, vi } from "vitest";

import {
  bindWechatProfileFromSelection,
  bindWechatProfile,
  callCloudFunction,
  CloudAccountError,
  loadCloudAccount,
  normalizeWechatNickname,
  normalizeWechatProfileSelection,
  quotaUsedPercent,
  refreshCloudQuota,
  type CloudFunctionApi,
} from "./cloud-account.js";

const responses: Record<string, unknown> = {
  "bootstrap-account": {
    ok: true,
    data: {
      ichiId: "ICHI-001",
      nickname: "ICHI 玩家",
      profileState: "incomplete",
      created: false,
    },
  },
  "get-my-profile": {
    ok: true,
    data: {
      ichiId: "ICHI-001",
      nickname: "ICHI 玩家",
      avatarState: "default",
      profileState: "incomplete",
    },
  },
  "get-quota-status": {
    ok: true,
    data: {
      dateKey: "2026-08-19",
      limit: 5,
      used: 0,
      reserved: 0,
      remaining: 5,
      resetAt: "2026-08-19T16:00:00.000Z",
    },
  },
};

describe("cloud account adapter", () => {
  it("bootstraps identity before reading profile and authoritative quota", async () => {
    const callFunction = vi.fn(async ({ name }: { name: string }) => ({
      result: responses[name],
    }));
    const result = await loadCloudAccount({ callFunction } as CloudFunctionApi);
    expect(callFunction.mock.calls.map(([input]) => input.name)).toEqual([
      "bootstrap-account",
      "get-my-profile",
      "get-quota-status",
    ]);
    expect(result.profile.ichiId).toBe("ICHI-001");
    expect(result.quota.remaining).toBe(5);
    expect(quotaUsedPercent(result.quota)).toBe(0);
  });

  it("accepts the private avatar fileID when no temporary HTTPS URL is minted", async () => {
    const avatarFileId =
      "cloud://test-env/profile-avatars/persisted-avatar.jpg";
    const callFunction = vi.fn(async ({ name }: { name: string }) => ({
      result:
        name === "get-my-profile"
          ? {
              ok: true,
              data: {
                ichiId: "ICHI-001",
                nickname: "微信玩家",
                avatarState: "wechat-authorized",
                avatarFileId,
                profileState: "complete",
              },
            }
          : responses[name],
    }));

    const result = await loadCloudAccount({
      callFunction,
    } as CloudFunctionApi);
    expect(result.profile).toMatchObject({
      nickname: "微信玩家",
      avatarFileId,
      profileState: "complete",
    });
    expect(result.profile.avatarUrl).toBeUndefined();
  });

  it("does not accept a failed or malformed server envelope", async () => {
    const callFunction = vi.fn(async () => ({
      result: { ok: false, error: { code: "ACCOUNT_REQUIRED" } },
    }));
    await expect(
      loadCloudAccount({ callFunction } as CloudFunctionApi),
    ).rejects.toEqual(new CloudAccountError("ACCOUNT_REQUIRED"));
  });

  it("refreshes read-only quota without bootstrapping or reserving a job", async () => {
    const callFunction = vi.fn(async ({ name }: { name: string }) => ({
      result: responses[name],
    }));

    await expect(
      refreshCloudQuota({ callFunction } as CloudFunctionApi),
    ).resolves.toMatchObject({ remaining: 5 });
    expect(callFunction).toHaveBeenCalledTimes(1);
    expect(callFunction).toHaveBeenCalledWith({
      name: "get-quota-status",
      data: {},
    });
    expect(
      callFunction.mock.calls.some(
        ([request]) =>
          request.name === "reserve-recognition" ||
          request.name === "bootstrap-account",
      ),
    ).toBe(false);
  });

  it("rejects an arithmetically inconsistent authoritative quota summary", async () => {
    const callFunction = vi.fn(async ({ name }: { name: string }) => ({
      result:
        name === "get-quota-status"
          ? {
              ok: true,
              data: {
                dateKey: "2026-08-19",
                limit: 5,
                used: 2,
                reserved: 1,
                remaining: 5,
                resetAt: "2026-08-19T16:00:00.000Z",
              },
            }
          : responses[name],
    }));
    await expect(
      loadCloudAccount({ callFunction } as CloudFunctionApi),
    ).rejects.toEqual(new CloudAccountError("INVALID_CLOUD_RESPONSE"));
  });

  it("classifies native cloud invocation failures without exposing provider text", async () => {
    const callFunction = vi.fn(async () => {
      throw { errCode: -1, errMsg: "request:fail timeout sensitive detail" };
    });
    await expect(
      callCloudFunction({ callFunction } as CloudFunctionApi, "example"),
    ).rejects.toEqual(new CloudAccountError("CLOUD_NETWORK_FAILED"));
  });

  it("includes reservations in the displayed consumption ring", () => {
    expect(
      quotaUsedPercent({
        dateKey: "2026-08-19",
        limit: 5,
        used: 2,
        reserved: 1,
        remaining: 2,
        resetAt: "2026-08-19T16:00:00.000Z",
      }),
    ).toBe(60);
  });

  it("rejects unsafe quota counters instead of rounding their arithmetic", async () => {
    const callFunction = vi.fn(async ({ name }: { name: string }) => ({
      result:
        name === "get-quota-status"
          ? {
              ok: true,
              data: {
                dateKey: "2026-08-19",
                limit: Number.MAX_SAFE_INTEGER + 1,
                used: 0,
                reserved: 0,
                remaining: Number.MAX_SAFE_INTEGER + 1,
                resetAt: "2026-08-19T16:00:00.000Z",
              },
            }
          : responses[name],
    }));
    await expect(
      loadCloudAccount({ callFunction } as CloudFunctionApi),
    ).rejects.toEqual(new CloudAccountError("INVALID_CLOUD_RESPONSE"));
  });

  it("binds the authorized WeChat avatar and nickname through the owner-scoped function", async () => {
    const callFunction = vi.fn(async () => ({
      result: {
        ok: true,
        data: {
          ichiId: "ICHI-001",
          nickname: "创始玩家",
          avatarState: "wechat-bound",
          avatarUrl: "https://thirdwx.qlogo.cn/avatar",
          profileState: "complete",
        },
      },
    }));

    await expect(
      bindWechatProfile({ callFunction } as CloudFunctionApi, {
        nickname: "创始玩家",
        avatarUrl: "https://thirdwx.qlogo.cn/avatar",
      }),
    ).resolves.toMatchObject({
      ichiId: "ICHI-001",
      nickname: "创始玩家",
      profileState: "complete",
    });
    expect(callFunction).toHaveBeenCalledWith({
      name: "bind-wechat-profile",
      data: {
        nickname: "创始玩家",
        avatarUrl: "https://thirdwx.qlogo.cn/avatar",
      },
    });
  });

  it("normalizes explicit nickname and chooseAvatar paths without accepting Base64", () => {
    expect(
      normalizeWechatProfileSelection({
        nickname: "  新玩家  ",
        avatarPath: "/tmp/avatar.jpg",
      }),
    ).toEqual({ nickname: "新玩家", avatarPath: "/tmp/avatar.jpg" });
    expect(
      normalizeWechatProfileSelection({
        nickname: "新玩家",
        avatarPath: "https://thirdwx.qlogo.cn/avatar",
      }),
    ).toEqual({
      nickname: "新玩家",
      avatarPath: "https://thirdwx.qlogo.cn/avatar",
    });
    expect(() => normalizeWechatNickname(" ")).toThrow(
      new CloudAccountError("PROFILE_NICKNAME_INVALID"),
    );
    expect(() =>
      normalizeWechatProfileSelection({
        nickname: "新玩家",
        avatarPath: "data:image/png;base64,not-allowed",
      }),
    ).toThrow(new CloudAccountError("PROFILE_AVATAR_INVALID"));
  });

  it("uploads a temporary chooseAvatar path once, binds its fileID, and cleans up a rejected bind", async () => {
    const callFunction = vi.fn(async () => ({
      result: {
        ok: false,
        error: { code: "PROFILE_ALREADY_BOUND" },
      },
    }));
    const uploadAvatar = vi.fn(async () => ({
      avatarFileId: "cloud://private/profile-avatars/avatar-1.jpg",
    }));
    const deleteAvatar = vi.fn(async () => undefined);
    await expect(
      bindWechatProfileFromSelection(
        { callFunction } as CloudFunctionApi,
        { nickname: "新玩家", avatarPath: "/tmp/avatar.jpg" },
        { uploadAvatar, deleteAvatar },
      ),
    ).rejects.toEqual(new CloudAccountError("PROFILE_ALREADY_BOUND"));
    expect(uploadAvatar).toHaveBeenCalledWith("/tmp/avatar.jpg");
    expect(callFunction).toHaveBeenCalledWith({
      name: "bind-wechat-profile",
      data: {
        nickname: "新玩家",
        avatarFileId: "cloud://private/profile-avatars/avatar-1.jpg",
      },
    });
    expect(deleteAvatar).toHaveBeenCalledWith(
      "cloud://private/profile-avatars/avatar-1.jpg",
    );
  });

  it("falls back to durable server cleanup when direct rejected-avatar deletion fails", async () => {
    const callFunction = vi.fn(
      async ({ data }: { data: Record<string, unknown> }) => ({
        result:
          data.action === "cleanup-upload"
            ? { ok: true, data: { status: "pending" } }
            : { ok: false, error: { code: "PROFILE_NICKNAME_REVIEW_FAILED" } },
      }),
    );
    const avatarFileId = "cloud://private/profile-avatars/rejected-avatar.jpg";
    await expect(
      bindWechatProfileFromSelection(
        { callFunction } as CloudFunctionApi,
        { nickname: "拒绝昵称", avatarPath: "/tmp/avatar.jpg" },
        {
          uploadAvatar: async () => ({ avatarFileId }),
          deleteAvatar: async () => {
            throw new Error("temporary storage failure");
          },
        },
      ),
    ).rejects.toEqual(new CloudAccountError("PROFILE_NICKNAME_REVIEW_FAILED"));
    expect(callFunction).toHaveBeenLastCalledWith({
      name: "bind-wechat-profile",
      data: { action: "cleanup-upload", avatarFileId },
    });
  });

  it("binds an explicit HTTPS avatar without invoking storage or location APIs", async () => {
    const callFunction = vi.fn(async () => ({
      result: {
        ok: true,
        data: {
          ichiId: "ICHI-001",
          nickname: "新玩家",
          avatarState: "wechat-authorized",
          avatarUrl: "https://thirdwx.qlogo.cn/avatar",
          profileState: "complete",
        },
      },
    }));
    const uploadAvatar = vi.fn();
    await expect(
      bindWechatProfileFromSelection(
        { callFunction } as CloudFunctionApi,
        {
          nickname: "新玩家",
          avatarPath: "https://thirdwx.qlogo.cn/avatar",
        },
        { uploadAvatar },
      ),
    ).resolves.toMatchObject({ profileState: "complete" });
    expect(uploadAvatar).not.toHaveBeenCalled();
  });

  it("keeps the server-returned profile as the immediate page update seam", async () => {
    const profile = {
      ichiId: "ICHI-001",
      nickname: "新玩家",
      avatarState: "wechat-authorized",
      avatarUrl: "https://cdn.example/avatar-2.jpg",
      profileState: "complete",
    };
    const callFunction = vi.fn(async ({ name }: { name: string }) => ({
      result:
        name === "bind-wechat-profile"
          ? { ok: true, data: profile }
          : { ok: true, data: profile },
    }));
    const result = await bindWechatProfileFromSelection(
      { callFunction } as CloudFunctionApi,
      { nickname: "新玩家", avatarPath: "/tmp/avatar.jpg" },
      {
        uploadAvatar: async () => ({
          avatarFileId: "cloud://private/profile-avatars/avatar-2.jpg",
        }),
      },
    );
    expect(result).toEqual(profile);
  });
});
