import { type FormEvent, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { BarChart3, Calendar, FileText, Film, Image, Loader2 } from "lucide-react";

import { createPost as createPostRequest } from "@/lib/api/feed/create-post";
import { getCurrentProfile } from "@/lib/api/profile/get-current-profile";
import { useFeedComposerMedia } from "@/lib/use-feed-composer-media";
import { useMediaUpload } from "@/lib/use-media-upload";
import { texts } from "@/texts";
import type { CreatePostInput } from "@/types/application/feed/create-post-input";
import type { PostView } from "@/types/application/feed/post-view";

import { ComposerAction } from "@/components/composer-action";
import { FeedComposerMediaPreview } from "@/components/feed-composer-media-preview";
import { MentionTextarea } from "@/components/mention-textarea";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";

export function FeedComposer() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [postType, setPostType] = useState<PostView["type"]>("INSIGHT");
  const [publishError, setPublishError] = useState<string | null>(null);
  const upload = useMediaUpload();
  const {
    media,
    mediaType,
    fileRef,
    handleMediaSelect,
    removeMedia,
    clearMedia,
  } = useFeedComposerMedia();

  const { data: profile } = useQuery({
    queryKey: ["me"],
    queryFn: getCurrentProfile,
  });

  const createPost = useMutation({
    mutationFn: (data: CreatePostInput) => createPostRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const publishPost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;

    setPublishError(null);
    try {
      let mediaIds: string[] = [];
      if (media.length > 0) {
        const results = await upload.uploadAll(media.map((item) => ({ file: item.file })));
        mediaIds = results.map((result) => result.mediaId);
      }
      await createPost.mutateAsync({ content, type: postType, mediaIds, mentionedUserIds });
      setDraft("");
      setMentionedUserIds([]);
      setPostType("INSIGHT");
      clearMedia();
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : texts.feed.composer.publishError);
    }
  };

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
          onChange={(value, ids) => {
            setDraft(value);
            setMentionedUserIds(ids);
          }}
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
          <ComposerAction
            icon={Image}
            label={texts.feed.composer.types.insight}
            active={postType === "INSIGHT"}
            onClick={() => setPostType("INSIGHT")}
          />
          <ComposerAction
            icon={FileText}
            label={texts.feed.composer.types.article}
            active={postType === "ARTICLE"}
            onClick={() => setPostType("ARTICLE")}
          />
          <ComposerAction
            icon={BarChart3}
            label={texts.feed.composer.types.question}
            active={postType === "QUESTION"}
            onClick={() => setPostType("QUESTION")}
          />
          <ComposerAction
            icon={Calendar}
            label={texts.feed.composer.types.project}
            active={postType === "PROJECT"}
            onClick={() => setPostType("PROJECT")}
          />
          <ComposerAction
            icon={mediaType === "video" ? Film : Image}
            label={
              mediaType === "video"
                ? texts.feed.composer.video
                : media.length > 0
                  ? texts.feed.composer.mediaCount(media.length)
                  : texts.feed.composer.media
            }
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
          {!publishError && upload.status === "uploading" && (
            <span className="text-[12px] font-light text-text-subtle">
              {texts.feed.composer.uploadProgress(upload.progress)}
            </span>
          )}
          <Button
            size="sm"
            className="rounded-full"
            disabled={!draft.trim() || createPost.isPending || upload.status === "uploading"}
          >
            {createPost.isPending || upload.status === "uploading" ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <>
                  {upload.status === "uploading" ? texts.common.sending : texts.common.publishing}
                </>
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
