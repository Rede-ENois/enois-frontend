import { CommunityCardDescription } from "@/components/communities/community-card-description";
import { CommunityCardFooter } from "@/components/communities/community-card-footer";
import { CommunityCardIdentity } from "@/components/communities/community-card-identity";

export function CommunityCardContent() {
  return (
    <div className="p-5">
      <CommunityCardIdentity />
      <CommunityCardDescription />
      <CommunityCardFooter />
    </div>
  );
}
