import type { CommunityHeaderMediaProps } from "@/types/components/communities/community-header-media-props";

export function CommunityHeaderMedia({ coverUrl }: CommunityHeaderMediaProps) {
  return coverUrl ? (
    <img src={coverUrl} alt="" className="h-48 w-full object-cover" />
  ) : (
    <div className="h-48 w-full bg-gradient-to-br from-primary/20 to-primary/5" />
  );
}
