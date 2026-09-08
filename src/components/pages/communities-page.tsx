import { Outlet } from "@tanstack/react-router";

import { useCommunitiesPageContext } from "@/utils/components/communities/use-communities-page-context";

import { AppContainer } from "@/components/app-container";
import { CommunitiesGrid } from "@/components/communities-grid";
import { CommunitiesLoadMore } from "@/components/communities-load-more";
import { CommunitiesPageHeader } from "@/components/communities-page-header";
import { CommunityTopicFilters } from "@/components/community-topic-filters";

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
