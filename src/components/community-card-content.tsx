import { CommunityCardDescription } from "@/components/community-card-description";
import { CommunityCardFooter } from "@/components/community-card-footer";
import { CommunityCardIdentity } from "@/components/community-card-identity";

export function CommunityCardContent() {
  return (
    <div className="p-5">
      <CommunityCardIdentity />
      <CommunityCardDescription />
      <CommunityCardFooter />
    </div>
  );
}
