import type { PostView } from "@/lib/api";
import type { LocalMediaItem, LocalMediaType } from "@/utils/media";

import { ComposerMediaAction } from "./composer-media-action";
import { ComposerPostTypeActions } from "./composer-post-type-actions";
import { ComposerPublishControl } from "./composer-publish-control";

export function FeedComposerToolbar({
  draft,
  postType,
  media,
  mediaType,
  publishError,
  isUploading,
  uploadProgress,
  isPublishing,
  onPostTypeChange,
  onMediaSelect,
}: {
  draft: string;
  postType: PostView["type"];
  media: LocalMediaItem[];
  mediaType: LocalMediaType | null;
  publishError: string | null;
  isUploading: boolean;
  uploadProgress: number;
  isPublishing: boolean;
  onPostTypeChange: (type: PostView["type"]) => void;
  onMediaSelect: (files: FileList) => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border-soft pt-3 text-[13px] font-light text-text-subtle">
      <div className="flex flex-wrap gap-1.5">
        <ComposerPostTypeActions postType={postType} onChange={onPostTypeChange} />
        <ComposerMediaAction media={media} mediaType={mediaType} onSelect={onMediaSelect} />
      </div>
      <ComposerPublishControl
        draft={draft}
        publishError={publishError}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        isPublishing={isPublishing}
      />
    </div>
  );
}
