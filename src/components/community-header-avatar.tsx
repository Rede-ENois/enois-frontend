import { useCommunityHeaderContext } from "@/utils/components/communities/use-community-header-context";

export function CommunityHeaderAvatar() {
  const { avatarUrl } = useCommunityHeaderContext();

  if (!avatarUrl) return null;

  return (
    <img
      src={avatarUrl}
      alt=""
      className="h-16 w-16 shrink-0 rounded-full object-cover ring-4 ring-card"
    />
  );
}
