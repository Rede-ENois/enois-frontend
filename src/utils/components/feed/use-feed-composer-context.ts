import { useContext } from "react";

import { FeedComposerContext } from "@/utils/components/feed/feed-composer-context";

export function useFeedComposerContext() {
  const context = useContext(FeedComposerContext);

  if (!context) {
    throw new Error("Feed composer components must be rendered inside FeedComposerProvider");
  }

  return context;
}
