export const ICHI_FALLBACK_AVATAR = "/assets/v1-29/ichi-avatar.png" as const;
const PUBLIC_CONTRIBUTOR_PROJECTION = Symbol("PublicContributorProjection");

export interface TrustedContributorProfile {
  readonly accountId: string;
  readonly profileVersion: string;
  readonly lifecycle: "ACTIVE" | "DELETED";
  readonly displayName: string | null;
  readonly displayNameSafetyPassed: boolean;
  readonly avatarFileId: string | null;
  /** V1 compatibility only. Never treated as a public trust assertion. */
  readonly legacyAvatarUrl?: string | null;
}

export interface PrivateAvatarUrlIssuer {
  issue(input: {
    readonly trustedAccountId: string;
    readonly privateAvatarFileId: string;
    readonly maxAgeSeconds: number;
  }): {
    readonly url: string;
    readonly expiresAt: string;
  } | null;
}

export interface PublicContributorView {
  readonly displayName: string;
  readonly avatar:
    | { readonly kind: "PUBLIC_URL"; readonly url: string }
    | {
        readonly kind: "FALLBACK_ASSET";
        readonly path: typeof ICHI_FALLBACK_AVATAR;
      };
}

export interface PublicContributor extends PublicContributorView {
  readonly [PUBLIC_CONTRIBUTOR_PROJECTION]: true;
}

export interface PublicAvatarProjectionPolicy {
  readonly allowedSignedUrlOrigins: readonly string[];
  readonly maxAgeSeconds: number;
}

const trustedProjection = (
  value: Omit<PublicContributor, typeof PUBLIC_CONTRIBUTOR_PROJECTION>,
): PublicContributor =>
  Object.defineProperty(value, PUBLIC_CONTRIBUTOR_PROJECTION, {
    value: true,
    enumerable: false,
  }) as PublicContributor;

const fallback = (displayName: string): PublicContributor =>
  trustedProjection({
    displayName,
    avatar: { kind: "FALLBACK_ASSET", path: ICHI_FALLBACK_AVATAR },
  });

export const isPublicContributor = (
  value: unknown,
): value is PublicContributor =>
  typeof value === "object" &&
  value !== null &&
  (value as Partial<PublicContributor>)[PUBLIC_CONTRIBUTOR_PROJECTION] === true;

const validPrivateAvatarRef = (value: string): boolean =>
  value.startsWith("cloud://") && /(?:^|\/)profile-avatars\//u.test(value);

export const projectPublicContributor = (
  profile: TrustedContributorProfile,
  authorizationIncludesProfile: boolean,
  issuer: PrivateAvatarUrlIssuer,
  policy: PublicAvatarProjectionPolicy,
  nowMs: number,
): PublicContributor | null => {
  if (!authorizationIncludesProfile) return null;
  const displayName =
    profile.displayNameSafetyPassed && profile.displayName?.trim()
      ? profile.displayName.trim()
      : "ICHI 玩家";
  if (
    profile.lifecycle !== "ACTIVE" ||
    profile.accountId.trim().length === 0 ||
    !profile.avatarFileId ||
    !validPrivateAvatarRef(profile.avatarFileId)
  ) {
    return fallback(displayName);
  }

  let issued: ReturnType<PrivateAvatarUrlIssuer["issue"]>;
  try {
    issued = issuer.issue({
      trustedAccountId: profile.accountId,
      privateAvatarFileId: profile.avatarFileId,
      maxAgeSeconds: policy.maxAgeSeconds,
    });
  } catch {
    return fallback(displayName);
  }
  if (!issued || Date.parse(issued.expiresAt) <= nowMs) {
    return fallback(displayName);
  }
  try {
    const url = new URL(issued.url);
    if (
      url.protocol !== "https:" ||
      url.username.length > 0 ||
      url.password.length > 0 ||
      url.hash.length > 0 ||
      !policy.allowedSignedUrlOrigins.includes(url.origin)
    ) {
      return fallback(displayName);
    }
  } catch {
    return fallback(displayName);
  }
  return trustedProjection({
    displayName,
    avatar: { kind: "PUBLIC_URL", url: issued.url },
  });
};
