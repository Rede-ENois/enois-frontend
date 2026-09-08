import type { Event } from "@/types/application/event/event";
import type { LucideIcon } from "lucide-react";

export type EventCardContentProps = {
  event: Event;
  formatIcon: LucideIcon;
  formatLabel: string;
  dateTimeLabel: string;
  attending: boolean;
  onAttend: () => void;
};
