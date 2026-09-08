import type { CommunityHeaderIdentityProps } from "@/types/components/communities/community-header-identity-props";

import { CommunityHeaderAvatar } from "@/components/community-header-avatar";
import { CommunityHeaderDetails } from "@/components/community-header-details";

export function CommunityHeaderIdentity(props: CommunityHeaderIdentityProps) {
  return (
    <div className="flex min-w-0 items-start gap-4">
      <CommunityHeaderAvatar avatarUrl={props.avatarUrl} />
      <CommunityHeaderDetails community={props.community} primaryAdmin={props.primaryAdmin} />
    </div>
  );
}
