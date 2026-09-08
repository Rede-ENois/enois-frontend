import { useCommunityDetailPageController } from "@/utils/components/communities/use-community-detail-page-controller";

import { AppContainer } from "@/components/app-container";
import { CommunityComposer } from "@/components/community-composer";
import { CommunityDetailBackLink } from "@/components/community-detail-back-link";
import { CommunityFeed } from "@/components/community-feed";
import { CommunityHeader } from "@/components/community-header";
import { CommunityMembers } from "@/components/community-members";

export function CommunityDetail() {
  const { community, members, posts, showComposer, showEmptyState, emptyMessage } =
    useCommunityDetailPageController();

  return (
    <AppContainer>
      <div className="space-y-6">
        <CommunityDetailBackLink />
        <CommunityHeader community={community} members={members} />
        {showComposer && <CommunityComposer communityId={community.id} />}

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <CommunityFeed
            posts={posts}
            showEmptyState={showEmptyState}
            emptyMessage={emptyMessage}
          />
          <CommunityMembers members={members} />
        </div>
      </div>
    </AppContainer>
  );
}
