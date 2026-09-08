import { EventCardContent } from "@/components/event-card-content";
import { EventCardMedia } from "@/components/event-card-media";

export function EventCard() {
  return (
    <article className="surface-card overflow-hidden">
      <EventCardMedia />
      <EventCardContent />
    </article>
  );
}
