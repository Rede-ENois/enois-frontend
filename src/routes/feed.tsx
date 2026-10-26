import { type ChangeEvent, type FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { POST_TOPICS, TOPIC_LABELS } from "@/constants/community-topics";
import { postContentLimit } from "@/constants/post-content-limits";
import { PAGE_HTML_MAX_LENGTH } from "@/constants/post-page";
import { ARTICLE_BODY_MAX_LENGTH, POST_TYPES } from "@/constants/post-types";
import { texts } from "@/texts";
import type { CreatePostInput } from "@/types/application/feed/create-post-input";
import type { FeedTab } from "@/types/application/feed/feed-tab";
import type { PostView } from "@/types/application/feed/post-view";
import type { ActiveIdentity } from "@/types/lib/active-identity";
import type { ComposerActionProps } from "@/types/routes/feed/composer-action-props";
import type { HomeTab } from "@/types/routes/feed/home-tab";
import type { MediaItem } from "@/types/routes/feed/media-item";
import {
  ApoieCard,
  PostCardSkeletons,
  SpoilerPreview,
  StyledName,
  UserAvatar,
} from "@rede-enois/design-system/domain";
import { InfiniteScroll } from "@rede-enois/design-system/patterns";
import {
  Button,
  EmptyState,
  Input,
  LoadingState,
  Popover,
  PopoverContent,
  PopoverTrigger,
  useToast,
} from "@rede-enois/design-system/ui";
import {
  ArrowUp,
  BarChart3,
  Briefcase,
  Calendar,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Clock,
  Code2,
  EyeOff,
  FileText,
  Film,
  Image,
  Loader2,
  RefreshCw,
  TrendingUp,
  UserPlus,
  X,
} from "lucide-react";

import {
  effectiveIdentity,
  readActiveIdentity,
  subscribeActiveIdentity,
} from "@/lib/active-identity";
import { authApi, corporateApi, eventsApi, feedApi, networkApi, profileApi } from "@/lib/api";
import { dataHora, valorDeDataLocal } from "@/lib/date/format";
import { clearFeedScroll, readFeedScroll } from "@/lib/feed-scroll-restoration";
import { litePageSize } from "@/lib/lite-mode";
import { requireAuth } from "@/lib/require-auth";
import { ogMetas } from "@/lib/seo";
import { useIsAuthenticated } from "@/lib/use-auth";
import { useLiteMode } from "@/lib/use-lite-mode";
import { useMediaUpload } from "@/lib/use-media-upload";
import { cn } from "@/lib/utils";

import { AppContainer } from "@/components/app-container";
import { TodayGamesCard } from "@/components/games/today-games-card";
import { HtmlEditor } from "@/components/html-editor";
import { LinkedInSyncPrompt } from "@/components/linkedin-sync-prompt";
import { MentionTextarea } from "@/components/mention-textarea";
import { NightRestReminder } from "@/components/night-rest-reminder";
import { PlatformSpacesCard } from "@/components/platform-spaces-card";
import { PostCard } from "@/components/post-card";

/** Abas válidas da tela inicial (a URL carrega a escolhida). */
const HOME_TABS: HomeTab[] = ["ALL", "FOR_YOU", "UNSEEN", "TRENDING", "CORPORATE"];

const TAB_LABELS: Record<HomeTab, string> = {
  ALL: texts.feed.tabs.all,
  FOR_YOU: texts.feed.tabs.forYou,
  UNSEEN: texts.feed.tabs.unseen,
  TRENDING: texts.feed.tabs.trending,
  CORPORATE: texts.feed.tabs.corporate,
  // Legado (backend aceita mas frontend não mostra).
  FOLLOWING: texts.feed.tabs.following,
  RECENT: texts.feed.tabs.discussions,
  PROJECTS: texts.feed.tabs.projects,
  NEWS: texts.feed.tabs.news,
  TUTORIALS: texts.feed.tabs.tutorials,
  OPPORTUNITIES: texts.feed.tabs.opportunities,
  REVIEWS: texts.feed.tabs.reviews,
  FUN: texts.feed.tabs.fun,
};

/** Tipos de post para o filtro do feed "Tudo". */
const POST_TYPE_FILTERS = [
  { value: "", label: texts.feed.tabs.allTypes },
  { value: "INSIGHT", label: "Insights" },
  { value: "QUESTION", label: "Discussões" },
  { value: "PROJECT", label: "Projetos" },
  { value: "NEWS", label: "Notícias" },
  { value: "TUTORIAL", label: "Tutoriais" },
  { value: "OPPORTUNITY", label: "Oportunidades" },
  { value: "REVIEW", label: "Avaliações" },
  { value: "DIVERTIDO", label: "Diversão" },
  { value: "ARTICLE", label: "Artigos" },
] as const;

export const Route = createFileRoute("/feed")({
  beforeLoad: requireAuth,
  /**
   * A aba vive na URL (`/feed?aba=ALL`): abrir uma publicação e voltar restaura a MESMA aba em que
   * a pessoa estava — antes o retorno caía sempre em "Para você".
   */
  validateSearch: (search: Record<string, unknown>): { aba?: HomeTab } => {
    const aba: HomeTab | undefined =
      typeof search.aba === "string" && HOME_TABS.includes(search.aba as HomeTab)
        ? (search.aba as HomeTab)
        : undefined;
    return aba ? { aba } : {};
  },
  head: () => ({
    meta: [
      { title: texts.feed.seo.title },
      {
        name: "description",
        content: texts.feed.seo.description,
      },
      ...ogMetas(texts.feed.seo.title, texts.feed.seo.description),
    ],
  }),
  component: Home,
});

const FEED_PAGE_SIZE = 20;

/**
 * A última categoria usada fica guardada: quem publica sempre no mesmo assunto não precisa
 * reescolher a cada post. Fica no navegador (como o rascunho) e some com o histórico limpo.
 */
const LAST_TOPIC_KEY = "connect-grow-last-topic";

function readLastTopic(): string {
  if (typeof localStorage === "undefined") return "";
  try {
    const saved = localStorage.getItem(LAST_TOPIC_KEY);
    // Vale só o que o compositor ainda oferece: assunto que saiu da lista não volta selecionado.
    return saved && (POST_TOPICS as readonly string[]).includes(saved) ? saved : "";
  } catch {
    return "";
  }
}

function rememberTopic(value: string): void {
  try {
    if (value) localStorage.setItem(LAST_TOPIC_KEY, value);
    else localStorage.removeItem(LAST_TOPIC_KEY);
  } catch {
    // modo privado/cota: a escolha vale só para esta sessão.
  }
}

function useFeed(tab: HomeTab, typeFilter?: string) {
  const authenticated = useIsAuthenticated();
  const lite = useLiteMode();
  const pageSize = litePageSize(FEED_PAGE_SIZE, lite);
  return useInfiniteQuery({
    queryKey: ["feed", tab, typeFilter ?? ""],
    queryFn: ({ pageParam }) =>
      tab === "CORPORATE"
        ? feedApi.corporate(pageParam ?? null, pageSize)
        : feedApi.list(pageParam ?? null, pageSize, tab, typeFilter || undefined),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: authenticated,
    staleTime: 20_000,
  });
}

function useProfile() {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ["me"],
    queryFn: () => profileApi.me(),
    enabled: authenticated,
    staleTime: 60_000,
  });
}

