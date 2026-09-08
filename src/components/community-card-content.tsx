import type { CommunityCardContentProps } from "@/types/components/communities/community-card-content-props";

import { CommunityCardDescription } from "@/components/community-card-description";
import { CommunityCardFooter } from "@/components/community-card-footer";
import { CommunityCardIdentity } from "@/components/community-card-identity";

export function CommunityCardContent({
  community,
  avatarUrl,
  membershipAction,
}: CommunityCardContentProps) {
  return (
    <div className="p-5">
      <CommunityCardIdentity community={community} avatarUrl={avatarUrl} />
      <CommunityCardDescription description={community.description} />
      <CommunityCardFooter members={community.members ?? 0} membershipAction={membershipAction} />
    </div>
  );
}
