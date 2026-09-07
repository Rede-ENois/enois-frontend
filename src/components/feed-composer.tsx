import { texts } from "@/texts";
import { Loader2 } from "lucide-react";

import { useFeedComposerController } from "@/utils/components/feed/use-feed-composer-controller";

import { Button } from "@/components/ui/button";

import { ComposerAction } from "@/components/composer-action";
import { FeedComposerMediaPreview } from "@/components/feed-composer-media-preview";
import { MentionTextarea } from "@/components/mention-textarea";
import { UserAvatar } from "@/components/user-avatar";

export function FeedComposer() {
  const {
    profile,
    draft,
    publishError,
    publishPost,
    handleDraftChange,
    composerActions,
    publishDisabled,
    isPublishing,
    publishButtonLabel,
    uploadProgressText,
    media,
    fileRef,
    handleMediaSelect,
    removeMedia,
  } = useFeedComposerController();

  return (
    <form
      onSubmit={publishPost}
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
          onChange={handleDraftChange}
          placeholder={texts.feed.composer.placeholder}
          className="min-h-11 flex-1 resize-none rounded-2xl border-border-soft bg-surface-1 px-3 py-2 text-[14px] font-light"
          maxLength={600}
        />
      </div>

      <FeedComposerMediaPreview media={media} onRemove={removeMedia} />
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handleMediaSelect}
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border-soft pt-3 text-[13px] font-light text-text-subtle">
        <div className="flex flex-wrap gap-1.5">
          {composerActions.map(({ key, ...action }) => (
            <ComposerAction key={key} {...action} />
          ))}
        </div>

        <div className="flex items-center gap-2">
          {publishError && (
            <p className="max-w-[200px] truncate text-[12px] font-light text-destructive">
              {publishError}
            </p>
          )}
          {uploadProgressText && (
            <span className="text-[12px] font-light text-text-subtle">{uploadProgressText}</span>
          )}
          <Button size="sm" className="rounded-full" disabled={publishDisabled}>
            {isPublishing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />

                <>{publishButtonLabel}</>
              </>
            ) : (
              publishButtonLabel
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
