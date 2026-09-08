import type { CommunityHeaderAvatarProps } from "@/types/components/communities/community-header-avatar-props";

export function CommunityHeaderAvatar({ avatarUrl }: CommunityHeaderAvatarProps) {
  if (!avatarUrl) return null;

  return (
    <img
      src={avatarUrl}
      alt=""
      className="h-16 w-16 shrink-0 rounded-full object-cover ring-4 ring-card"
    />
  );
}
