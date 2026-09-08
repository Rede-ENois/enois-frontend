import { useCommunityDetailContext } from "@/utils/components/communities/use-community-detail-context";

import { AppContainer } from "@/components/app-container";
import { CommunityComposer } from "@/components/community-composer";
import { CommunityDetailBackLink } from "@/components/community-detail-back-link";
import { CommunityFeed } from "@/components/community-feed";
import { CommunityHeader } from "@/components/community-header";
import { CommunityMembers } from "@/components/community-members";

export function CommunityDetail() {
  const { showComposer } = useCommunityDetailContext();

  return (
    <AppContainer>
      <div className="space-y-6">
        <CommunityDetailBackLink />
        <CommunityHeader />
        {showComposer && <CommunityComposer />}

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <CommunityFeed />
          <CommunityMembers />
        </div>
      </div>
    </AppContainer>
  );
}
