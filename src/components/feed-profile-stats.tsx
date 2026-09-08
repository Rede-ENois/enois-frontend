import { createFeedProfileStats } from "@/utils/components/feed/create-feed-profile-stats";
import { useFeedProfileSummaryContext } from "@/utils/components/feed/use-feed-profile-summary-context";

export function FeedProfileStats() {
  const { profile } = useFeedProfileSummaryContext();
  const stats = createFeedProfileStats(profile);

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
