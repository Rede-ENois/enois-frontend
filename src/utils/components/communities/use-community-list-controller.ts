import { useState } from "react";

import type { CommunityTopic } from "@/types/application/community/community-topic";
import { useCommunityPagination } from "@/utils/components/communities/use-community-pagination";

export function useCommunityListController(isDetail: boolean) {
  const [topic, setTopic] = useState<CommunityTopic | undefined>(undefined);
  const pagination = useCommunityPagination(topic, !isDetail);

  return {
    topic,
    communities: pagination.communities,
    nextCursor: pagination.nextCursor,
    isFetching: pagination.isFetching,
    changeTopic: (nextTopic: CommunityTopic | undefined) => {
      setTopic(nextTopic);
      pagination.reset();
    },
    loadMore: pagination.loadMore,
  };
}
