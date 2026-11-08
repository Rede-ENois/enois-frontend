import { type FormEvent, useState } from "react";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { TOPIC_LABELS } from "@/constants/community-topics";
import { texts } from "@/texts";
import type { PostView } from "@/types/application/feed/post-view";
import type { MediaItem } from "@/types/routes/feed/media-item";
import { ComposerMediaPicker } from "@rede-enois/design-system/domain";
import { InfiniteScroll } from "@rede-enois/design-system/patterns";
import { Button } from "@rede-enois/design-system/ui";
import { ArrowLeft, Hash, Lock } from "lucide-react";

import { communitiesApi, feedApi } from "@/lib/api";
import { litePageSize } from "@/lib/lite-mode";
import { isProhibitedContent } from "@/lib/media-moderation";
import { mediaPreviewUrl } from "@/lib/media-preview-url";
import { uploadComposerMedia } from "@/lib/upload-composer-media";
import { useIsAuthenticated } from "@/lib/use-auth";
import { useLiteMode } from "@/lib/use-lite-mode";
import { useMediaUpload } from "@/lib/use-media-upload";

import { AppContainer } from "@/components/app-container";
import { PostCard } from "@/components/post-card";

export const Route = createFileRoute("/comunidades/$communityId/canais/$channelId")({
  head: () => ({
    meta: [{ title: `${texts.communityChannels.title} · Énóis` }],
  }),
  component: ChannelPage,
});

/** Tamanho que o mural sempre usou; em modo lite cada página vem maior. */
const CHANNEL_POSTS_PAGE_SIZE = 20;

