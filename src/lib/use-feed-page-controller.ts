import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { listFeedPosts } from "@/lib/api/feed";
import type { FeedTab } from "@/types/application/feed/feed-tab";

export function useFeedPageController() {
  const [tab, setTab] = useState<FeedTab>("FOR_YOU");
  const { data, isFetching } = useQuery({
    queryKey: ["feed", tab],
    queryFn: () => listFeedPosts(null, 20, tab),
  });

  return {
    tab,
    setTab,
    posts: data?.items ?? [],
    loading: isFetching,
  };
}
