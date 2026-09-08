import { Calendar, Star } from "lucide-react";

import { texts } from "@/texts";
import type { MentorCardStat } from "@/types/components/mentoring/mentor-card-stat";
import type { MentorCardStatsProps } from "@/types/components/mentoring/mentor-card-stats-props";

import { MentorCardStatItem } from "@/components/mentor-card-stat-item";

export function MentorCardStats({ mentor }: MentorCardStatsProps) {
  const stats: MentorCardStat[] = [
    {
      key: "rating",
      label: texts.mentoring.rating,
      value: mentor.rating,
      icon: Star,
      valueClassName: "font-semibold",
      iconClassName: "fill-opportunity text-opportunity",
    },
    {
      key: "sessions",
      label: texts.mentoring.sessions,
      value: mentor.sessions,
      icon: null,
      valueClassName: "font-semibold",
      iconClassName: "",
    },
    {
      key: "investment",
      label: texts.mentoring.investment,
      value: mentor.price,
      icon: null,
      valueClassName: "font-medium",
      iconClassName: "",
    },
    {
      key: "next-slot",
      label: texts.mentoring.nextSlot,
      value: mentor.nextSlot,
      icon: Calendar,
      valueClassName: "font-medium",
      iconClassName: "",
    },
  ];

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
