import { useEffect, useRef, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import type { Community } from "@/types/application/community/community";
import type { CommunityTopic } from "@/types/application/community/community-topic";

import { listCommunities } from "@/lib/api/communities";

import { mergeCommunityPageItems } from "@/utils/components/communities/merge-community-page-items";

export function useCommunityListController(isDetail: boolean) {
  const [topic, setTopic] = useState<CommunityTopic | undefined>(undefined);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [communities, setCommunities] = useState<Community[]>([]);
  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;

  const { data, isFetching } = useQuery({
    queryKey: ["communities", topic, cursor],
    queryFn: () => listCommunities(topic, cursor),
    enabled: !isDetail,
  });
  const nextCursor = data?.nextCursor ?? null;

  useEffect(() => {
    if (!data?.items) return;
    setCommunities((previous) => mergeCommunityPageItems(previous, data.items, Boolean(cursorRef.current)));
  }, [data]);

  const changeTopic = (nextTopic: CommunityTopic | undefined) => {
    setTopic(nextTopic);
    setCursor(undefined);
    setCommunities([]);
  };

  const loadMore = () => {
    if (nextCursor && !isFetching) setCursor(nextCursor);
  };

  return {
    topic,
    communities,
    nextCursor,
    isFetching,
    changeTopic,
    loadMore,
  };
}
