import { useFeedProfileSummaryController } from "@/utils/components/feed/use-feed-profile-summary-controller";

import { FeedProfileBanner } from "@/components/feed-profile-banner";
import { FeedProfileIdentity } from "@/components/feed-profile-identity";
import { FeedProfileStats } from "@/components/feed-profile-stats";

export function FeedProfileSummary() {
  const { visible, profile } = useFeedProfileSummaryController();

  if (!visible || !profile) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border-soft bg-surface-card">
      <FeedProfileBanner />

      <div className="-mt-7 px-4 pb-4 text-center">
        <FeedProfileIdentity profile={profile} />
        <FeedProfileStats profile={profile} />
      </div>
    </div>
  );
}
