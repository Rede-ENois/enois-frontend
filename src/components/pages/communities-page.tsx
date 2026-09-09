import { Outlet } from "@tanstack/react-router";

import { useCommunitiesPageContext } from "@/utils/communities/use-communities-page-context";

import { AppContainer } from "@/components/layout/app-container";
import { CommunitiesGrid } from "@/components/communities/communities-grid";
import { CommunitiesLoadMore } from "@/components/communities/communities-load-more";
import { CommunitiesPageHeader } from "@/components/communities/communities-page-header";
import { CommunityTopicFilters } from "@/components/communities/community-topic-filters";

export function Comunidades() {
  const { isDetail } = useCommunitiesPageContext();

  if (isDetail) return <Outlet />;

  return (
    <AppContainer>
      <div className="space-y-6">
        <CommunitiesPageHeader />
        <CommunityTopicFilters />
        <CommunitiesGrid />
        <CommunitiesLoadMore />
      </div>
    </AppContainer>
  );
}
