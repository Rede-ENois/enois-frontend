import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { useEventsQuery, useFeedQuery, useNetworkSuggestionsQuery } from "@/hooks/use-feed-queries";
import { networkApi } from "@/lib/api";

export function useFeedPageState() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string | undefined>("FOR_YOU");
  const { data: feedData, isFetching: isFeedLoading } = useFeedQuery(activeTab);
  const { data: suggestions } = useNetworkSuggestionsQuery(4);
  const { data: eventsData } = useEventsQuery();

  const handleConnectSuggestion = async (userId: string) => {
    await networkApi.sendConnectionRequest(userId);
    queryClient.invalidateQueries({ queryKey: ["network", "suggestions"] });
  };

  return {
    activeTab,
    setActiveTab,
    posts: feedData?.items ?? [],
    isFeedLoading,
    suggestions: suggestions ?? [],
    events: eventsData?.items ?? [],
    handleConnectSuggestion,
  };
}
