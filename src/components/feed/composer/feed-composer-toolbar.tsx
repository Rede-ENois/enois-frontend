import type { FeedComposerToolbarProps } from "@/types/components/feed/feed-composer-toolbar-props";

import { ComposerMediaAction } from "./composer-media-action";
import { ComposerPostTypeActions } from "./composer-post-type-actions";
import { ComposerPublishControl } from "./composer-publish-control";

export function FeedComposerToolbar({
  content,
  postType,
  media,
  mediaType,
  publicationError,
  isUploading,
  uploadProgress,
  isPublishing,
  onPostTypeChange,
  onMediaSelect,
}: FeedComposerToolbarProps) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border-soft pt-3 text-[13px] font-light text-text-subtle">
      <div className="flex flex-wrap gap-1.5">
        <ComposerPostTypeActions postType={postType} onChange={onPostTypeChange} />
        <ComposerMediaAction media={media} mediaType={mediaType} onSelect={onMediaSelect} />
      </div>
      <ComposerPublishControl
        content={content}
        publicationError={publicationError}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        isPublishing={isPublishing}
      />
    </div>
  );
}
