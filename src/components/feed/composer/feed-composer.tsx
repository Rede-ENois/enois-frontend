import { type FormEventHandler, useRef } from "react";

import { BarChart3, Calendar, FileText, Film, Image, Loader2 } from "lucide-react";

import type { PostView, Profile } from "@/lib/api";
import { texts } from "@/texts";
import {
  getLocalMediaTypeFromItems,
  type LocalMediaItem,
  type LocalMediaType,
} from "@/utils/media";

import { MentionTextarea } from "@/components/mention-textarea";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { ComposerAction } from "./composer-action";
import { ComposerMediaPreview } from "./composer-media-preview";

const composerPostActions: Array<{
  type: PostView["type"];
  icon: React.ElementType;
  label: string;
}> = [
  { type: "INSIGHT", icon: Image, label: texts.feed.composer.types.insight },
  { type: "ARTICLE", icon: FileText, label: texts.feed.composer.types.article },
  { type: "QUESTION", icon: BarChart3, label: texts.feed.composer.types.question },
  { type: "PROJECT", icon: Calendar, label: texts.feed.composer.types.project },
];

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
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaType = getLocalMediaTypeFromItems(media);
  const mediaLabels: Record<LocalMediaType, string> = {
    image: texts.feed.composer.mediaCount(media.length),
    video: texts.feed.composer.video,
  };
  const mediaLabel = mediaType ? mediaLabels[mediaType] : texts.feed.composer.media;
  const MediaIcon = mediaType === "video" ? Film : Image;
  const publishingLabel = isUploading ? texts.common.sending : texts.common.publishing;

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-border-soft bg-surface-card p-4 sm:p-5"
    >
      <div className="flex items-center gap-3">
        <UserAvatar
          src={profile?.avatar}
          alt={profile?.name ?? texts.feed.you}
          className="h-11 w-11"
        />
        <MentionTextarea
          value={draft}
          onChange={onDraftChange}
          placeholder={texts.feed.composer.placeholder}
          className="min-h-11 flex-1 resize-none rounded-2xl border-border-soft bg-surface-1 px-3 py-2 text-[14px] font-light"
          maxLength={600}
        />
      </div>

      <ComposerMediaPreview media={media} mediaType={mediaType} onRemove={onRemoveMedia} />

      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files?.length) onMediaSelect(event.target.files);
          event.target.value = "";
        }}
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border-soft pt-3 text-[13px] font-light text-text-subtle">
        <div className="flex flex-wrap gap-1.5">
          {composerPostActions.map((action) => (
            <ComposerAction
              key={action.type}
              icon={action.icon}
              label={action.label}
              active={postType === action.type}
              onClick={() => onPostTypeChange(action.type)}
            />
          ))}
          <ComposerAction
            icon={MediaIcon}
            label={mediaLabel}
            active={media.length > 0}
            onClick={() => fileRef.current?.click()}
          />
        </div>

        <div className="flex items-center gap-2">
          {publishError && (
            <p className="max-w-[200px] truncate text-[12px] font-light text-destructive">
              {publishError}
            </p>
          )}
          {!publishError && isUploading && (
            <span className="text-[12px] font-light text-text-subtle">
              {texts.feed.composer.uploadProgress(uploadProgress)}
            </span>
          )}
          <Button size="sm" className="rounded-full" disabled={!draft.trim() || isPublishing}>
            {isPublishing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> {publishingLabel}
              </>
            ) : (
              texts.common.publish
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
