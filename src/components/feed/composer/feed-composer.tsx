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
  draft: string;
  postType: PostView["type"];
  media: LocalMediaItem[];
  publishError: string | null;
  isUploading: boolean;
  uploadProgress: number;
  isPublishing: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onDraftChange: (value: string, mentionedUserIds: string[]) => void;
  onPostTypeChange: (type: PostView["type"]) => void;
  onMediaSelect: (files: FileList) => void;
  onRemoveMedia: (index: number) => void;
};

export function FeedComposer({
  profile,
  draft,
  postType,
  media,
  publishError,
  isUploading,
  uploadProgress,
  isPublishing,
  onSubmit,
  onDraftChange,
  onPostTypeChange,
  onMediaSelect,
  onRemoveMedia,
}: FeedComposerProps) {
  const mediaType = getLocalMediaTypeFromItems(media);

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-border-soft bg-surface-card p-4 sm:p-5"
    >
      <FeedComposerInput profile={profile} draft={draft} onDraftChange={onDraftChange} />
      <ComposerMediaPreview media={media} mediaType={mediaType} onRemove={onRemoveMedia} />
      <FeedComposerToolbar
        draft={draft}
        postType={postType}
        media={media}
        mediaType={mediaType}
        publishError={publishError}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        isPublishing={isPublishing}
        onPostTypeChange={onPostTypeChange}
        onMediaSelect={onMediaSelect}
      />
    </form>
  );
}
