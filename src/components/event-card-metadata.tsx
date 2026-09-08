import { EVENT_CARD_METADATA_ITEMS } from "@/constants/event-card-metadata-items";
import type { EventCardMetadataProps } from "@/types/components/events/event-card-metadata-props";

export function EventCardMetadata(props: EventCardMetadataProps) {
  return (
    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
      {EVENT_CARD_METADATA_ITEMS.map((item) => (
        <span key={item.key} className="inline-flex items-center gap-1.5">
          <item.icon className="h-3.5 w-3.5" />
          <>{props[item.field]}</>
        </span>
      ))}
    </div>
  );
}
