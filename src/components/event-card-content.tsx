import { EventCardAction } from "@/components/event-card-action";
import { EventCardDetails } from "@/components/event-card-details";
import { EventCardMetadata } from "@/components/event-card-metadata";

export function EventCardContent() {
  return (
    <div className="p-5">
      <EventCardDetails />
      <EventCardMetadata />
      <EventCardAction />
    </div>
  );
}
