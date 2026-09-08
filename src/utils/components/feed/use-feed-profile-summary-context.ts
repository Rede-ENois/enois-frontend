import { useContext } from "react";

import { FeedProfileSummaryContext } from "@/utils/components/feed/feed-profile-summary-context";

export function useFeedProfileSummaryContext() {
  const context = useContext(FeedProfileSummaryContext);

  if (!context) {
    throw new Error("Feed profile summary components must be rendered inside FeedProfileSummaryProvider");
  }

  return context;
}
