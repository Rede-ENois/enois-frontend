import { type FormEvent, useState } from "react";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { TOPIC_LABELS } from "@/constants/community-topics";
import { texts } from "@/texts";
import type { PostView } from "@/types/application/feed/post-view";
import { InfiniteScroll } from "@rede-enois/design-system/patterns";
import { Button } from "@rede-enois/design-system/ui";
import { ArrowLeft, Hash, Lock } from "lucide-react";

import { communitiesApi, feedApi } from "@/lib/api";
import { litePageSize } from "@/lib/lite-mode";
import { useIsAuthenticated } from "@/lib/use-auth";
import { useLiteMode } from "@/lib/use-lite-mode";

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

  const publish = useMutation({
    mutationFn: () =>
      feedApi.create({
        type: "INSIGHT",
        content: draft.trim(),
        communityId,
        channelId,
      }),
    onSuccess: () => {
      setDraft("");
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
    if (!draft.trim()) return;
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
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={texts.channelPage.composerPlaceholder}
              maxLength={1200}
              rows={3}
              className="w-full resize-y rounded-2xl border border-border bg-muted/40 px-3 py-2 text-sm font-normal outline-none transition focus:border-primary"
            />

            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

            <div className="mt-3 flex justify-end">
              <Button
                type="submit"
                className="w-auto rounded-full"
                disabled={publish.isPending || !draft.trim()}
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
