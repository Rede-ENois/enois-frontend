import { CommunityHeaderAvatar } from "@/components/communities/community-header-avatar";
import { CommunityHeaderDetails } from "@/components/communities/community-header-details";

export function CommunityHeaderIdentity() {
  return (
    <div className="flex min-w-0 items-start gap-4">
      <CommunityHeaderAvatar />
      <CommunityHeaderDetails />
    </div>
  );
}
