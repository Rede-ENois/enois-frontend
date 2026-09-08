import { Calendar, Users } from "lucide-react";

import type { EventCardMetadataProps } from "@/types/components/events/event-card-metadata-props";

export function EventCardMetadata({ dateTimeLabel, attendees }: EventCardMetadataProps) {
  const metadata = [
    { key: "date", icon: Calendar, label: dateTimeLabel },
    { key: "attendees", icon: Users, label: attendees },
  ];

  return (
    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
      {metadata.map((item) => (
        <span key={item.key} className="inline-flex items-center gap-1.5">
          <item.icon className="h-3.5 w-3.5" />
          <>{item.label}</>
        </span>
      ))}
    </div>
  );
}
