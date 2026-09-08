import type { EventCardProps } from "@/types/components/events/event-card-props";
import { useEventCardController } from "@/utils/components/events/use-event-card-controller";

import { EventCardContent } from "@/components/event-card-content";
import { EventCardMedia } from "@/components/event-card-media";

export function EventCard(props: EventCardProps) {
  const { event } = props;
  const controller = useEventCardController(props);

  return (
    <article className="surface-card overflow-hidden">
      <EventCardMedia
        coverUrl={controller.coverUrl}
        monthLabel={controller.monthLabel}
        dayLabel={controller.dayLabel}
      />
      <EventCardContent
        event={event}
        formatIcon={controller.FormatIcon}
        formatLabel={controller.formatLabel}
        dateTimeLabel={controller.dateTimeLabel}
        attending={controller.attending}
        onAttend={controller.attend}
      />
    </article>
  );
}
