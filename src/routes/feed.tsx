import { type ChangeEvent, type FormEvent, useCallback, useRef, useState } from "react";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { PAGE_HTML_MAX_LENGTH } from "@/constants/post-page";
import { ARTICLE_BODY_MAX_LENGTH, POST_TYPES } from "@/constants/post-types";
import { texts } from "@/texts";
import type { CreatePostInput } from "@/types/application/feed/create-post-input";
import type { FeedTab } from "@/types/application/feed/feed-tab";
import type { PostView } from "@/types/application/feed/post-view";
import type { ComposerActionProps } from "@/types/routes/feed/composer-action-props";
import type { MediaItem } from "@/types/routes/feed/media-item";
import {
  BarChart3,
  Calendar,
  ChevronDown,
  Code2,
  FileText,
  Film,
  Image,
  Loader2,
  TrendingUp,
  UserPlus,
  X,
} from "lucide-react";

import { eventsApi, feedApi, networkApi, profileApi } from "@/lib/api";
import { buildPageShareTags } from "@/lib/open-graph";
import { requireAuth } from "@/lib/require-auth";
import { useMediaUpload } from "@/lib/use-media-upload";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Pill } from "@/components/ui/pill";
import { Textarea } from "@/components/ui/textarea";

import { AppContainer } from "@/components/app-container";
import { HtmlEditor } from "@/components/html-editor";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { MentionTextarea } from "@/components/mention-textarea";
import { PostCard } from "@/components/post-card";
import { UserAvatar } from "@/components/user-avatar";

export const Route = createFileRoute("/feed")({
  beforeLoad: requireAuth,
  head: () => ({
    meta: buildPageShareTags({
      title: texts.feed.seo.title,
      description: texts.feed.seo.description,
      path: "/feed",
    }),
  }),
  component: Home,
});

const FEED_PAGE_SIZE = 20;

function useFeed(tab: FeedTab) {
  // Pagina por cursor: o backend devolve nextCursor e o scroll infinito busca a proxima pagina.
  return useInfiniteQuery({
    queryKey: ["feed", tab],
    queryFn: ({ pageParam }) => feedApi.list(pageParam ?? null, FEED_PAGE_SIZE, tab),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

function useProfile() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => profileApi.me(),
  });
}

function useSuggestions() {
  return useQuery({
    queryKey: ["network", "suggestions"],
    queryFn: () => networkApi.suggestions(4),
  });
}

function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: () => eventsApi.list(),
  });
}

