import { Outlet } from "@tanstack/react-router";

import { useCommunitiesPageController } from "@/utils/components/communities/use-communities-page-controller";

import { AppContainer } from "@/components/app-container";
import { CommunitiesGrid } from "@/components/communities-grid";
import { CommunitiesLoadMore } from "@/components/communities-load-more";
import { CommunitiesPageHeader } from "@/components/communities-page-header";
import { CommunityTopicFilters } from "@/components/community-topic-filters";

export function Comunidades() {
  const communities = useCommunitiesPageController();

  if (communities.isDetail) return <Outlet />;

  return (
    <AppContainer>
      <div className="space-y-6">
        <CommunitiesPageHeader />
        <CommunityTopicFilters options={communities.topicOptions} />
        <CommunitiesGrid
          communities={communities.communities}
          membershipPending={communities.membershipPending}
          onToggleMembership={communities.toggleMembership}
        />
        <CommunitiesLoadMore
          visible={communities.showLoadMore}
          loading={communities.isFetching}
          disabled={communities.loadMoreDisabled}
          onLoadMore={communities.loadMore}
        />
      </div>
    </AppContainer>
  );
}
