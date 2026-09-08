import type { CommunityHeaderIdentityProps } from "@/types/components/communities/community-header-identity-props";

export function CommunityHeaderAvatar({
  avatarUrl,
}: Pick<CommunityHeaderIdentityProps, "avatarUrl">) {
  if (!avatarUrl) return null;

  return (
    <img
      src={avatarUrl}
      alt=""
      className="h-16 w-16 shrink-0 rounded-full object-cover ring-4 ring-card"
    />
  );
}
