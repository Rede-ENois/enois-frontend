import { type FormEvent, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createPost as createPostRequest } from "@/lib/api/feed/create-post";
import { getCurrentProfile } from "@/lib/api/profile/get-current-profile";
import { useFeedComposerMedia } from "@/lib/use-feed-composer-media";
import { useMediaUpload } from "@/lib/use-media-upload";
import { texts } from "@/texts";
import type { CreatePostInput } from "@/types/application/feed/create-post-input";
import type { PostView } from "@/types/application/feed/post-view";

export function useFeedComposerController() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [postType, setPostType] = useState<PostView["type"]>("INSIGHT");
  const [publishError, setPublishError] = useState<string | null>(null);
  const upload = useMediaUpload();
  const mediaController = useFeedComposerMedia();

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
      const results = await upload.uploadAll(
        mediaController.media.map((item) => ({ file: item.file })),
      );
      const mediaIds = results.map((result) => result.mediaId);
      await createPost.mutateAsync({ content, type: postType, mediaIds, mentionedUserIds });
      setDraft("");
      setMentionedUserIds([]);
      setPostType("INSIGHT");
      mediaController.clearMedia();
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : texts.feed.composer.publishError);
    }
  };

  const handleDraftChange = (value: string, userIds: string[]) => {
    setDraft(value);
    setMentionedUserIds(userIds);
  };

  return {
    profile,
    draft,
    postType,
    setPostType,
    publishError,
    upload,
    createPostPending: createPost.isPending,
    publishPost,
    handleDraftChange,
    ...mediaController,
  };
}