function ChannelPage() {
  const { communityId, channelId } = Route.useParams();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const authenticated = useIsAuthenticated();
  const lite = useLiteMode();

  const community = useQuery({
    queryKey: ["community", communityId],
    queryFn: () => communitiesApi.get(communityId),
  });

  const joined = Boolean(community.data?.joined);

  const channels = useQuery({
    queryKey: ["community", communityId, "channels"],
    queryFn: () => communitiesApi.channels(communityId),
    enabled: authenticated && joined,
    retry: false,
  });

  const channel = channels.data?.find((item) => item.id === channelId);

  const posts = useInfiniteQuery({
    queryKey: ["community", communityId, "channel", channelId, "posts"],
    queryFn: ({ pageParam }) =>
      communitiesApi.channelPosts(
        communityId,
        channelId,
        pageParam,
        litePageSize(CHANNEL_POSTS_PAGE_SIZE, lite),
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: authenticated && joined,
    retry: false,
  });

  const upload = useMediaUpload();

  // Mesmo seletor do feed e do grupo: até 4 imagens, upload já na seleção.
  const addMediaFiles = (files: File[]) => {
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      if (media.length >= 4) break;

      const preview = URL.createObjectURL(file);
      const item: MediaItem = { type: "image", file, preview, moderationStatus: "checking" };
      setMedia((prev) => [...prev, item]);
      void upload
        .upload(file, "POST_IMAGE")
        .then((result) =>
          setMedia((current) =>
            current.map((entry) =>
              entry.preview === preview
                ? { ...entry, mediaId: result.mediaId, moderationStatus: "allowed" }
                : entry,
            ),
          ),
        )
        .catch((err: unknown) => {
          if (isProhibitedContent(err)) {
            setMedia((current) =>
              current.map((entry) =>
                entry.preview === preview ? { ...entry, moderationStatus: "prohibited" } : entry,
              ),
            );
            setError(texts.feed.composer.imageProhibitedTitle);
            return;
          }
          setMedia((current) => current.filter((entry) => entry.preview !== preview));
          URL.revokeObjectURL(preview);
          setError(err instanceof Error ? err.message : texts.channelPage.error);
        });
    }
  };
  const removeMedia = (index: number) => {
    setMedia((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const publish = useMutation({
    mutationFn: async () => {
      // As imagens sobem primeiro; a publicação leva só os ids.
      const mediaIds = media.length > 0 ? await uploadComposerMedia(media, upload.uploadAll) : [];
      return feedApi.create({
        type: "INSIGHT",
        content: draft.trim(),
        mediaIds,
        communityId,
        channelId,
      });
    },
    onSuccess: () => {
      setDraft("");
      setMedia([]);
      setError(null);
      void queryClient.invalidateQueries({
        queryKey: ["community", communityId, "channel", channelId, "posts"],
      });
    },
    onError: (err) => setError(err instanceof Error ? err.message : texts.channelPage.error),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!draft.trim() && media.length === 0) return;
    publish.mutate();
  };

  const items: PostView[] = posts.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-2xl space-y-4 py-6">
        <Link
          to="/comunidades/$communityId"
          params={{ communityId }}
          className="inline-flex items-center gap-1.5 text-sm text-text-subtle transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />

          <>{texts.channelPage.back}</>
        </Link>

        <header className="surface-card p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
              <Hash className="h-5 w-5" />
            </span>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight text-text-strong">
                {channel?.name ?? texts.communityChannels.title}
              </h1>

              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-text-subtle">
                <Lock className="h-3.5 w-3.5" />

                <>{texts.channelPage.private}</>
              </p>

              {channel?.topic && (
                <p className="mt-1 text-xs font-medium text-primary">
                  {TOPIC_LABELS[channel.topic as keyof typeof TOPIC_LABELS]}
                </p>
              )}

              {channel?.description && (
                <p className="mt-1 text-sm text-text-subtle">{channel.description}</p>
              )}
            </div>
          </div>
        </header>

        {!authenticated && (
          <section className="surface-card space-y-3 p-5">
            <p className="text-sm text-text-subtle">{texts.channelPage.notMember}</p>

            <Button asChild className="rounded-full">
              <Link to="/entrar" search={{ tab: "login" }}>
                {texts.common.enter}
              </Link>
            </Button>
          </section>
        )}

        {authenticated && community.data && !joined && (
          <section className="surface-card space-y-3 p-5">
            <p className="text-sm text-text-subtle">{texts.channelPage.notMember}</p>

            <Button asChild className="rounded-full">
              <Link to="/comunidades/$communityId" params={{ communityId }}>
                {texts.channelPage.enter}
              </Link>
            </Button>
          </section>
        )}

        {authenticated && joined && (
          <form onSubmit={submit} className="surface-card p-5">
            <textarea
              aria-label={texts.channelPage.composerPlaceholder}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={texts.channelPage.composerPlaceholder}
              maxLength={1200}
              rows={3}
              className="w-full resize-y rounded-2xl border border-border bg-muted/40 px-3 py-2 text-sm font-normal outline-none transition focus:border-primary"
            />
            <ComposerMediaPicker
              items={media.flatMap((item) => {
                // A prévia só vira `src` depois de conferida como `blob:`; o que não passa
                // simplesmente não é desenhado.
                const preview = mediaPreviewUrl(item.preview);
                return preview
                  ? [
                      {
                        preview,
                        status:
                          item.moderationStatus === "checking"
                            ? "checking"
                            : item.moderationStatus === "prohibited"
                              ? "prohibited"
                              : "allowed",
                      } as const,
                    ]
                  : [];
              })}
              onFiles={addMediaFiles}
              onRemove={removeMedia}
              canAddMore={media.length < 4}
            />

            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

            <div className="mt-3 flex items-center justify-end gap-2">
              <Button
                type="submit"
                className="w-auto rounded-full"
                disabled={publish.isPending || (!draft.trim() && media.length === 0)}
              >
                {publish.isPending ? texts.channelPage.publishing : texts.channelPage.publish}
              </Button>
            </div>
          </form>
        )}

        {authenticated && joined && (
          <div className="space-y-4">
            {items.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}

            {!posts.isLoading && items.length === 0 && (
              <p className="surface-card p-5 text-sm text-text-subtle">{texts.channelPage.empty}</p>
            )}

            <InfiniteScroll
              hasMore={Boolean(posts.hasNextPage)}
              loading={posts.isFetchingNextPage}
              onLoadMore={() => {
                if (posts.hasNextPage && !posts.isFetchingNextPage) {
                  void posts.fetchNextPage();
                }
              }}
            />
          </div>
        )}

        {authenticated && joined && posts.isError && (
          <p className="text-sm text-destructive">{texts.channelPage.error}</p>
        )}
      </div>
    </AppContainer>
  );
}
