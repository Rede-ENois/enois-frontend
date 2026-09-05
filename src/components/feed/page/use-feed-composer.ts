import { type FormEvent, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { feedApi } from "@/lib/api";
import type { PostView } from "@/lib/api";
import { useMediaUpload } from "@/lib/use-media-upload";
import { texts } from "@/texts";
import { appendLocalMedia, removeLocalMedia, type LocalMediaItem } from "@/utils/media";

export function useFeedComposer() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [postType, setPostType] = useState<PostView["type"]>("INSIGHT");
  const [media, setMedia] = useState<LocalMediaItem[]>([]);
  const [publishError, setPublishError] = useState<string | null>(null);
  const upload = useMediaUpload();

  const createPost = useMutation({
    mutationFn: (data: {
      content: string;
      type: PostView["type"];
      mediaIds?: string[];
      mentionedUserIds?: string[];
    }) => feedApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feed"] }),
  });

  const publish = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setPublishError(null);
    try {
      const results = media.length > 0
        ? await upload.uploadAll(media.map((item) => ({ file: item.file })))
        : [];
      await createPost.mutateAsync({
        content,
        type: postType,
        mediaIds: results.map((result) => result.mediaId),
        mentionedUserIds,
      });
      setDraft("");
      setMentionedUserIds([]);
      setPostType("INSIGHT");
      setMedia([]);
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : texts.feed.composer.publishError);
    }
  };

  return {
    draft,
    postType,
    media,
    publishError,
    isUploading: upload.status === "uploading",
    uploadProgress: upload.progress,
    isPublishing: createPost.isPending || upload.status === "uploading",
    publish,
    setDraft: (value: string, ids: string[]) => { setDraft(value); setMentionedUserIds(ids); },
    setPostType,
    addMedia: (files: FileList) => setMedia((current) => appendLocalMedia(current, files)),
    removeMedia: (index: number) => setMedia((current) => removeLocalMedia(current, index)),
  };
}
