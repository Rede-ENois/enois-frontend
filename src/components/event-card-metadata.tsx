import { createEventCardMetadataItems } from "@/utils/components/events/create-event-card-metadata-items";
import { useEventCardContext } from "@/utils/components/events/use-event-card-context";

export function EventCardMetadata() {
  const { event, dateTimeLabel } = useEventCardContext();
  const items = createEventCardMetadataItems(event, dateTimeLabel);

  return (
    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
      {items.map((item) => (
        <span key={item.key} className="inline-flex items-center gap-1.5">
          <item.icon className="h-3.5 w-3.5" />

          <>{item.value}</>
        </span>
      ))}
    </div>
  );
}
