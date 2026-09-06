import type { PostView } from "@/lib/api";
import type { LocalMediaItem, LocalMediaType } from "@/utils/media";

import { ComposerMediaAction } from "./composer-media-action";
import { ComposerPostTypeActions } from "./composer-post-type-actions";
import { ComposerPublishControl } from "./composer-publish-control";

type FeedComposerToolbarProps = {
  content: string;
  postType: PostView["type"];
  media: LocalMediaItem[];
  mediaType: LocalMediaType | null;
  publicationError: string | null;
  isUploading: boolean;
  uploadProgress: number;
  isPublishing: boolean;
  onPostTypeChange: (type: PostView["type"]) => void;
  onMediaSelect: (files: FileList) => void;
};

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
