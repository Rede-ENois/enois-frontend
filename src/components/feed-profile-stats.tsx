import { texts } from "@/texts";
import type { FeedProfileSectionProps } from "@/types/components/feed/feed-profile-section-props";

export function FeedProfileStats({ profile }: FeedProfileSectionProps) {
  const stats = [
    { key: "connections", value: profile.connectionsCount, label: texts.feed.sidebar.connections },
    { key: "followers", value: profile.followersCount, label: texts.feed.sidebar.followers },
  ];

  return (
    <div className="mt-3 grid grid-cols-2 gap-1 border-t border-border-soft pt-3 text-[12px]">
      {stats.map((stat) => (
        <div key={stat.key}>
          <p className="font-light text-text-strong">{stat.value}</p>
          <p className="text-text-subtle">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
