import { useEffect, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Community } from "@/types/application/community/community";
import type { CommunityTopic } from "@/types/application/community/community-topic";

import { listCommunities } from "@/lib/api/communities";
import { joinCommunity } from "@/lib/api/communities/join-community";
import { leaveCommunity } from "@/lib/api/communities/leave-community";

export function useCommunitiesPage(isDetail: boolean) {
  const queryClient = useQueryClient();
  const [topic, setTopic] = useState<CommunityTopic | undefined>(undefined);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allItems, setAllItems] = useState<Community[]>([]);
  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;

  const { data: communitiesData, isFetching } = useQuery({
    queryKey: ["communities", topic, cursor],
    queryFn: () => listCommunities(topic, cursor),
    enabled: !isDetail,
  });

  const nextCursor = communitiesData?.nextCursor ?? null;

  useEffect(() => {
    if (!communitiesData?.items) return;

    setAllItems((previous) => {
      if (cursorRef.current) {
        const existing = new Set(previous.map((community) => community.id));
        const newItems = communitiesData.items.filter((community) => !existing.has(community.id));
        return newItems.length > 0 ? [...previous, ...newItems] : previous;
      }
      return communitiesData.items;
    });
  }, [communitiesData]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["communities"] });

  const join = useMutation({
    mutationFn: joinCommunity,
    onSuccess: invalidate,
  });

  const leave = useMutation({
    mutationFn: leaveCommunity,
    onSuccess: invalidate,
  });

  const changeTopic = (nextTopic: CommunityTopic | undefined) => {
    setTopic(nextTopic);
    setCursor(undefined);
    setAllItems([]);
  };

  const loadMore = () => {
    if (nextCursor && !isFetching) setCursor(nextCursor);
  };

  const toggleMembership = (communityId: string, joined: boolean) => {
    if (joined) leave.mutate(communityId);
    else join.mutate(communityId);
  };

  return {
    topic,
    communities: allItems,
    nextCursor,
    isFetching,
    membershipPending: join.isPending || leave.isPending,
    changeTopic,
    loadMore,
    toggleMembership,
  };
}
