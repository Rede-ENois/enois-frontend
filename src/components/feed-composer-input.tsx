import { texts } from "@/texts";
import type { FeedComposerInputProps } from "@/types/components/feed/feed-composer-input-props";

import { FeedComposerMediaPreview } from "@/components/feed-composer-media-preview";
import { MentionTextarea } from "@/components/mention-textarea";
import { UserAvatar } from "@/components/user-avatar";

export function FeedComposerInput({
  profile,
  draft,
  onDraftChange,
  media,
  fileRef,
  onMediaSelect,
  onRemoveMedia,
}: FeedComposerInputProps) {
  return (
    <>
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

      <FeedComposerMediaPreview media={media} onRemove={onRemoveMedia} />
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={onMediaSelect}
      />
    </>
  );
}
