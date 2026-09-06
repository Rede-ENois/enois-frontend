import { getLocalMediaTypeFromItems } from "@/utils/media";
import type { FeedComposerProps } from "@/types/components/feed/feed-composer-props";

import { ComposerMediaPreview } from "./composer-media-preview";
import { FeedComposerInput } from "./feed-composer-input";
import { FeedComposerToolbar } from "./feed-composer-toolbar";

export function FeedComposer({
  currentUser,
  content,
  postType,
  mediaItems,
  publicationError,
  isUploading,
  uploadProgress,
  isPublishing,
  onSubmit,
  onContentChange,
  onPostTypeChange,
  onMediaSelect,
  onRemoveMedia,
}: FeedComposerProps) {
  const mediaType = getLocalMediaTypeFromItems(mediaItems);

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-border-soft bg-surface-card p-4 sm:p-5">
      <FeedComposerInput currentUser={currentUser} content={content} onContentChange={onContentChange} />
      <ComposerMediaPreview media={mediaItems} mediaType={mediaType} onRemove={onRemoveMedia} />
      <FeedComposerToolbar
        content={content}
        postType={postType}
        media={mediaItems}
        mediaType={mediaType}
        publicationError={publicationError}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        isPublishing={isPublishing}
        onPostTypeChange={onPostTypeChange}
        onMediaSelect={onMediaSelect}
      />
    </form>
  );
}
