import { FeedProfileBanner } from "@/components/feed-profile-banner";
import { FeedProfileIdentity } from "@/components/feed-profile-identity";
import { FeedProfileStats } from "@/components/feed-profile-stats";

export function FeedProfileSummary() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border-soft bg-surface-card">
      <FeedProfileBanner />

      <div className="-mt-7 px-4 pb-4 text-center">
        <FeedProfileIdentity />
        <FeedProfileStats />
      </div>
    </div>
  );
}
