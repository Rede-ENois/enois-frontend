import { texts } from "@/texts";

export function createFeedComposerPublishViewModel(
  draft: string,
  publishError: string | null,
  isUploading: boolean,
  createPending: boolean,
  uploadProgress: number,
) {
  const isPublishing = createPending || isUploading;

  return {
    publishDisabled: !draft.trim() || isPublishing,
    isPublishing,
    publishButtonLabel: isUploading
      ? texts.common.sending
      : createPending
        ? texts.common.publishing
        : texts.common.publish,
    uploadProgressText:
      !publishError && isUploading ? texts.feed.composer.uploadProgress(uploadProgress) : null,
  };
}
