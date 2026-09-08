import { FeedComposerActionList } from "@/components/feed-composer-action-list";
import { FeedComposerPublishControls } from "@/components/feed-composer-publish-controls";

export function FeedComposerToolbar() {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border-soft pt-3 text-[13px] font-light text-text-subtle">
      <FeedComposerActionList />
      <FeedComposerPublishControls />
    </div>
  );
}
