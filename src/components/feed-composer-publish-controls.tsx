import type { FeedComposerPublishControlsProps } from "@/types/components/feed/feed-composer-publish-controls-props";

import { FeedComposerPublishButton } from "@/components/feed-composer-publish-button";
import { FeedComposerPublishStatus } from "@/components/feed-composer-publish-status";

export function FeedComposerPublishControls(props: FeedComposerPublishControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <FeedComposerPublishStatus
        publishError={props.publishError}
        uploadProgressText={props.uploadProgressText}
      />
      <FeedComposerPublishButton
        disabled={props.publishDisabled}
        isPublishing={props.isPublishing}
        label={props.publishButtonLabel}
      />
    </div>
  );
}
