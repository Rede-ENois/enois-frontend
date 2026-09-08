import { FeedEventsSummary } from "@/components/feed-events-summary";
import { FeedNetworkSuggestions } from "@/components/feed-network-suggestions";
import { FeedProfileSummaryProvider } from "@/components/feed-profile-summary-provider";

export function FeedSidebar() {
  return (
    <aside className="sticky top-20 hidden max-h-[calc(100vh-6rem)] space-y-4 overflow-y-auto lg:block">
      <FeedProfileSummaryProvider />
      <FeedNetworkSuggestions />
      <FeedEventsSummary />
    </aside>
  );
}
