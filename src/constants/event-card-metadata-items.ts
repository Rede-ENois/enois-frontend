import { Calendar, Users } from "lucide-react";

export const EVENT_CARD_METADATA_ITEMS = [
  { key: "date", field: "dateTimeLabel", icon: Calendar },
  { key: "attendees", field: "attendees", icon: Users },
] as const;