function Home() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<FeedTab>("FOR_YOU");
  const {
    data: feedData,
    // Somente a PRIMEIRA carga mostra o esqueleto. `isFetching` tambem fica true ao paginar, e
    // como o feed trocava a lista inteira pelo LoadingState a cada pagina, a tela voltava ao topo.
    isLoading: feedLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFeed(tab);
  const { data: profile } = useProfile();
  const { data: suggestions } = useSuggestions();
  const { data: eventsData } = useEvents();

  const [draft, setDraft] = useState("");
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [postType, setPostType] = useState<PostView["type"]>("INSIGHT");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [publishError, setPublishError] = useState<string | null>(null);
  // Tipo de publicação e o que manda: Página mostra o editor de HTML, Artigo mostra o editor do
  // texto longo, os demais usam o campo de cima. O seletor de tipos abre em painel recolhido — com
  // dez tipos, uma fileira de botões ocupava o composer inteiro e empurrava o texto para longe.
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [pageHtml, setPageHtml] = useState("");
  const [articleBody, setArticleBody] = useState("");
  const pageMode = postType === "PAGE";
  const articleMode = postType === "ARTICLE";
  const currentType = POST_TYPES.find((option) => option.id === postType) ?? POST_TYPES[0];
  const fileRef = useRef<HTMLInputElement>(null);
  const upload = useMediaUpload();

  const createPost = useMutation({
    mutationFn: (data: CreatePostInput) => feedApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const publishPost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    // Pagina e uma coisa OU outra: o HTML e o conteudo e o texto do post nao e exigido. Artigo
    // precisa de titulo (o texto de cima) E do corpo. Nos demais, o texto de cima e o post.
    if (pageMode ? !pageHtml.trim() : !content) return;
    if (articleMode && !articleBody.trim()) return;

    setPublishError(null);
    try {
      let mediaIds: string[] = [];
      if (!pageMode && media.length > 0) {
        const results = await upload.uploadAll(media.map((m) => ({ file: m.file })));
        mediaIds = results.map((r) => r.mediaId);
      }
      await createPost.mutateAsync({
        content: pageMode ? "" : content,
        type: postType,
        mediaIds,
        ...(pageMode ? { pageHtml } : {}),
        ...(articleMode ? { articleBody } : {}),
        mentionedUserIds: pageMode ? [] : mentionedUserIds,
      });
      setDraft("");
      setMentionedUserIds([]);
      setPostType("INSIGHT");
      setMedia([]);
      setPostType("INSIGHT");
      setPageHtml("");
      setArticleBody("");
      setTypePickerOpen(false);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : texts.feed.composer.publishError);
    }
  };

  const handleMediaSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (!isVideo && !isImage) continue;

      const hasExistingImages = media.some((m) => m.type === "image");
      const hasExistingVideo = media.some((m) => m.type === "video");

      if (isVideo && (hasExistingImages || hasExistingVideo || media.length >= 1)) break;
      if (isImage && hasExistingVideo) break;
      if (isImage && media.length >= 4) break;

      const preview = URL.createObjectURL(file);
      setMedia((prev) => [...prev, { type: isVideo ? "video" : "image", file, preview }]);
    }
    e.target.value = "";
  };

  const removeMedia = (index: number) => {
    setMedia((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const mediaType = media.length > 0 ? (media[0].type === "image" ? "image" : "video") : null;

  const feedPosts = feedData?.pages.flatMap((page) => page.items) ?? [];

  const loadNextPage = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  const profileUser = profile;
  const suggestionList = suggestions ?? [];
  const eventList = eventsData?.items ?? [];

  return (
    <AppContainer>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          {/* Composer */}
          <form
            onSubmit={publishPost}
            className="rounded-2xl border border-border-soft bg-surface-card p-4 sm:p-5"
          >
            <div className="flex items-start gap-3">
              <UserAvatar
                src={profileUser?.avatar}
                alt={profileUser?.name ?? texts.feed.you}
                className="h-11 w-11"
              />

              {/* No modo pagina o campo de texto sai de cena: a pagina e o conteudo, e pedir um
                  texto "de post" junto faria a publicacao ser as duas coisas ao mesmo tempo. Quem
                  quiser uma legenda escreve dentro do proprio HTML. */}
              {!pageMode && (
                <MentionTextarea
                  value={draft}
                  onChange={(val, ids) => {
                    setDraft(val);
                    setMentionedUserIds(ids);
                  }}
                  placeholder={texts.feed.composer.placeholder}
                  className="flex-1 resize-none rounded-2xl border-border-soft bg-surface-1 px-3 py-2 text-sm font-normal"
                  maxLength={1200}
                  toolbar
                />
              )}
            </div>

            {pageMode && (
              <div className="mt-3 overflow-hidden rounded-2xl border border-border-soft bg-surface-1 p-3">
                {/* Mesmo editor da bio do perfil: um lugar só decide aviso de limite, ajuda e
                    pré-visualização (que usa o mesmo quadro isolado do render final). */}
                <HtmlEditor
                  id="composer-page-html"
                  value={pageHtml}
                  onChange={setPageHtml}
                  label={texts.feed.composer.pageLabel}
                  description={texts.feed.composer.pageDescription}
                  placeholder={texts.feed.composer.pagePlaceholder}
                  emptyPreview={texts.feed.composer.pageEmpty}
                  frameTitle={texts.posts.page.frameTitle}
                  maxLength={PAGE_HTML_MAX_LENGTH}
                  innerPadding={false}
                  previewClassName="-mx-3 -mb-3 mt-3 h-[420px] w-full"
                />
              </div>
            )}

            {articleMode && (
              <div className="mt-3 rounded-2xl border border-border-soft bg-surface-1 p-3">
                <label
                  htmlFor="composer-article-body"
                  className="mb-1 block text-sm font-normal text-text-subtle"
                >
                  {texts.feed.composer.article.bodyLabel}
                </label>

                <p className="mb-2 text-sm font-normal text-text-subtle">
                  {texts.feed.composer.article.bodyHint}
                </p>

                <Textarea
                  id="composer-article-body"
                  value={articleBody}
                  maxLength={ARTICLE_BODY_MAX_LENGTH}
                  onChange={(event) => setArticleBody(event.target.value)}
                  placeholder={texts.feed.composer.article.bodyPlaceholder}
                  className="min-h-[220px]"
                />
              </div>
            )}

            {!pageMode && media.length > 0 && (
              <div className="relative mt-3">
                {mediaType === "image" ? (
                  <div
                    className={`grid gap-2 ${media.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
                  >
                    {media.map((item, i) => (
                      <div
                        key={i}
                        className="relative overflow-hidden rounded-xl border border-border-soft"
                      >
                        <img
                          src={item.preview}
                          alt=""
                          className="h-48 w-full object-cover bg-surface-1"
                        />

                        <button
                          type="button"
                          onClick={() => removeMedia(i)}
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
                      onClick={() => removeMedia(0)}
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

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border-soft pt-3 text-sm font-normal text-text-subtle">
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Seletor de tipo recolhido: mostra o tipo atual e abre a lista completa. */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setTypePickerOpen((open) => !open)}
                    aria-expanded={typePickerOpen}
                    title={texts.feed.composer.typePicker.change}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-normal transition ${
                      typePickerOpen
                        ? "bg-primary text-primary-foreground"
                        : "border border-border-soft text-text-subtle hover:border-primary hover:text-primary"
                    }`}
                  >
                    <currentType.icon className="h-3.5 w-3.5" />

                    <>
                      {texts.feed.composer.typePicker.label}: {currentType.label}
                    </>

                    <ChevronDown
                      className={`h-3.5 w-3.5 transition ${typePickerOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {typePickerOpen && (
                    <div className="absolute bottom-full left-0 z-40 mb-1 w-[min(22rem,80vw)] rounded-2xl border border-border-soft bg-popover p-2 shadow-lg">
                      <div className="flex flex-wrap gap-1.5">
                        {POST_TYPES.map((option) => (
                          <ComposerAction
                            key={option.id}
                            icon={option.icon}
                            label={option.label}
                            active={option.id === postType}
                            onClick={() => {
                              setPostType(option.id as PostView["type"]);
                              setTypePickerOpen(false);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Mídia não existe em página (a página é o conteúdo dela). */}
                {!pageMode && (
                  <ComposerAction
                    icon={mediaType === "video" ? Film : Image}
                    label={
                      mediaType === "video"
                        ? texts.feed.composer.video
                        : media.length > 0
                          ? texts.feed.composer.mediaCount(media.length)
                          : texts.feed.composer.media
                    }
                    active={media.length > 0}
                    onClick={() => fileRef.current?.click()}
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* O motivo da recusa fica na linha de baixo, inteiro: antes ele saía truncado em
                    200px ao lado do botão e a publicação recusada parecia "não fazer nada". */}
                {publishError && (
                  <span className="text-xs font-normal text-destructive">
                    {texts.feed.composer.publishErrorTitle}
                  </span>
                )}
                {!publishError && upload.status === "uploading" && (
                  <span className="text-xs font-normal text-text-subtle">
                    {texts.feed.composer.uploadProgress(upload.progress)}
                  </span>
                )}
                <Button
                  size="sm"
                  className="rounded-full"
                  disabled={
                    (pageMode ? !pageHtml.trim() : !draft.trim()) ||
                    (articleMode && !articleBody.trim()) ||
                    createPost.isPending ||
                    upload.status === "uploading"
                  }
                >
                  {createPost.isPending || upload.status === "uploading" ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />

                      <>
                        {upload.status === "uploading"
                          ? texts.common.sending
                          : texts.common.publishing}
                      </>
                    </>
                  ) : (
                    texts.common.publish
                  )}
                </Button>
              </div>
            </div>

            {publishError && (
              <p className="mt-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-normal text-destructive">
                {publishError}
              </p>
            )}
          </form>

          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Pill active={tab === "FOR_YOU"} onClick={() => setTab("FOR_YOU")}>
              {texts.feed.tabs.forYou}
            </Pill>

            <Pill active={tab === "ALL"} onClick={() => setTab("ALL")}>
              {texts.feed.tabs.all}
            </Pill>

            <Pill active={tab === "FOLLOWING"} onClick={() => setTab("FOLLOWING")}>
              {texts.feed.tabs.following}
            </Pill>

            <Pill active={tab === "RECENT"} onClick={() => setTab("RECENT")}>
              {texts.feed.tabs.discussions}
            </Pill>

            <Pill active={tab === "PROJECTS"} onClick={() => setTab("PROJECTS")}>
              {texts.feed.tabs.projects}
            </Pill>
          </div>

          <div className="space-y-4">
            {feedLoading && <LoadingState />}
            {!feedLoading && feedPosts.map((p) => <PostCard key={p.id} post={p} />)}

            {!feedLoading && feedPosts.length === 0 && <EmptyState title={texts.feed.empty} />}

            <InfiniteScroll
              hasMore={Boolean(hasNextPage)}
              loading={isFetchingNextPage}
              onLoadMore={loadNextPage}
              loadingLabel={texts.feed.loadingMore}
              endLabel={feedPosts.length > 0 ? texts.feed.endOfFeed : undefined}
            />
          </div>
        </div>

        {/* Right rail */}
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
                  className="mt-2 block text-sm font-normal text-text-strong hover:underline"
                >
                  {profileUser.name}
                </Link>

                <p className="line-clamp-2 text-xs font-normal text-text-subtle">
                  {profileUser.headline}
                </p>

                <div className="mt-3 grid grid-cols-2 gap-1 border-t border-border-soft pt-3 text-xs">
                  <div>
                    <p className="font-normal text-text-strong">{profileUser.connectionsCount}</p>

                    <p className="text-text-subtle">{texts.feed.sidebar.connections}</p>
                  </div>

                  <div>
                    <p className="font-normal text-text-strong">{profileUser.followersCount}</p>

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

                <h3 className="text-sm font-normal text-text-strong">
                  {texts.feed.sidebar.suggestions}
                </h3>
              </div>

              <p className="mt-0.5 text-xs font-normal text-text-subtle">
                {texts.feed.sidebar.suggestionsDescription}
              </p>

              <ul className="mt-4 space-y-3">
                {suggestionList.map((u) => (
                  <li key={u.id} className="flex items-center gap-3">
                    <UserAvatar src={u.avatar} alt={u.name} className="h-10 w-10" />

                    <div className="min-w-0 flex-1">
                      <Link
                        to="/perfil/$username"
                        params={{ username: u.username }}
                        className="block truncate text-sm font-normal text-text-strong hover:underline"
                      >
                        {u.name}
                      </Link>

                      <p className="truncate text-xs font-normal text-text-subtle">{u.headline}</p>
                    </div>

                    <button
                      type="button"
                      className="shrink-0 rounded-full border border-border-soft px-3 py-1 text-xs font-normal text-text-subtle transition hover:border-primary hover:text-primary"
                      onClick={() => {
                        networkApi
                          .connect(u.id)
                          .then(() =>
                            queryClient.invalidateQueries({ queryKey: ["network", "suggestions"] }),
                          );
                      }}
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

                <h3 className="text-sm font-normal text-text-strong">
                  {texts.feed.sidebar.happeningNow}
                </h3>
              </div>

              <ul className="mt-3 space-y-3">
                {eventList.slice(0, 3).map((e) => (
                  <li key={e.id}>
                    <p className="text-sm font-normal text-text-strong">{e.title}</p>

                    <p className="text-xs font-normal text-text-subtle">
                      {texts.feed.sidebar.eventMeta(
                        e.date,
                        e.format,
                        texts.feed.sidebar.confirmed(e.attendees),
                      )}
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

function ComposerAction({ icon: Icon, label, active, onClick }: ComposerActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-normal transition ${
        active
          ? "bg-primary text-primary-foreground"
          : "border border-border-soft text-text-subtle hover:border-primary hover:text-primary"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />

      <>{label}</>
    </button>
  );
}
