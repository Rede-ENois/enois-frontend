import { useContext } from "react";

import { EventCardContext } from "@/utils/components/events/event-card-context";

export function useEventCardContext() {
  const context = useContext(EventCardContext);

  if (!context) {
    throw new Error("Event card components must be rendered inside EventCardProvider");
  }

  return context;
}
