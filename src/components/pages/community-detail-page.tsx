import { useCommunityDetailContext } from "@/utils/components/communities/use-community-detail-context";

import { AppContainer } from "@/components/app-container";
import { CommunityComposerProvider } from "@/components/community-composer-provider";
import { CommunityDetailBackLink } from "@/components/community-detail-back-link";
import { CommunityFeed } from "@/components/community-feed";
import { CommunityHeaderProvider } from "@/components/community-header-provider";
import { CommunityMembers } from "@/components/community-members";

export function CommunityDetail() {
  const { showComposer } = useCommunityDetailContext();

  return (
    <AppContainer>
      <div className="space-y-6">
        <CommunityDetailBackLink />
        <CommunityHeaderProvider />
        {showComposer && <CommunityComposerProvider />}

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <CommunityFeed />
          <CommunityMembers />
        </div>
      </div>
    </AppContainer>
  );
}
