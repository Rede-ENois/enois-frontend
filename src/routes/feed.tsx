import { type FormEvent, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { useEventsQuery, useFeedQuery, useNetworkSuggestionsQuery } from "@/hooks/use-feed-data";
import { feedApi, networkApi } from "@/lib/api";
import type { PostView } from "@/lib/api";
import { requireAuth } from "@/lib/require-auth";
import { useAuth } from "@/lib/use-auth";
import { useMediaUpload } from "@/lib/use-media-upload";
import { texts } from "@/texts";
import {
  appendLocalMedia,
  removeLocalMedia,
  type LocalMediaItem,
} from "@/utils/media";

import { AppContainer } from "@/components/app-container";
import { FeedComposer } from "@/components/feed/feed-composer";
import { FeedSidebar } from "@/components/feed/feed-sidebar";
import { FeedTabs } from "@/components/feed/feed-tabs";
import { FeedTimeline } from "@/components/feed/feed-timeline";

export const Route = createFileRoute("/feed")({
  beforeLoad: requireAuth,
  head: () => ({
    meta: [
      { title: texts.feed.seo.title },
      { name: "description", content: texts.feed.seo.description },
    ],
  }),
  component: FeedRoute,
});

function FeedRoute() {
  const queryClient = useQueryClient();
  const { user: profileUser } = useAuth();
  const [tab, setTab] = useState<string | undefined>("FOR_YOU");
  const [draft, setDraft] = useState("");
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [postType, setPostType] = useState<PostView["type"]>("INSIGHT");
  const [media, setMedia] = useState<LocalMediaItem[]>([]);
  const [publishError, setPublishError] = useState<string | null>(null);
  const upload = useMediaUpload();

  const { data: feedData, isFetching: feedLoading } = useFeedQuery(tab);
  const { data: suggestions } = useNetworkSuggestionsQuery(4);
  const { data: eventsData } = useEventsQuery();

  const createPost = useMutation({
    mutationFn: (data: {
      content: string;
      type: PostView["type"];
      mediaIds?: string[];
      mentionedUserIds?: string[];
    }) => feedApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feed"] }),
  });

  const publishPost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;

    setPublishError(null);
    try {
      const results =
        media.length > 0
          ? await upload.uploadAll(media.map((item) => ({ file: item.file })))
          : [];
      const mediaIds = results.map((result) => result.mediaId);

      await createPost.mutateAsync({ content, type: postType, mediaIds, mentionedUserIds });
      setDraft("");
      setMentionedUserIds([]);
      setPostType("INSIGHT");
      setMedia([]);
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : texts.feed.composer.publishError);
    }
  };

  const connectSuggestion = async (userId: string) => {
    await networkApi.connect(userId);
    queryClient.invalidateQueries({ queryKey: ["network", "suggestions"] });
  };

  const isUploading = upload.status === "uploading";
  const isPublishing = createPost.isPending || isUploading;

  return (
    <AppContainer>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <FeedComposer
            profile={profileUser}
            draft={draft}
            postType={postType}
            media={media}
            publishError={publishError}
            isUploading={isUploading}
            uploadProgress={upload.progress}
            isPublishing={isPublishing}
            onSubmit={publishPost}
            onDraftChange={(value, ids) => {
              setDraft(value);
              setMentionedUserIds(ids);
            }}
            onPostTypeChange={setPostType}
            onMediaSelect={(files) => setMedia((current) => appendLocalMedia(current, files))}
            onRemoveMedia={(index) => setMedia((current) => removeLocalMedia(current, index))}
          />

          <FeedTabs activeTab={tab} onChange={setTab} />
          <FeedTimeline posts={feedData?.items ?? []} loading={feedLoading} />
        </div>

        <FeedSidebar
          profile={profileUser}
          suggestions={suggestions ?? []}
          events={eventsData?.items ?? []}
          onConnect={connectSuggestion}
        />
      </div>
    </AppContainer>
  );
}
