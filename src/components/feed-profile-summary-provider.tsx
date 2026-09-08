import { FeedProfileSummaryContext } from "@/utils/components/feed/feed-profile-summary-context";
import { useFeedProfileSummaryController } from "@/utils/components/feed/use-feed-profile-summary-controller";

import { FeedProfileSummary } from "@/components/feed-profile-summary";

export function FeedProfileSummaryProvider() {
  const { visible, profile } = useFeedProfileSummaryController();

  if (!visible || !profile) return null;

  return (
    <FeedProfileSummaryContext.Provider value={{ profile }}>
      <FeedProfileSummary />
    </FeedProfileSummaryContext.Provider>
  );
}
