import { type FormEvent, useRef, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import {
  BarChart3,
  Calendar,
  FileText,
  Film,
  Image,
  Loader2,
  TrendingUp,
  UserPlus,
  X,
} from "lucide-react";

import { eventsApi, feedApi, networkApi } from "@/lib/api";
import type { PostView } from "@/lib/api";
import { requireAuth } from "@/lib/require-auth";
import { useAuth } from "@/lib/use-auth";
import { useMediaUpload } from "@/lib/use-media-upload";
import { useEventsQuery, useFeedQuery, useNetworkSuggestionsQuery } from "@/hooks/use-feed-data";
import { texts } from "@/texts";
import {
  appendLocalMedia,
  getLocalMediaTypeFromItems,
  removeLocalMedia,
  type LocalMediaItem,
  type LocalMediaType,
} from "@/utils/media";

import { Button } from "@/components/ui/button";

import { AppContainer } from "@/components/app-container";
import { MentionTextarea } from "@/components/mention-textarea";
import { PostCard } from "@/components/post-card";
import { UserAvatar } from "@/components/user-avatar";

const composerPostActions: Array<{
  type: PostView["type"];
  icon: React.ElementType;
  label: string;
}> = [
  { type: "INSIGHT", icon: Image, label: texts.feed.composer.types.insight },
  { type: "ARTICLE", icon: FileText, label: texts.feed.composer.types.article },
  { type: "QUESTION", icon: BarChart3, label: texts.feed.composer.types.question },
  { type: "PROJECT", icon: Calendar, label: texts.feed.composer.types.project },
];

const feedTabs = [
  { value: "FOR_YOU", label: texts.feed.tabs.forYou },
  { value: "ALL", label: texts.feed.tabs.all },
  { value: "FOLLOWING", label: texts.feed.tabs.following },
  { value: "RECENT", label: texts.feed.tabs.discussions },
  { value: "PROJECTS", label: texts.feed.tabs.projects },
] as const;

export const Route = createFileRoute("/feed")({
  beforeLoad: requireAuth,
  head: () => ({
    meta: [
      { title: texts.feed.seo.title },
      { name: "description", content: texts.feed.seo.description },
    ],
  }),
  component: Home,
});

function Home() {
  const queryClient = useQueryClient();
  const { user: profileUser } = useAuth();
  const [tab, setTab] = useState<string | undefined>("FOR_YOU");
  const { data: feedData, isFetching: feedLoading } = useFeedQuery(tab);
  const { data: suggestions } = useNetworkSuggestionsQuery(4);
  const { data: eventsData } = useEventsQuery();

  const [draft, setDraft] = useState("");
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [postType, setPostType] = useState<PostView["type"]>("INSIGHT");
  const [media, setMedia] = useState<LocalMediaItem[]>([]);
  const [publishError, setPublishError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const upload = useMediaUpload();

  const createPost = useMutation({
    mutationFn: (data: {
      content: string;
      type: PostView["type"];
      mediaIds?: string[];
      mentionedUserIds?: string[];
    }) => feedApi.create(data),
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

  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;
    setMedia((current) => appendLocalMedia(current, files));
    event.target.value = "";
  };

  const mediaType = getLocalMediaTypeFromItems(media);
  const mediaLabels: Record<LocalMediaType, string> = {
    image: texts.feed.composer.mediaCount(media.length),
    video: texts.feed.composer.video,
  };
  const mediaLabel = mediaType ? mediaLabels[mediaType] : texts.feed.composer.media;
  const MediaIcon = mediaType === "video" ? Film : Image;
  const isUploading = upload.status === "uploading";
  const isPublishing = createPost.isPending || isUploading;
  const publishingLabel = isUploading ? texts.common.sending : texts.common.publishing;

  const feedPosts = feedData?.items ?? [];
  const suggestionList = suggestions ?? [];
  const eventList = eventsData?.items ?? [];

  return (
    <AppContainer>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <form
            onSubmit={publishPost}
            className="rounded-2xl border border-border-soft bg-surface-card p-4 sm:p-5"
          >
            <div className="flex items-center gap-3">
              <UserAvatar
                src={profileUser?.avatar}
                alt={profileUser?.name ?? texts.feed.you}
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
                  <div className={`grid gap-2 ${media.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                    {media.map((item, index) => (
                      <div
                        key={item.preview}
                        className="relative overflow-hidden rounded-xl border border-border-soft"
                      >
                        <img
                          src={item.preview}
                          alt=""
                          className="h-48 w-full object-cover bg-surface-1"
                        />
                        <button
                          type="button"
                          onClick={() => setMedia((items) => removeLocalMedia(items, index))}
                          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-surface-card/80 text-text-strong shadow hover:bg-surface-card"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="relative overflow-hidden rounded-xl border border-border-soft">
                    <video
                      src={media[0].preview}
                      controls
                      className="max-h-64 w-full bg-surface-1"
                    />
                    <button
                      type="button"
                      onClick={() => setMedia((items) => removeLocalMedia(items, 0))}
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
                {composerPostActions.map((action) => (
                  <ComposerAction
                    key={action.type}
                    icon={action.icon}
                    label={action.label}
                    active={postType === action.type}
                    onClick={() => setPostType(action.type)}
                  />
                ))}
                <ComposerAction
                  icon={MediaIcon}
                  label={mediaLabel}
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
                {!publishError && isUploading && (
                  <span className="text-[12px] font-light text-text-subtle">
                    {texts.feed.composer.uploadProgress(upload.progress)}
                  </span>
                )}
                <Button
                  size="sm"
                  className="rounded-full"
                  disabled={!draft.trim() || isPublishing}
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> {publishingLabel}
                    </>
                  ) : (
                    texts.common.publish
                  )}
                </Button>
              </div>
            </div>
          </form>

          <div className="flex flex-wrap items-center gap-1.5">
            {feedTabs.map((feedTab) => (
              <TabPill
                key={feedTab.value}
                active={tab === feedTab.value}
                onClick={() => setTab(feedTab.value)}
              >
                {feedTab.label}
              </TabPill>
            ))}
          </div>

          <div className="space-y-4">
            {feedLoading && (
              <div className="flex items-center justify-center py-8 text-text-subtle">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
            {!feedLoading && feedPosts.map((post) => <PostCard key={post.id} post={post} />)}
          </div>
        </div>

        <aside className="sticky top-20 hidden max-h-[calc(100vh-6rem)] space-y-4 overflow-y-auto lg:block">
          {profileUser && (
            <div className="overflow-hidden rounded-2xl border border-border-soft bg-surface-card">
              <div className="h-14" style={{ background: "var(--gradient-primary)" }} />
              <div className="-mt-7 px-4 pb-4 text-center">
                <UserAvatar
                  src={profileUser.avatar}
                  alt={profileUser.name}
                  className="mx-auto h-16 w-16 ring-4 ring-surface-card"
                />
                <Link
                  to="/perfil/$username"
                  params={{ username: profileUser.username }}
                  className="mt-2 block text-[14px] font-light text-text-strong hover:underline"
                >
                  {profileUser.name}
                </Link>
                <p className="line-clamp-2 text-[12px] font-light text-text-subtle">
                  {profileUser.headline}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-1 border-t border-border-soft pt-3 text-[12px]">
                  <div>
                    <p className="font-light text-text-strong">{profileUser.connectionsCount}</p>
                    <p className="text-text-subtle">{texts.feed.sidebar.connections}</p>
                  </div>
                  <div>
                    <p className="font-light text-text-strong">{profileUser.followersCount}</p>
                    <p className="text-text-subtle">{texts.feed.sidebar.followers}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {suggestionList.length > 0 && (
            <div className="rounded-2xl border border-border-soft bg-surface-card p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" />
                <h3 className="text-[14px] font-light text-text-strong">
                  {texts.feed.sidebar.suggestions}
                </h3>
              </div>
              <p className="mt-0.5 text-[12px] font-light text-text-subtle">
                {texts.feed.sidebar.suggestionsDescription}
              </p>
              <ul className="mt-4 space-y-3">
                {suggestionList.map((user) => (
                  <li key={user.id} className="flex items-center gap-3">
                    <UserAvatar src={user.avatar} alt={user.name} className="h-10 w-10" />
                    <div className="min-w-0 flex-1">
                      <Link
                        to="/perfil/$username"
                        params={{ username: user.username }}
                        className="block truncate text-[13px] font-light text-text-strong hover:underline"
                      >
                        {user.name}
                      </Link>
                      <p className="truncate text-[11px] font-light text-text-subtle">
                        {user.headline}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 rounded-full border border-border-soft px-3 py-1 text-[12px] font-light text-text-subtle transition hover:border-primary hover:text-primary"
                      onClick={() =>
                        networkApi.connect(user.id).then(() =>
                          queryClient.invalidateQueries({
                            queryKey: ["network", "suggestions"],
                          }),
                        )
                      }
                    >
                      {texts.feed.sidebar.connect}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {eventList.length > 0 && (
            <div className="rounded-2xl border border-border-soft bg-surface-card p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h3 className="text-[14px] font-light text-text-strong">
                  {texts.feed.sidebar.happeningNow}
                </h3>
              </div>
              <ul className="mt-3 space-y-3">
                {eventList.slice(0, 3).map((event) => (
                  <li key={event.id}>
                    <p className="text-[13px] font-light text-text-strong">{event.title}</p>
                    <p className="text-[11px] font-light text-text-subtle">
                      {event.date} · {event.format} · {texts.feed.sidebar.confirmed(event.attendees)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </AppContainer>
  );
}

function ComposerAction({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-light transition ${
        active
          ? "bg-primary text-primary-foreground"
          : "border border-border-soft text-text-subtle hover:border-primary hover:text-primary"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function TabPill({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-light transition ${
        active
          ? "bg-primary text-primary-foreground"
          : "border border-border-soft bg-surface-card text-text-subtle hover:border-primary hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}
