import { describe, expect, it } from "vitest";
import { projectPublicContributor } from "./avatar-projection.js";

const profile = {
  accountId: "account-a",
  profileVersion: "v1",
  lifecycle: "ACTIVE" as const,
  displayName: "玩家",
  displayNameSafetyPassed: true,
  avatarFileId: "cloud://env/profile-avatars/private.png",
};
const policy = {
  allowedSignedUrlOrigins: ["https://avatar.example.test"],
  maxAgeSeconds: 300,
};
const now = Date.parse("2026-09-24T00:00:00.000Z");

describe("TASK-V2-18 signed avatar weak-network fallback", () => {
  it("falls back on issuer failure or expiry and accepts a later valid projection", () => {
    const unavailable = projectPublicContributor(
      profile,
      true,
      {
        issue: () => {
          throw new Error("private signer error");
        },
      },
      policy,
      now,
    );
    expect(unavailable?.avatar).toMatchObject({ kind: "FALLBACK_ASSET" });
    const expired = projectPublicContributor(
      profile,
      true,
      {
        issue: () => ({
          url: "https://avatar.example.test/signed",
          expiresAt: "2026-09-23T23:59:59.000Z",
        }),
      },
      policy,
      now,
    );
    expect(expired?.avatar).toMatchObject({ kind: "FALLBACK_ASSET" });
    const recovered = projectPublicContributor(
      profile,
      true,
      {
        issue: () => ({
          url: "https://avatar.example.test/signed",
          expiresAt: "2026-09-24T00:05:00.000Z",
        }),
      },
      policy,
      now,
    );
    expect(recovered?.avatar).toMatchObject({ kind: "PUBLIC_URL" });
  });
});
