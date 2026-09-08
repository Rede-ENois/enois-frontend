import { useCommunityHeaderController } from "@/utils/components/communities/use-community-header-controller";

import { CommunityHeaderAvatar } from "@/components/community-header-avatar";
import { CommunityHeaderDetails } from "@/components/community-header-details";

export function CommunityHeaderIdentity() {
  const { avatarUrl } = useCommunityHeaderController();

  return (
    <div className="flex min-w-0 items-start gap-4">
      <CommunityHeaderAvatar avatarUrl={avatarUrl} />
      <CommunityHeaderDetails />
    </div>
  );
}
