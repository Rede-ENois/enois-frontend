import { useEffect, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Outlet, createFileRoute, useMatchRoute } from "@tanstack/react-router";

import { communitiesApi } from "@/lib/api";
import type { Community } from "@/lib/api";
import { requireAuth } from "@/lib/require-auth";
import { texts } from "@/texts";
import { mergeUniquePage } from "@/utils/collections";

import { AppContainer } from "@/components/app-container";
import { CommunitiesGrid } from "@/components/community/list/communities-grid";
import { CommunitiesHeader } from "@/components/community/list/communities-header";
import { CommunitiesLoadMore } from "@/components/community/list/communities-load-more";
import { CommunityTopicFilters } from "@/components/community/list/community-topic-filters";
import type { CommunityTopic } from "@/components/community/list/community-topics";
import { CreateCommunityDialog } from "@/components/community/list/create-community-dialog";

export const Route = createFileRoute("/comunidades")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.communities.seoTitle }] }),
  component: CommunitiesRoute,
});

function CommunitiesRoute() {
  const queryClient = useQueryClient();
  const matchRoute = useMatchRoute();
  const [topic, setTopic] = useState<string | undefined>();
  const [createOpen, setCreateOpen] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [allItems, setAllItems] = useState<Community[]>([]);
  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;
  const isDetail = Boolean(matchRoute({ to: "/comunidades/$communityId" }));

  const { data: communitiesData, isFetching } = useQuery({
    queryKey: ["communities", topic, cursor],
    queryFn: () => communitiesApi.list(topic, cursor),
    enabled: !isDetail,
  });

  const nextCursor = communitiesData?.nextCursor ?? null;

  useEffect(() => {
    const page = communitiesData?.items;
    if (!page) return;
    setAllItems((current) =>
      mergeUniquePage(current, page, !cursorRef.current, (community) => community.id),
    );
  }, [communitiesData]);

  const handleTopicChange = (nextTopic?: CommunityTopic) => {
    setTopic(nextTopic);
    setCursor(undefined);
    setAllItems([]);
  };

  const join = useMutation({
    mutationFn: (id: string) => communitiesApi.join(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["communities"] }),
  });

  const leave = useMutation({
    mutationFn: (id: string) => communitiesApi.leave(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["communities"] }),
  });

  if (isDetail) return <Outlet />;

  return (
    <AppContainer>
      <div className="space-y-6">
        <CommunitiesHeader
          createDialog={
            <CreateCommunityDialog open={createOpen} onOpenChange={setCreateOpen} />
          }
        />
        <CommunityTopicFilters selected={topic} onChange={handleTopicChange} />
        <CommunitiesGrid
          communities={allItems}
          pending={join.isPending || leave.isPending}
          onJoin={join.mutate}
          onLeave={leave.mutate}
        />
        <CommunitiesLoadMore
          visible={Boolean(nextCursor)}
          loading={isFetching}
          onLoadMore={() => {
            if (!isFetching && nextCursor) setCursor(nextCursor);
          }}
        />
      </div>
    </AppContainer>
  );
}
