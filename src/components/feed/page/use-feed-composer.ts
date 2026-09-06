import { type FormEvent, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { feedApi } from "@/lib/api";
import type { CreatePostInput, PostView } from "@/lib/api";
import { useMediaUpload } from "@/lib/use-media-upload";
import { texts } from "@/texts";
import { appendLocalMedia, removeLocalMedia, type LocalMediaItem } from "@/utils/media";

export function useFeedComposer() {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [postType, setPostType] = useState<PostView["type"]>("INSIGHT");
  const [mediaItems, setMediaItems] = useState<LocalMediaItem[]>([]);
  const [publicationError, setPublicationError] = useState<string | null>(null);
  const mediaUpload = useMediaUpload();

  const createPostMutation = useMutation({
    mutationFn: (input: CreatePostInput) => feedApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feed"] }),
  });

  const handlePublish = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent) return;
    setPublicationError(null);
    try {
      const uploadResults = mediaItems.length > 0
        ? await mediaUpload.uploadAll(mediaItems.map((mediaItem) => ({ file: mediaItem.file })))
        : [];
      await createPostMutation.mutateAsync({
        content: trimmedContent,
        type: postType,
        mediaIds: uploadResults.map((uploadResult) => uploadResult.mediaId),
        mentionedUserIds,
      });
      setContent("");
      setMentionedUserIds([]);
      setPostType("INSIGHT");
      setMediaItems([]);
    } catch (error) {
      setPublicationError(error instanceof Error ? error.message : texts.feed.composer.publishError);
    }
  };

  return {
    content,
    postType,
    mediaItems,
    publicationError,
    isUploading: mediaUpload.status === "uploading",
    uploadProgress: mediaUpload.progress,
    isPublishing: createPostMutation.isPending || mediaUpload.status === "uploading",
    handlePublish,
    setContent: (value: string, userIds: string[]) => {
      setContent(value);
      setMentionedUserIds(userIds);
    },
    setPostType,
    handleAddMedia: (files: FileList) =>
      setMediaItems((currentItems) => appendLocalMedia(currentItems, files)),
    handleRemoveMedia: (index: number) =>
      setMediaItems((currentItems) => removeLocalMedia(currentItems, index)),
  };
}
