import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import type { FeedTab } from "@/types/application/feed/feed-tab";

import { listFeedPosts } from "@/lib/api/feed";

export function useFeedPageController() {
  const [tab, setTab] = useState<FeedTab>("FOR_YOU");
  const { data, isFetching } = useQuery({
    queryKey: ["feed", tab],
    queryFn: () => listFeedPosts(null, 20, tab),
  });

  return {
    activeTab: tab,
    onTabChange: setTab,
    posts: data?.items ?? [],
    showLoading: isFetching,
    showPosts: !isFetching,
  };
}