function useSuggestions() {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ["network", "suggestions"],
    // Busca um lote maior: o "ver outras" gira entre os 4 primeiros sem pedir de novo.
    queryFn: () => networkApi.suggestions(12),
    enabled: authenticated,
    staleTime: 120_000,
  });
}

function useEvents() {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ["events"],
    queryFn: () => eventsApi.list(),
    enabled: authenticated,
    staleTime: 120_000,
  });
}

function Home() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const authenticated = useIsAuthenticated();
  // A aba vem da URL; trocar de aba REPLACES o histórico (o "voltar" continua voltando para a
  // página anterior, e não passeando pelas abas).
  const { aba } = Route.useSearch();
  const navigate = Route.useNavigate();
  const tab: HomeTab = aba ?? "ALL";
  const setTab = (next: HomeTab) => {
    if (next === tab) return;
    void navigate({ search: { aba: next }, replace: true });
  };
  const [menuTipoFeed, setMenuTipoFeed] = useState(false);
  const [menuTopic, setMenuTopic] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  const {
    data: feedData,
    isLoading: feedLoading,
    isFetching: feedFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFeed(tab, tab === "ALL" ? typeFilter : undefined);
  const { data: profile } = useProfile();
  const { data: suggestions } = useSuggestions();
  const { data: eventsData } = useEvents();
  const [chosenIdentity, setChosenIdentity] = useState<ActiveIdentity>(() => readActiveIdentity());
  useEffect(() => subscribeActiveIdentity(() => setChosenIdentity(readActiveIdentity())), []);
  const { data: corporate } = useQuery({
    queryKey: ["business-profile"],
    queryFn: () => corporateApi.me(),
    enabled: authenticated,
    staleTime: 120_000,
  });
  const identity = effectiveIdentity(chosenIdentity, corporate);

  const [draft, setDraft] = useState("");
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [postType, setPostType] = useState<PostView["type"]>("INSIGHT");
  // Assunto do post avulso (opcional): é o que liga o post a "O que quero ver"/"não gosto".
  // Em comunidade o post herda o assunto DELA — lá o compositor é outro.
  const [topic, setTopic] = useState<string>(() => readLastTopic());
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [mediaSpoiler, setMediaSpoiler] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState<string | null>(null);
  // Tipo de publicação e o que manda: Página mostra o editor de HTML, Artigo mostra o editor do
  // texto longo, os demais usam o campo de cima. O seletor de tipos abre em painel recolhido — com
  // dez tipos, uma fileira de botões ocupava o composer inteiro e empurrava o texto para longe.
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [pageHtml, setPageHtml] = useState("");
  const [articleBody, setArticleBody] = useState("");
  // Agendamento: o post fica na fila do backend e só entra no feed na hora marcada.
  const [schedulingOpen, setSchedulingOpen] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  // A identidade ativa manda no tipo: profissional publica BUSINESS (destino: feed
  // corporativo); voltar para social tira o BUSINESS da seleção.
  useEffect(() => {
    if (identity === "CORPORATE") {
      setPostType("BUSINESS");
    } else {
      setPostType((current) => (current === "BUSINESS" ? "INSIGHT" : current));
    }
  }, [identity]);

  const pageMode = postType === "PAGE";
  const articleMode = postType === "ARTICLE";
  const availableTypes =
    identity === "CORPORATE"
      ? POST_TYPES.filter((option) => option.id === "BUSINESS")
      : POST_TYPES.filter((option) => option.id !== "BUSINESS");
  const currentType = availableTypes.find((option) => option.id === postType) ?? availableTypes[0];
  const fileRef = useRef<HTMLInputElement>(null);
  const upload = useMediaUpload();

  const createPost = useMutation({
    mutationFn: (data: CreatePostInput) => feedApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const scheduledQuery = useQuery({
    queryKey: ["feed", "scheduled"],
    queryFn: () => feedApi.scheduled(),
    enabled: authenticated,
    staleTime: 60_000,
  });
  const scheduledList = scheduledQuery.data ?? [];

  const schedulePost = useMutation({
    mutationFn: (data: Parameters<typeof feedApi.schedule>[0]) => feedApi.schedule(data),
    onSuccess: (agendado) => {
      toast(texts.feed.composer.scheduleDone(dataHora(agendado.scheduledAt)), "success");
      void queryClient.invalidateQueries({ queryKey: ["feed", "scheduled"] });
    },
    onError: (error) => setPublishError(error.message),
  });

  const cancelScheduled = useMutation({
    mutationFn: (id: string) => feedApi.cancelScheduled(id),
    onSuccess: () => {
      toast(texts.feed.composer.scheduleCancelled, "success");
      void queryClient.invalidateQueries({ queryKey: ["feed", "scheduled"] });
    },
    onError: (error) => toast(error.message, "error"),
  });

  const schedulePublish = async () => {
    const content = draft.trim();
    if (pageMode ? !pageHtml.trim() : !content) return;
    if (articleMode && !articleBody.trim()) return;
    if (!scheduleAt) return;

    setPublishError(null);
    try {
      let mediaIds: string[] = [];
      let finalContent = content;
      if (!pageMode && media.length > 0) {
        const results = await upload.uploadAll(media.map((m) => ({ file: m.file })));
        mediaIds = results.map((r) => r.mediaId);
        // Mídia NO MEIO do texto (item 9): pendentes viram ids reais no upload.
        finalContent = finalContent.replace(/\{\{media:pendente-(\d+)\}\}/g, (_mk, index) => {
          const uploaded = mediaIds[Number(index)];
          return uploaded ? `{{media:${uploaded}}}` : "";
        });
      }
      await schedulePost.mutateAsync({
        type: postType,
        content: pageMode ? "" : finalContent,
        mediaIds,
        mediaSpoiler,
        // As menções viajam com o agendado e valem na PUBLICAÇÃO (quem foi marcado é avisado
        // quando o post entra no ar, não quando foi agendado).
        mentionedUserIds: pageMode ? [] : mentionedUserIds,
        ...(pageMode ? { pageHtml } : {}),
        ...(articleMode ? { articleBody } : {}),
        // O assunto viaja com o agendado e vale quando ele entra no ar.
        ...(topic ? { topic } : {}),
        scheduledAt: new Date(scheduleAt).toISOString(),
      });
      setDraft("");
      setMentionedUserIds([]);
      setPostType("INSIGHT");
      setMedia([]);
      setMediaSpoiler(false);
      setPageHtml("");
      setArticleBody("");
      setTypePickerOpen(false);
      setScheduleAt("");
      setSchedulingOpen(false);
    } catch {
      // o motivo já foi para o publishError pelo onError da mutation
    }
  };

  // O mínimo do input datetime-local é AGORA+1min (o backend recusa mais perto que isso).
  const minScheduleAt = valorDeDataLocal(new Date(Date.now() + 60_000));

  const publishPost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    // Pagina e uma coisa OU outra: o HTML e o conteudo e o texto do post nao e exigido. Artigo
    // precisa de titulo (o texto de cima) E do corpo. Nos demais, o texto de cima e o post.
    if (pageMode ? !pageHtml.trim() : !content) return;
    if (articleMode && !articleBody.trim()) return;

    const formData = new FormData(event.currentTarget);
    setPublishError(null);
    try {
      let mediaIds: string[] = [];
      if (!pageMode && media.length > 0) {
        const results = await upload.uploadAll(media.map((m) => ({ file: m.file })));
        mediaIds = results.map((r) => r.mediaId);
      }
      const created = await createPost.mutateAsync({
        content: pageMode ? "" : content,
        type: postType,
        mediaIds,
        mediaSpoiler,
        ...(pageMode ? { pageHtml } : {}),
        ...(articleMode ? { articleBody } : {}),
        mentionedUserIds: pageMode ? [] : mentionedUserIds,
        ...(topic ? { topic } : {}),
        website: String(formData.get("website") ?? ""),
      });
      // "Também no LinkedIn": com o LinkedIn vinculado, oferece o compartilhamento pelo
      // diálogo oficial do LinkedIn com o link público do post (o OG preview completa o resto).
      // A publicação via API do LinkedIn exige aprovação no programa de parceiros — o
      // diálogo oficial é o caminho que já funciona hoje para qualquer perfil.
      try {
        const postId = (created as { id?: string })?.id;
        if (postId) {
          const linked = await authApi.oauthProviders();
          if (linked.some((l) => l.provider === "LINKEDIN")) {
            setLinkedinUrl(`${texts.siteUrl}/post/${postId}`);
          }
        }
      } catch {
        // sem a checagem, simplesmente não oferta — a publicação no énois já aconteceu
      }
      setDraft("");
      setMentionedUserIds([]);
      setLinkedinUrl(null);
      setPostType("INSIGHT");
      setMedia([]);
      setMediaSpoiler(false);
      setPostType("INSIGHT");
      setPageHtml("");
      setArticleBody("");
      setTypePickerOpen(false);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : texts.feed.composer.publishError);
    }
  };

  const addMediaFiles = (files: File[]) => {
    if (files.length === 0) return;

    for (const file of files) {
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
  };

  const handleMediaSelect = (e: ChangeEvent<HTMLInputElement>) => {
    addMediaFiles(Array.from(e.target.files ?? []));
    e.target.value = "";
  };

  const removeMedia = (index: number) => {
    setMedia((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) setMediaSpoiler(false);
      return next;
    });
  };

  const mediaType = media.length > 0 ? (media[0].type === "image" ? "image" : "video") : null;

  const feedPosts = feedData?.pages.flatMap((page) => page.items) ?? [];

  useEffect(() => {
    const updateScrollTopVisibility = () => setShowScrollTop(window.scrollY > 400);

    updateScrollTopVisibility();
    window.addEventListener("scroll", updateScrollTopVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollTopVisibility);
  }, []);

  useEffect(() => {
    if (feedLoading || feedPosts.length === 0 || typeof window === "undefined") return;

    const savedScroll = readFeedScroll(tab);
    if (!savedScroll) return;

    const postElement = document.getElementById(`feed-post-${savedScroll.postId}`);
    if (!postElement && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
      return;
    }

    clearFeedScroll();
    const restore = () => {
      window.scrollTo({ top: savedScroll.scrollY, behavior: "auto" });
      postElement?.focus({ preventScroll: true });
    };

    requestAnimationFrame(() => requestAnimationFrame(restore));
  }, [feedLoading, feedPosts.length, fetchNextPage, hasNextPage, isFetchingNextPage, tab]);

  const loadNextPage = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  const profileUser = profile;
  const suggestionList = suggestions ?? [];
  const [suggestionPage, setSuggestionPage] = useState(0);
  // Gira o lote de 4 a cada clique em "ver outras": não é um novo pedido nem muda a ordem
  // de afinidade do backend, só revela os próximos nomes do mesmo lote.
  const visibleSuggestions =
    suggestionList.length <= 4
      ? suggestionList
      : Array.from({ length: 4 }, (_, i) => {
          const start = (suggestionPage * 4) % suggestionList.length;
          return suggestionList[(start + i) % suggestionList.length];
        });
  const eventList = eventsData?.items ?? [];

  return (
    <AppContainer>
      <NightRestReminder />

      {/* Pergunta única ao voltar do vínculo com o LinkedIn (flag gravada pelo diálogo de contas). */}
      <LinkedInSyncPrompt />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          {/* Composer */}
          <form
            onSubmit={publishPost}
            className="rounded-2xl border border-border-soft bg-surface-card p-4 sm:p-5"
          >
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />

            {/* O aviso da identidade profissional fica ACIMA da linha do avatar/campo: como item
                de flex dentro dela, ele ocupava a largura toda, espremia o textarea e empurrava a
                toolbar para a borda (o relato do perfil profissional "quebrado"). */}
            {identity === "CORPORATE" && (
              <div className="mb-2 flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs text-text-strong">
                <Briefcase className="h-3.5 w-3.5 shrink-0" />

                <span className="min-w-0 break-words">
                  {texts.feed.composer.corporateDestination(corporate?.name ?? "")}
                </span>
              </div>
            )}

            <div className="flex items-start gap-3">
              <UserAvatar
                frame={profileUser?.avatarFrame}
                frameOverflow="hidden"
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
                  maxLength={postContentLimit(postType)}
                  toolbar
                  onPasteImages={addMediaFiles}
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
                <span className="mb-1 block text-sm font-normal text-text-subtle">
                  {texts.feed.composer.article.bodyLabel}
                </span>

                <p className="mb-2 text-sm font-normal text-text-subtle">
                  {texts.feed.composer.article.bodyHint}
                </p>

                <MentionTextarea
                  value={articleBody}
                  maxLength={ARTICLE_BODY_MAX_LENGTH}
                  onChange={(value) => setArticleBody(value)}
                  placeholder={texts.feed.composer.article.bodyPlaceholder}
                  className="min-h-[220px] rounded-lg border border-border-soft bg-transparent px-3 py-2 text-sm text-text-strong"
                  rows={8}
                  toolbar
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
                        <SpoilerPreview
                          active={mediaSpoiler}
                          label={texts.posts.mediaSpoiler.badge}
                        >
                          <img
                            src={item.preview}
                            alt=""
                            className="h-48 w-full object-cover bg-surface-1"
                          />
                        </SpoilerPreview>

                        <button
                          type="button"
                          onClick={() => removeMedia(i)}
                          aria-label={texts.feed.composer.removeMedia}
                          title={texts.feed.composer.removeMedia}
                          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-surface-card/80 text-text-strong shadow hover:bg-surface-card"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="relative overflow-hidden rounded-xl border border-border-soft">
                    <SpoilerPreview active={mediaSpoiler} label={texts.posts.mediaSpoiler.badge}>
                      <video
                        src={media[0].preview}
                        controls
                        className="max-h-64 w-full bg-surface-1"
                      />
                    </SpoilerPreview>

                    <button
                      type="button"
                      onClick={() => removeMedia(0)}
                      aria-label={texts.feed.composer.removeMedia}
                      title={texts.feed.composer.removeMedia}
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
                {/* Categoria do post: guarda a última escolha para o próximo post já nascer nela. */}
                <Popover open={menuTopic} onOpenChange={setMenuTopic}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label={texts.feed.composer.topic}
                      title={texts.feed.composer.topicHint}
                      className={cn(
                        "inline-flex max-w-[11rem] items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-normal transition",
                        topic
                          ? "border border-primary/40 bg-primary/10 text-primary"
                          : "border border-border-soft text-text-subtle hover:border-primary",
                      )}
                    >
                      <span className="truncate">
                        {topic
                          ? (TOPIC_LABELS[topic as keyof typeof TOPIC_LABELS] ?? topic)
                          : texts.feed.composer.topicNone}
                      </span>

                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-text-subtle" />
                    </button>
                  </PopoverTrigger>

                  <PopoverContent align="start" className="w-56 p-1">
                    <div className="flex max-h-72 flex-col gap-0.5 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setTopic("");
                          rememberTopic("");
                          setMenuTopic(false);
                        }}
                        className={cn(
                          "rounded-lg px-3 py-2 text-left text-sm font-normal transition",
                          topic === ""
                            ? "bg-primary-soft text-primary-text"
                            : "text-text-subtle hover:bg-surface-2 hover:text-text-strong",
                        )}
                      >
                        {texts.feed.composer.topicNone}
                      </button>

                      {POST_TOPICS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setTopic(option);
                            rememberTopic(option);
                            setMenuTopic(false);
                          }}
                          aria-pressed={topic === option}
                          className={cn(
                            "rounded-lg px-3 py-2 text-left text-sm font-normal transition",
                            topic === option
                              ? "bg-primary-soft text-primary-text"
                              : "text-text-subtle hover:bg-surface-2 hover:text-text-strong",
                          )}
                        >
                          {TOPIC_LABELS[option]}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

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

                  {currentType.id === "MOMENT" && (
                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                      <Clock className="h-3.5 w-3.5" />
                      {currentType.hint}
                    </p>
                  )}

                  {typePickerOpen && (
                    <div className="absolute bottom-full right-0 z-40 mb-1 max-h-[60vh] w-[min(22rem,80vw)] overflow-y-auto rounded-2xl border border-border-soft bg-popover p-2 shadow-lg sm:left-0 sm:right-auto">
                      <div className="flex flex-wrap gap-1.5">
                        {availableTypes.map((option) => (
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
                {((!pageMode && media.length > 0) || (pageMode && pageHtml.trim().length > 0)) && (
                  <ComposerAction
                    icon={EyeOff}
                    label={
                      mediaSpoiler
                        ? texts.feed.composer.mediaSpoilerActive
                        : texts.feed.composer.mediaSpoiler
                    }
                    active={mediaSpoiler}
                    onClick={() => setMediaSpoiler((active) => !active)}
                  />
                )}
              </div>

              {linkedinUrl && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-primary-soft px-3 py-2">
                  <span className="text-xs font-normal text-primary">
                    {texts.feed.composer.publishedOffer}
                  </span>

                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(linkedinUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setLinkedinUrl(null)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition hover:opacity-90"
                  >
                    {texts.feed.composer.linkedinShare} ↗
                  </a>
                </div>
              )}

              {/* `ml-auto`: quando não cabe na mesma linha das opções, o Publicar desce e continua
                  alinhado à direita, onde a pessoa procura — antes caía à esquerda, solto. */}
              <div className="ml-auto flex items-center gap-2">
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
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-full gap-1.5"
                  disabled={
                    (pageMode ? !pageHtml.trim() : !draft.trim()) ||
                    (articleMode && !articleBody.trim()) ||
                    createPost.isPending ||
                    upload.status === "uploading"
                  }
                  onClick={() => setSchedulingOpen((open) => !open)}
                  title={texts.feed.composer.scheduleHint}
                >
                  <CalendarClock className="h-3.5 w-3.5" />

                  <>{texts.feed.composer.schedule}</>
                </Button>

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

            {schedulingOpen && (
              <div className="mt-3 flex flex-wrap items-end gap-2 rounded-xl border border-border-soft bg-surface-1 p-3">
                <label className="text-xs font-normal text-text-subtle">
                  {texts.feed.composer.scheduleDate}
                  <Input
                    type="datetime-local"
                    value={scheduleAt}
                    min={minScheduleAt}
                    onChange={(event) => setScheduleAt(event.target.value)}
                    className="mt-1"
                  />
                </label>

                <Button
                  type="button"
                  size="sm"
                  className="rounded-full"
                  disabled={!scheduleAt || schedulePost.isPending || upload.status === "uploading"}
                  onClick={schedulePublish}
                >
                  {schedulePost.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    texts.feed.composer.scheduleConfirm
                  )}
                </Button>

                <p className="text-[11px] font-normal text-text-subtle">
                  {texts.feed.composer.scheduleHint}
                </p>
              </div>
            )}

            {publishError && (
              <p className="mt-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-normal text-destructive">
                {publishError}
              </p>
            )}
          </form>

          {scheduledList.length > 0 && (
            <section className="rounded-2xl border border-border-soft bg-surface-card p-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-text-strong">
                <CalendarClock className="h-4 w-4 text-primary" />

                <>{texts.feed.composer.scheduledTitle(scheduledList.length)}</>
              </h2>

              <ul className="mt-2 space-y-2">
                {scheduledList.map((agendado) => (
                  <li
                    key={agendado.id}
                    className="flex items-start justify-between gap-2 rounded-xl bg-surface-1 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-text-strong">
                        {agendado.content ||
                          (agendado.pageHtml ? texts.feed.composer.scheduledPage : agendado.type)}
                      </p>

                      <p className="text-xs text-text-subtle">
                        {texts.feed.composer.scheduledFor(dataHora(agendado.scheduledAt))}
                        {agendado.lastError ? ` · ${agendado.lastError}` : ""}
                      </p>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="rounded-full"
                      title={texts.feed.composer.scheduleCancel}
                      aria-label={texts.feed.composer.scheduleCancel}
                      disabled={cancelScheduled.isPending}
                      onClick={() => cancelScheduled.mutate(agendado.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Tipo de feed: as opcoes ficam recolhidas atras do botao (sao muitas e ocupavam
              tres linhas na tela). A legenda diz do que se trata; o botao mostra o que esta
              escolhido e abre a lista. */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-normal text-text-subtle">{texts.feed.tabs.type}</span>

            <Popover open={menuTipoFeed} onOpenChange={setMenuTipoFeed}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={texts.feed.tabs.openList}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border-soft bg-surface-card px-3 py-1.5 text-sm font-normal text-text-strong transition hover:border-primary hover:text-primary"
                >
                  {TAB_LABELS[tab]}

                  <ChevronDown className="h-3.5 w-3.5 text-text-subtle" />
                </button>
              </PopoverTrigger>

              <PopoverContent align="start" className="w-56 p-1">
                <div className="flex max-h-80 flex-col gap-0.5 overflow-y-auto">
                  {HOME_TABS.filter(
                    (opcao) =>
                      opcao !== "CORPORATE" || (corporate?.exists && corporate.status === "ACTIVE"),
                  ).map((opcao) => (
                    <button
                      key={opcao}
                      type="button"
                      onClick={() => {
                        setTab(opcao);
                        setMenuTipoFeed(false);
                      }}
                      aria-pressed={opcao === tab}
                      className={cn(
                        "rounded-lg px-3 py-2 text-left text-sm font-normal transition",
                        opcao === tab
                          ? "bg-primary-soft text-primary"
                          : "text-text-subtle hover:bg-surface-2 hover:text-text-strong",
                      )}
                    >
                      {TAB_LABELS[opcao]}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {tab === "ALL" && (
            <div className="flex flex-wrap gap-2 pb-2">
              {POST_TYPE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setTypeFilter(f.value)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium transition",
                    typeFilter === f.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface-2 text-text-subtle hover:bg-surface-3 hover:text-text-strong",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-4">
            {feedLoading && <PostCardSkeletons />}

            {!feedLoading && feedFetching && !isFetchingNextPage && (
              <div className="flex items-center justify-center gap-2 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />

                <span className="text-sm text-text-subtle">{texts.feed.refreshing}</span>
              </div>
            )}

            {!feedLoading && feedPosts.map((p) => <PostCard key={p.id} post={p} feedTab={tab} />)}

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

        {/* Right rail: TUDO num único filho do grid. O cartão de doação já foi um filho solto
            aqui — ele esticava até a altura da coluna inteira e empurrava/escondia os outros
            cartões (o que está acontecendo agora) para fora da dobra. */}
        <aside className="sticky top-20 hidden max-h-[calc(100vh-6rem)] space-y-4 self-start overflow-y-auto scrollbar-on-hover lg:block">
          <ApoieCard />
          <PlatformSpacesCard />
          <TodayGamesCard />

          {profileUser && (
            <div className="overflow-hidden rounded-2xl border border-border-soft bg-surface-card">
              <div className="h-14" style={{ background: "var(--gradient-primary)" }} />

              <div className="-mt-7 px-4 pb-4 text-center">
                <UserAvatar
                  frame={profileUser.avatarFrame}
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

                {suggestionList.length > 4 && (
                  <button
                    type="button"
                    aria-label={texts.feed.sidebar.refreshSuggestions}
                    title={texts.feed.sidebar.refreshSuggestions}
                    className="ml-auto rounded-full p-1.5 text-text-subtle transition hover:bg-surface-2 hover:text-primary"
                    onClick={() => setSuggestionPage((page) => page + 1)}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <p className="mt-0.5 text-xs font-normal text-text-subtle">
                {texts.feed.sidebar.suggestionsDescription}
              </p>

              <ul className="mt-4 space-y-3">
                {visibleSuggestions.map((u) => (
                  <li key={u.id} className="flex items-center gap-3">
                    <UserAvatar
                      src={u.avatar}
                      frame={u.avatarFrame}
                      alt={u.name}
                      className="h-10 w-10"
                    />

                    <div className="min-w-0 flex-1">
                      <Link
                        to="/perfil/$username"
                        params={{ username: u.username }}
                        className="block truncate text-sm font-normal text-text-strong hover:underline"
                      >
                        <StyledName name={u.name} style={u.nameStyle} />
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
                    {/* O item inteiro é o link para o evento. A seta é o que diz isso: sem ela, o
                        título só reagia no hover e a linha parecia texto solto. */}
                    <Link
                      to="/eventos"
                      search={{ evento: e.id }}
                      className="group/ev flex items-start gap-2"
                    >
                      <span className="min-w-0 flex-1">
                        <p className="text-sm font-normal text-text-strong underline-offset-2 group-hover/ev:underline">
                          {e.title}
                        </p>

                        <p className="text-xs font-normal text-text-subtle">
                          {texts.feed.sidebar.eventMeta(
                            e.date,
                            e.format,
                            texts.feed.sidebar.confirmed(e.attendees),
                          )}
                        </p>
                      </span>

                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-text-subtle transition group-hover/ev:translate-x-0.5 group-hover/ev:text-primary" />
                    </Link>
                  </li>
                ))}
              </ul>

              <Link
                to="/eventos"
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                {texts.feed.sidebar.seeAllEvents}
              </Link>
            </div>
          )}
        </aside>
      </div>

      {showScrollTop && (
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label={texts.feed.scrollToTop}
          title={texts.feed.scrollToTop}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-4 z-40 rounded-full border-border-soft bg-surface-card/95 shadow-lg backdrop-blur-sm lg:right-[calc((100vw-min(100vw-3rem,80rem))/2+344px)]"
        >
          <ArrowUp className="h-4 w-4" aria-hidden />
        </Button>
      )}
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
