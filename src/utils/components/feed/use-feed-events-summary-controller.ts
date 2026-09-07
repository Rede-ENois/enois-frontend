import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";

import { listEvents } from "@/lib/api/events";

export function useFeedEventsSummaryController() {
  const { data: eventsData } = useQuery({
    queryKey: ["events"],
    queryFn: () => listEvents(),
  });
  const events = (eventsData?.items ?? []).slice(0, 3);

  return {
    visible: events.length > 0,
    items: events.map((event) => ({
      event,
      meta: texts.feed.sidebar.eventMeta(
        event.date,
        event.format,
        texts.feed.sidebar.confirmed(event.attendees),
      ),
    })),
  };
}
