import { type FormEvent, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { CreatePostInput } from "@/types/application/feed/create-post-input";
import type { PostView } from "@/types/application/feed/post-view";
import type { MediaItem } from "@/types/components/feed/media-item";

import { createPost as createPostRequest } from "@/lib/api/feed/create-post";
import { useMediaUpload } from "@/lib/use-media-upload";

export function useFeedComposerPublisher(
  draft: string,
  mentionedUserIds: string[],
  postType: PostView["type"],
  media: MediaItem[],
  reset: () => void,
) {
  const queryClient = useQueryClient();
  const [publishError, setPublishError] = useState<string | null>(null);
  const upload = useMediaUpload();
  const createPost = useMutation({
    mutationFn: (data: CreatePostInput) => createPostRequest(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feed"] }),
  });

  const publishPost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;

    setPublishError(null);
    try {
      const results = await upload.uploadAll(media.map((item) => ({ file: item.file })));
      const mediaIds = results.map((result) => result.mediaId);
      await createPost.mutateAsync({ content, type: postType, mediaIds, mentionedUserIds });
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
    createPending: createPost.isPending,
  };
}
