import { FEED_PROFILE_STATS } from "@/constants/feed-profile-stats";
import type { FeedProfileSectionProps } from "@/types/components/feed/feed-profile-section-props";

export function FeedProfileStats({ profile }: FeedProfileSectionProps) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-1 border-t border-border-soft pt-3 text-[12px]">
      {FEED_PROFILE_STATS.map((stat) => (
        <div key={stat.key}>
          <p className="font-light text-text-strong">{profile[stat.field]}</p>

          <p className="text-text-subtle">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
