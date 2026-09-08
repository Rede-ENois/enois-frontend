import type { MentorCardStatItemProps } from "@/types/components/mentoring/mentor-card-stat-item-props";

export function MentorCardStatItem({ stat }: MentorCardStatItemProps) {
  const Icon = stat.icon;

  return (
    <div>
      <dt className="text-muted-foreground">{stat.label}</dt>

      <dd
        className={`mt-0.5 ${Icon ? "inline-flex items-center gap-1 " : ""}${stat.valueClassName}`}
      >
        {Icon && <Icon className={`h-3.5 w-3.5 ${stat.iconClassName}`} />}
        <>{stat.value}</>
      </dd>
    </div>
  );
}
