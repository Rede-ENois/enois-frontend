import type { EventCardProviderProps } from "@/types/components/events/event-card-provider-props";
import { EventCardContext } from "@/utils/components/events/event-card-context";
import { useEventCardController } from "@/utils/components/events/use-event-card-controller";

import { EventCard } from "@/components/event-card";

export function EventCardProvider({ event }: EventCardProviderProps) {
  const view = useEventCardController(event);

  return (
    <EventCardContext.Provider value={{ event, ...view }}>
      <EventCard />
    </EventCardContext.Provider>
  );
}
