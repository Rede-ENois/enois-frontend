import { createContext } from "react";

import type { EventCardContextValue } from "@/types/components/events/event-card-context-value";

export const EventCardContext = createContext<EventCardContextValue | null>(null);
