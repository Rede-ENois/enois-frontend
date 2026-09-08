import { FeedComposerContext } from "@/utils/components/feed/feed-composer-context";
import { useFeedComposerController } from "@/utils/components/feed/use-feed-composer-controller";

import { FeedComposer } from "@/components/feed-composer";

export function FeedComposerProvider() {
  const controller = useFeedComposerController();

  return (
    <FeedComposerContext.Provider value={controller}>
      <FeedComposer />
    </FeedComposerContext.Provider>
  );
}
