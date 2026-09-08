import { FeedPageContext } from "@/utils/components/feed/feed-page-context";
import { useFeedPageController } from "@/utils/components/feed/use-feed-page-controller";

import { Home } from "@/components/pages/feed-page";

export function FeedPageProvider() {
  const controller = useFeedPageController();

  return (
    <FeedPageContext.Provider value={controller}>
      <Home />
    </FeedPageContext.Provider>
  );
}
