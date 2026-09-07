import { FeedEventsSummary } from "@/components/feed-events-summary";
import { FeedNetworkSuggestions } from "@/components/feed-network-suggestions";
import { FeedProfileSummary } from "@/components/feed-profile-summary";

export function FeedSidebar() {
  return (
    <aside className="sticky top-20 hidden max-h-[calc(100vh-6rem)] space-y-4 overflow-y-auto lg:block">
      <FeedProfileSummary />
      <FeedNetworkSuggestions />
      <FeedEventsSummary />
    </aside>
  );
}
