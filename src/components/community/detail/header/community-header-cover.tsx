import type { Community } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";

export function CommunityHeaderCover({ community }: { community: Community }) {
  return community.cover ? (
    <img src={resolveCdnUrl(community.cover)} alt="" className="h-48 w-full object-cover" />
  ) : (
    <div className="h-48 w-full bg-gradient-to-br from-primary/20 to-primary/5" />
  );
}
