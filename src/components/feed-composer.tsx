import { type ChangeEvent, type FormEvent, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { BarChart3, Calendar, FileText, Film, Image, Loader2, X } from "lucide-react";

import { feedApi } from "@/lib/api/feed";
import { getCurrentProfile } from "@/lib/api/profile/get-current-profile";
import { useMediaUpload } from "@/lib/use-media-upload";
import { texts } from "@/texts";
import type { CreatePostInput } from "@/types/application/feed/create-post-input";
import type { PostView } from "@/types/application/feed/post-view";
import type { MediaItem } from "@/types/components/feed/media-item";

import { ComposerAction } from "@/components/composer-action";
import { MentionTextarea } from "@/components/mention-textarea";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";

export function FeedComposer() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [postType, setPostType] = useState<PostView["type"]>("INSIGHT");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [publishError, setPublishError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const upload = useMediaUpload();

  const { data: profile } = useQuery({
    queryKey: ["me"],
    queryFn: getCurrentProfile,
  });

  const createPost = useMutation({
    mutationFn: (data: CreatePostInput) => feedApi.create(data),
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
      setMedia([]);
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : texts.feed.composer.publishError);
    }
  };

  const handleMediaSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (!isVideo && !isImage) continue;

      const hasExistingImages = media.some((item) => item.type === "image");
      const hasExistingVideo = media.some((item) => item.type === "video");

      if (isVideo && (hasExistingImages || hasExistingVideo || media.length >= 1)) break;
      if (isImage && hasExistingVideo) break;
      if (isImage && media.length >= 4) break;

      const preview = URL.createObjectURL(file);
      setMedia((previous) => [...previous, { type: isVideo ? "video" : "image", file, preview }]);
    }
    event.target.value = "";
  };

  const removeMedia = (index: number) => {
    setMedia((previous) => {
      URL.revokeObjectURL(previous[index].preview);
      return previous.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const mediaType = media.length > 0 ? (media[0].type === "image" ? "image" : "video") : null;

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

      {media.length > 0 && (
        <div className="relative mt-3">
          {mediaType === "image" ? (
            <div
              className={`grid gap-2 ${
                media.length === 1
                  ? "grid-cols-1"
                  : media.length === 2
                    ? "grid-cols-2"
                    : "grid-cols-2"
              }`}
            >
              {media.map((item, index) => (
                <div
                  key={index}
                  className="relative overflow-hidden rounded-xl border border-border-soft"
                >
                  <img
                    src={item.preview}
                    alt=""
                    className="h-48 w-full object-cover bg-surface-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-surface-card/80 text-text-strong shadow hover:bg-surface-card"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-xl border border-border-soft">
              <video src={media[0].preview} controls className="max-h-64 w-full bg-surface-1" />
              <button
                type="button"
                onClick={() => removeMedia(0)}
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-surface-card/80 text-text-strong shadow hover:bg-surface-card"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

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
