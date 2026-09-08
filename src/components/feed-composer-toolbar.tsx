import type { FeedComposerToolbarProps } from "@/types/components/feed/feed-composer-toolbar-props";

import { FeedComposerActionList } from "@/components/feed-composer-action-list";
import { FeedComposerPublishControls } from "@/components/feed-composer-publish-controls";

export function FeedComposerToolbar(props: FeedComposerToolbarProps) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border-soft pt-3 text-[13px] font-light text-text-subtle">
      <FeedComposerActionList actions={props.actions} />
      <FeedComposerPublishControls
        publishError={props.publishError}
        uploadProgressText={props.uploadProgressText}
        publishDisabled={props.publishDisabled}
        isPublishing={props.isPublishing}
        publishButtonLabel={props.publishButtonLabel}
      />
    </div>
  );
}
