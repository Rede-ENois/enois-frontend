import { texts } from "@/texts";
import { useEventCardContext } from "@/utils/components/events/use-event-card-context";

export function useEventCardDetailsController() {
  const { event, FormatIcon, formatLabel } = useEventCardContext();

  return {
    FormatIcon,
    formatLabel,
    title: event.title,
    hostLabel: texts.events.hostedBy(event.host),
  };
}
