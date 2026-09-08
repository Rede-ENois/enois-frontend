import { texts } from "@/texts";
import { createFeedComposerActions } from "@/utils/components/feed/create-feed-composer-actions";
import { createFeedComposerPublishViewModel } from "@/utils/components/feed/create-feed-composer-publish-view-model";
import { useFeedComposerFormState } from "@/utils/components/feed/use-feed-composer-form-state";
import { useFeedComposerMedia } from "@/utils/components/feed/use-feed-composer-media";
import { useFeedComposerProfile } from "@/utils/components/feed/use-feed-composer-profile";
import { useFeedComposerPublisher } from "@/utils/components/feed/use-feed-composer-publisher";

export function useFeedComposerController() {
  const form = useFeedComposerFormState();
  const media = useFeedComposerMedia();
  const profile = useFeedComposerProfile();
  const publisher = useFeedComposerPublisher(
    form.draft,
    form.mentionedUserIds,
    form.postType,
    media.media,
    () => {
      form.reset();
      media.clearMedia();
    },
  );
  const composerActions = createFeedComposerActions(
    form.postType,
    media.mediaType,
    media.media.length,
    form.setPostType,
    () => media.fileRef.current?.click(),
  );
  const publish = createFeedComposerPublishViewModel(
    form.draft,
    publisher.publishError,
    publisher.isUploading,
    publisher.createPending,
    publisher.uploadProgress,
  );

  return {
    profileAvatar: profile?.avatar,
    profileName: profile?.name ?? texts.feed.you,
    draft: form.draft,
    publishError: publisher.publishError,
    publishPost: publisher.publishPost,
    handleDraftChange: form.handleDraftChange,
    composerActions,
    ...publish,
    ...media,
  };
}
