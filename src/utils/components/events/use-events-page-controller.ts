import { useQuery } from "@tanstack/react-query";

import { listEvents } from "@/lib/api/events";

export function useEventsPageController() {
  const { data: eventsData } = useQuery({
    queryKey: ["events"],
    queryFn: () => listEvents(),
  });

  return { events: eventsData?.items ?? [] };
}
