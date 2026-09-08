import { MENTOR_CARD_STATS } from "@/constants/mentor-card-stats";
import type { MentorCardStat } from "@/types/components/mentoring/mentor-card-stat";
import { useMentorCardContext } from "@/utils/components/mentoring/use-mentor-card-context";

import { MentorCardStatItem } from "@/components/mentor-card-stat-item";

export function MentorCardStats() {
  const { mentor } = useMentorCardContext();

  return (
    <footer className="grid grid-cols-1 gap-8 rounded-2xl">
      <dl className="grid grid-cols-2 gap-2 rounded-xl bg-muted/50 p-3 text-xs">
        {MENTOR_CARD_STATS.map((stat) => (
          <MentorCardStatItem
            key={stat.key}
            stat={{ ...stat, value: mentor[stat.field] } satisfies MentorCardStat}
          />
        ))}
      </dl>
    </footer>
  );
}
