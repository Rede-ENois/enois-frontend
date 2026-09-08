import { useContext } from "react";

import { FeedPageContext } from "@/utils/components/feed/feed-page-context";

export function useFeedPageContext() {
  const context = useContext(FeedPageContext);

  if (!context) {
    throw new Error("Feed page components must be rendered inside FeedPageProvider");
  }

  return context;
}
