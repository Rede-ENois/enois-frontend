import { useQuery } from "@tanstack/react-query";

import { eventsApi, feedApi, networkApi } from "@/lib/api";

export function useFeedQuery(tab: string | undefined) {
  return useQuery({
    queryKey: ["feed", tab],
    queryFn: () => feedApi.list(null, 20, tab),
  });
}

export function useNetworkSuggestionsQuery(limit = 4) {
  return useQuery({
    queryKey: ["network", "suggestions", limit],
    queryFn: () => networkApi.suggestions(limit),
  });
}

export function useEventsQuery() {
  return useQuery({
    queryKey: ["events"],
    queryFn: () => eventsApi.list(),
  });
}
