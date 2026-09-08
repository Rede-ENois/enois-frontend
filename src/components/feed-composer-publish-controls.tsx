import { FeedComposerPublishButton } from "@/components/feed-composer-publish-button";
import { FeedComposerPublishStatus } from "@/components/feed-composer-publish-status";

export function FeedComposerPublishControls() {
  return (
    <div className="flex items-center gap-2">
      <FeedComposerPublishStatus />
      <FeedComposerPublishButton />
    </div>
  );
}
