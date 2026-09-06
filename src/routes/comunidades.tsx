import { useEffect, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Outlet, createFileRoute, useMatchRoute } from "@tanstack/react-router";

import { communityApi } from "@/lib/api";
import type { Community } from "@/lib/api";
import { requireAuth } from "@/lib/require-auth";
import { texts } from "@/texts";
import type { CommunityTopic } from "@/types/components/community/community-topic";
import { mergeUniquePage } from "@/utils/collections";

import { AppContainer } from "@/components/app-container";
import { CommunitiesGrid } from "@/components/community/list/communities-grid";
import { CommunitiesHeader } from "@/components/community/list/communities-header";
import { CommunitiesLoadMore } from "@/components/community/list/communities-load-more";
import { CommunityTopicFilters } from "@/components/community/list/community-topic-filters";
import { CreateCommunityDialog } from "@/components/community/list/create-community-dialog";

export const Route = createFileRoute("/comunidades")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.communities.seoTitle }] }),
  component: CommunitiesPage,
});

function CommunitiesPage() {
  const queryClient = useQueryClient();
  const matchRoute = useMatchRoute();
  const [selectedTopic, setSelectedTopic] = useState<string | undefined>();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [loadedCommunities, setLoadedCommunities] = useState<Community[]>([]);
  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;
  const isDetailRoute = Boolean(matchRoute({ to: "/comunidades/$communityId" }));

  const { data: communitiesData, isFetching } = useQuery({
    queryKey: ["communities", selectedTopic, cursor],
    queryFn: () => communityApi.list(selectedTopic, cursor),
    enabled: !isDetailRoute,
  });

  const nextCursor = communitiesData?.nextCursor ?? null;

  useEffect(() => {
    const pageItems = communitiesData?.items;
    if (!pageItems) return;
    setLoadedCommunities((currentCommunities) =>
      mergeUniquePage(
        currentCommunities,
        pageItems,
        !cursorRef.current,
        (community) => community.id,
      ),
    );
  }, [communitiesData]);

  const handleTopicChange = (nextTopic?: CommunityTopic) => {
    setSelectedTopic(nextTopic);
    setCursor(undefined);
    setLoadedCommunities([]);
  };

  const joinCommunityMutation = useMutation({
    mutationFn: (communityId: string) => communityApi.join(communityId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["communities"] }),
  });

  const leaveCommunityMutation = useMutation({
    mutationFn: (communityId: string) => communityApi.leave(communityId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["communities"] }),
  });

  if (isDetailRoute) return <Outlet />;

  const isMembershipPending = joinCommunityMutation.isPending || leaveCommunityMutation.isPending;

  return (
    <AppContainer>
      <div className="space-y-6">
        <CommunitiesHeader
          createDialog={
            <CreateCommunityDialog
              isOpen={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            />
          }
        />
        <CommunityTopicFilters selectedTopic={selectedTopic} onChange={handleTopicChange} />
        <CommunitiesGrid
          communities={loadedCommunities}
          isPending={isMembershipPending}
          onJoin={joinCommunityMutation.mutate}
          onLeave={leaveCommunityMutation.mutate}
        />
        <CommunitiesLoadMore
          isVisible={Boolean(nextCursor)}
          isLoading={isFetching}
          onLoadMore={() => {
            if (!isFetching && nextCursor) setCursor(nextCursor);
          }}
        />
      </div>
    </AppContainer>
  );
}
