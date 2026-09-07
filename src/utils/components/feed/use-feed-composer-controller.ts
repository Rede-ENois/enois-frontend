import { type FormEvent, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, Calendar, FileText, Film, Image } from "lucide-react";

import { texts } from "@/texts";
import type { CreatePostInput } from "@/types/application/feed/create-post-input";
import type { PostView } from "@/types/application/feed/post-view";

import { createPost as createPostRequest } from "@/lib/api/feed/create-post";
import { getCurrentProfile } from "@/lib/api/profile/get-current-profile";
import { useMediaUpload } from "@/lib/use-media-upload";

import { useFeedComposerMedia } from "@/utils/components/feed/use-feed-composer-media";

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

  const isUploading = upload.status === "uploading";
  const isPublishing = createPost.isPending || isUploading;
  const composerActions = [
    {
      key: "insight",
      icon: Image,
      label: texts.feed.composer.types.insight,
      active: postType === "INSIGHT",
      onClick: () => setPostType("INSIGHT"),
    },
    {
      key: "article",
      icon: FileText,
      label: texts.feed.composer.types.article,
      active: postType === "ARTICLE",
      onClick: () => setPostType("ARTICLE"),
    },
    {
      key: "question",
      icon: BarChart3,
      label: texts.feed.composer.types.question,
      active: postType === "QUESTION",
      onClick: () => setPostType("QUESTION"),
    },
    {
      key: "project",
      icon: Calendar,
      label: texts.feed.composer.types.project,
      active: postType === "PROJECT",
      onClick: () => setPostType("PROJECT"),
    },
    {
      key: "media",
      icon: mediaController.mediaType === "video" ? Film : Image,
      label:
        mediaController.mediaType === "video"
          ? texts.feed.composer.video
          : mediaController.media.length > 0
            ? texts.feed.composer.mediaCount(mediaController.media.length)
            : texts.feed.composer.media,
      active: mediaController.media.length > 0,
      onClick: () => mediaController.fileRef.current?.click(),
    },
  ];

  return {
    profile,
    draft,
    publishError,
    publishPost,
    handleDraftChange,
    composerActions,
    publishDisabled: !draft.trim() || isPublishing,
    isPublishing,
    publishButtonLabel: isUploading
      ? texts.common.sending
      : createPost.isPending
        ? texts.common.publishing
        : texts.common.publish,
    uploadProgressText:
      !publishError && isUploading
        ? texts.feed.composer.uploadProgress(upload.progress)
        : null,
    ...mediaController,
  };
}
