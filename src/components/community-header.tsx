import { useCommunityHeaderController } from "@/utils/components/communities/use-community-header-controller";

import { CommunityHeaderActions } from "@/components/community-header-actions";
import { CommunityHeaderIdentity } from "@/components/community-header-identity";
import { CommunityHeaderMedia } from "@/components/community-header-media";

export function CommunityHeader() {
  const { coverUrl } = useCommunityHeaderController();

  return (
    <div className="surface-card overflow-hidden">
      <CommunityHeaderMedia coverUrl={coverUrl} />

      <div className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <CommunityHeaderIdentity />
          <CommunityHeaderActions />
        </div>
      </div>
    </div>
  );
}
