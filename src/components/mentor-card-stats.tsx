import { Calendar, Star } from "lucide-react";

import { texts } from "@/texts";
import type { MentorCardStatsProps } from "@/types/components/mentoring/mentor-card-stats-props";

export function MentorCardStats({ mentor }: MentorCardStatsProps) {
  return (
    <footer className="grid grid-cols-1 gap-8 rounded-2xl">
      <dl className="grid grid-cols-2 gap-2 rounded-xl bg-muted/50 p-3 text-xs">
        <div>
          <dt className="text-muted-foreground">{texts.mentoring.rating}</dt>

          <dd className="mt-0.5 inline-flex items-center gap-1 font-semibold">
            <Star className="h-3.5 w-3.5 fill-opportunity text-opportunity" />

            <>{mentor.rating}</>
          </dd>
        </div>

        <div>
          <dt className="text-muted-foreground">{texts.mentoring.sessions}</dt>

          <dd className="mt-0.5 font-semibold">{mentor.sessions}</dd>
        </div>

        <div>
          <dt className="text-muted-foreground">{texts.mentoring.investment}</dt>

          <dd className="mt-0.5 font-medium">{mentor.price}</dd>
        </div>

        <div>
          <dt className="text-muted-foreground">{texts.mentoring.nextSlot}</dt>

          <dd className="mt-0.5 inline-flex items-center gap-1 font-medium">
            <Calendar className="h-3.5 w-3.5" />

            <>{mentor.nextSlot}</>
          </dd>
        </div>
      </dl>
    </footer>
  );
}
