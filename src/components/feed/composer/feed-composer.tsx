import type { FormEventHandler } from "react";

import type { PostView, Profile } from "@/lib/api";
import {
  getLocalMediaTypeFromItems,
  type LocalMediaItem,
} from "@/utils/media";

import { ComposerMediaPreview } from "./composer-media-preview";
import { FeedComposerInput } from "./feed-composer-input";
import { FeedComposerToolbar } from "./feed-composer-toolbar";

type FeedComposerProps = {
  profile: Profile | null | undefined;
  content: string;
  postType: PostView["type"];
  mediaItems: LocalMediaItem[];
  publicationError: string | null;
  isUploading: boolean;
  uploadProgress: number;
  isPublishing: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onContentChange: (value: string, mentionedUserIds: string[]) => void;
  onPostTypeChange: (type: PostView["type"]) => void;
  onMediaSelect: (files: FileList) => void;
  onRemoveMedia: (index: number) => void;
};

export function FeedComposer({
  profile,
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
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-border-soft bg-surface-card p-4 sm:p-5"
    >
      <FeedComposerInput profile={profile} content={content} onContentChange={onContentChange} />
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
