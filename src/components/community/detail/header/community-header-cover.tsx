import { resolveCdnUrl } from "@/lib/api/media";
import type { CommunityHeaderCoverProps } from "@/types/components/community/community-header-cover-props";

export function CommunityHeaderCover({ community }: CommunityHeaderCoverProps) {
  return community.cover ? <img src={resolveCdnUrl(community.cover)} alt="" className="h-48 w-full object-cover" /> : <div className="h-48 w-full bg-gradient-to-br from-primary/20 to-primary/5" />;
}
