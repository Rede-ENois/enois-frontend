import type { ElementType } from "react";

import type { Event } from "@/types/application/event/event";

export type EventCardContextValue = {
  event: Event;
  coverUrl: string | null;
  FormatIcon: ElementType;
  formatLabel: string;
  monthLabel?: string;
  dayLabel: string;
  dateTimeLabel: string;
  attend: () => void;
  attending: boolean;
};
