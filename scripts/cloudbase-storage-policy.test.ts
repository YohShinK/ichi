import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const resources = JSON.parse(
  readFileSync("services/cloudbase/database/resources.json", "utf8"),
);

const owner = "owner-openid";
const other = "other-openid";

const clientAccess = ({
  operation,
  path,
  creator = owner,
  openid = owner,
}: {
  operation: "read" | "write";
  path: string;
  creator?: string;
  openid?: string | null;
}) => {
  if (!openid) return false;
  const isOwner = creator === openid;
  if (operation === "read")
    return path.startsWith("profile-avatars/") && isOwner;
  return (
    isOwner &&
    (path.startsWith("profile-avatars/") ||
      path.startsWith("recognition-temp/"))
  );
};

describe("V1 CloudBase Storage security policy", () => {
  it("freezes the production custom-rule source", () => {
    expect(resources.storageSecurityRule).toMatchObject({
      targetCustomRule: {
        read: "auth != null && /^profile-avatars\\//.test(resource.path) && resource.openid == auth.openid",
        write:
          "auth != null && auth.loginType != 'ANONYMOUS' && resource.openid == auth.openid && (/^profile-avatars\\//.test(resource.path) || /^recognition-temp\\//.test(resource.path))",
      },
      deployment: {
        state: "DEPLOYED_READ_BACK_VERIFIED",
        actualAcl: "CUSTOM",
      },
    });
  });

  it.each([
    ["owner avatar read", "read", "profile-avatars/me.jpg", owner, true],
    ["other avatar read", "read", "profile-avatars/me.jpg", other, false],
    ["owner avatar write", "write", "profile-avatars/me.jpg", owner, true],
    ["other avatar write", "write", "profile-avatars/me.jpg", other, false],
    [
      "owner temp upload/delete",
      "write",
      "recognition-temp/me.jpg",
      owner,
      true,
    ],
    ["other temp write", "write", "recognition-temp/me.jpg", other, false],
    ["owner temp read", "read", "recognition-temp/me.jpg", owner, false],
    ["other temp read", "read", "recognition-temp/me.jpg", other, false],
    ["unknown read", "read", "uploads/me.jpg", owner, false],
    ["unknown write", "write", "uploads/me.jpg", owner, false],
  ] as const)("enforces %s", (_name, operation, path, openid, allowed) => {
    expect(clientAccess({ operation, path, openid })).toBe(allowed);
  });

  it("keeps server access outside client-rule evaluation", () => {
    expect(resources.storageSecurityRule.deployment.serverBypassVerified).toBe(
      true,
    );
  });

  it("limits platform expiration to recognition-temp", () => {
    expect(resources.storageLifecycleEnforcement).toMatchObject({
      mode: "PLATFORM_LIFECYCLE",
      prefix: "recognition-temp/",
      expirationDays: 1,
      profileAvatarsExcluded: true,
      remainingGap: null,
    });
    expect("recognition-temp/example.jpg").toMatch(/^recognition-temp\//u);
    expect("profile-avatars/example.jpg").not.toMatch(/^recognition-temp\//u);
  });
});
