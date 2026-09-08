import { MENTOR_CARD_STATS } from "@/constants/mentor-card-stats";
import type { Mentor } from "@/types/application/mentor/mentor";
import type { MentorCardStat } from "@/types/components/mentoring/mentor-card-stat";

export function createMentorCardStats(mentor: Mentor) {
  return MENTOR_CARD_STATS.map(
    (stat) => ({ ...stat, value: mentor[stat.field] }) satisfies MentorCardStat,
  );
}
