import { useFeedComposerController } from "@/utils/components/feed/use-feed-composer-controller";

import { FeedComposerInput } from "@/components/feed-composer-input";
import { FeedComposerToolbar } from "@/components/feed-composer-toolbar";

export function FeedComposer() {
  const controller = useFeedComposerController();

  return (
    <form
      onSubmit={controller.publishPost}
      className="rounded-2xl border border-border-soft bg-surface-card p-4 sm:p-5"
    >
      <FeedComposerInput
        profile={controller.profile}
        draft={controller.draft}
        onDraftChange={controller.handleDraftChange}
        media={controller.media}
        fileRef={controller.fileRef}
        onMediaSelect={controller.handleMediaSelect}
        onRemoveMedia={controller.removeMedia}
      />
      <FeedComposerToolbar
        actions={controller.composerActions}
        publishError={controller.publishError}
        uploadProgressText={controller.uploadProgressText}
        publishDisabled={controller.publishDisabled}
        isPublishing={controller.isPublishing}
        publishButtonLabel={controller.publishButtonLabel}
      />
    </form>
  );
}
