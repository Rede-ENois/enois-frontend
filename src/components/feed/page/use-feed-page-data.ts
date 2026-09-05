import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { useEventsQuery, useFeedQuery, useNetworkSuggestionsQuery } from "@/hooks/use-feed-data";
import { networkApi } from "@/lib/api";

export function useFeedPageData() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<string | undefined>("FOR_YOU");
  const { data: feedData, isFetching: feedLoading } = useFeedQuery(tab);
  const { data: suggestions } = useNetworkSuggestionsQuery(4);
  const { data: eventsData } = useEventsQuery();

  const connectSuggestion = async (userId: string) => {
    await networkApi.connect(userId);
    queryClient.invalidateQueries({ queryKey: ["network", "suggestions"] });
  };

  return {
    tab,
    setTab,
    posts: feedData?.items ?? [],
    feedLoading,
    suggestions: suggestions ?? [],
    events: eventsData?.items ?? [],
    connectSuggestion,
  };
}
