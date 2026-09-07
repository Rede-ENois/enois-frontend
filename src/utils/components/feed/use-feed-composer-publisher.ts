import { type FormEvent, useState } from "react";

import { texts } from "@/texts";
import type { PostView } from "@/types/application/feed/post-view";
import type { MediaItem } from "@/types/components/feed/media-item";

import { useMediaUpload } from "@/lib/use-media-upload";

import { useCreateFeedPost } from "@/utils/components/feed/use-create-feed-post";

export function useFeedComposerPublisher(
  draft: string,
  mentionedUserIds: string[],
  postType: PostView["type"],
  media: MediaItem[],
  reset: () => void,
) {
  const [publishError, setPublishError] = useState<string | null>(null);
  const upload = useMediaUpload();
  const { createPost, createPending } = useCreateFeedPost();

  const publishPost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;

    setPublishError(null);
    try {
      const results = await upload.uploadAll(media.map((item) => ({ file: item.file })));
      const mediaIds = results.map((result) => result.mediaId);
      await createPost({ content, type: postType, mediaIds, mentionedUserIds });
      reset();
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : texts.feed.composer.publishError);
    }
  };

  return {
    publishError,
    publishPost,
    isUploading: upload.status === "uploading",
    uploadProgress: upload.progress,
    createPending,
  };
}
