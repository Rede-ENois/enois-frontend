import { createMentorCardStats } from "@/utils/components/mentoring/create-mentor-card-stats";
import { useMentorCardContext } from "@/utils/components/mentoring/use-mentor-card-context";

import { MentorCardStatItem } from "@/components/mentor-card-stat-item";

export function MentorCardStats() {
  const { mentor } = useMentorCardContext();
  const stats = createMentorCardStats(mentor);

  return (
    <footer className="grid grid-cols-1 gap-8 rounded-2xl">
      <dl className="grid grid-cols-2 gap-2 rounded-xl bg-muted/50 p-3 text-xs">
        {stats.map((stat) => (
          <MentorCardStatItem key={stat.key} stat={stat} />
        ))}
      </dl>
    </footer>
  );
}
