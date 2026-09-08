import { CommunityHeaderActions } from "@/components/communities/community-header-actions";
import { CommunityHeaderIdentity } from "@/components/communities/community-header-identity";
import { CommunityHeaderMedia } from "@/components/communities/community-header-media";

export function CommunityHeader() {
  return (
    <div className="surface-card overflow-hidden">
      <CommunityHeaderMedia />

      <div className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <CommunityHeaderIdentity />
          <CommunityHeaderActions />
        </div>
      </div>
    </div>
  );
}
