import { useEffect, useRef, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import type { Community } from "@/types/application/community/community";
import type { CommunityTopic } from "@/types/application/community/community-topic";

import { listCommunities } from "@/lib/api/communities";

import { mergeCommunityPageItems } from "@/utils/components/communities/merge-community-page-items";

export function useCommunityPagination(topic: CommunityTopic | undefined, enabled: boolean) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [communities, setCommunities] = useState<Community[]>([]);
  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;

  const { data, isFetching } = useQuery({
    queryKey: ["communities", topic, cursor],
    queryFn: () => listCommunities(topic, cursor),
    enabled,
  });
  const nextCursor = data?.nextCursor ?? null;

  useEffect(() => {
    if (!data?.items) return;
    setCommunities((previous) =>
      mergeCommunityPageItems(previous, data.items, Boolean(cursorRef.current)),
    );
  }, [data]);

  return {
    communities,
    nextCursor,
    isFetching,
    loadMore: () => {
      if (nextCursor && !isFetching) setCursor(nextCursor);
    },
    reset: () => {
      setCursor(undefined);
      setCommunities([]);
    },
  };
}
