import type { Event } from "@/types/application/event/event";
import type { LucideIcon } from "lucide-react";

export type EventCardDetailsProps = {
  event: Pick<Event, "title" | "host">;
  formatIcon: LucideIcon;
  formatLabel: string;
};
