import type { EventCardContentProps } from "@/types/components/events/event-card-content-props";

import { EventCardAction } from "@/components/event-card-action";
import { EventCardDetails } from "@/components/event-card-details";
import { EventCardMetadata } from "@/components/event-card-metadata";

export function EventCardContent(props: EventCardContentProps) {
  return (
    <div className="p-5">
      <EventCardDetails
        event={props.event}
        formatIcon={props.formatIcon}
        formatLabel={props.formatLabel}
      />
      <EventCardMetadata dateTimeLabel={props.dateTimeLabel} attendees={props.event.attendees ?? 0} />
      <EventCardAction attending={props.attending} onAttend={props.onAttend} />
    </div>
  );
}
