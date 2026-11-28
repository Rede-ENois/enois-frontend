import {
  type ChangeEvent,
  type FormEvent,
  Fragment,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { POST_TOPICS, TOPIC_LABELS } from "@/constants/community-topics";
import { postContentLimit } from "@/constants/post-content-limits";
import { PAGE_HTML_MAX_LENGTH } from "@/constants/post-page";
import { ARTICLE_BODY_MAX_LENGTH, POLL_MIN_OPTIONS, POST_TYPES } from "@/constants/post-types";
import { texts } from "@/texts";
import type { CreatePostInput } from "@/types/application/feed/create-post-input";
import type { FeedPage } from "@/types/application/feed/feed-page";
import type { FeedTab } from "@/types/application/feed/feed-tab";
import type { PostView } from "@/types/application/feed/post-view";
import type { ComposerActionProps } from "@/types/routes/feed/composer-action-props";
import type { HomeTab } from "@/types/routes/feed/home-tab";
import type { MediaItem } from "@/types/routes/feed/media-item";
import {
  ApoieCard,
  CaughtUpDivider,
  ComposerCrossPost,
  ComposerDraftStatus,
  ComposerLauncher,
  PostCardSkeletons,
  QuestionComposerHint,
  type QuestionStatus,
  QuestionStatusFilter,
  SpoilerPreview,
  StyledName,
  UserAvatar,
} from "@rede-enois/design-system/domain";
import { InfiniteScroll } from "@rede-enois/design-system/patterns";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  EventTicket,
  Input,
  LoadingState,
  Pill,
  PillRow,
  Popover,
  PopoverContent,
  PopoverTrigger,
  PullIndicator,
  Tabs,
  TabsList,
  TabsTrigger,
  useToast,
} from "@rede-enois/design-system/ui";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUp,
  BarChart3,
  BookOpen,
  Briefcase,
  Calendar,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Clock,
  Code2,
  Compass,
  EyeOff,
  FileText,
  Film,
  Flame,
  FolderGit2,
  GraduationCap,
  HelpCircle,
  Image,
  Layers,
  Lightbulb,
  Loader2,
  MessageSquare,
  Newspaper,
  RefreshCw,
  SlidersHorizontal,
  Smile,
  Sparkles,
  Star,
  UserPlus,
  X,
} from "lucide-react";

import { authApi, corporateApi, eventsApi, feedApi, networkApi, profileApi } from "@/lib/api";
import { takeComposerFiles } from "@/lib/composer-handoff";
import { dataHora, ingressoDeEvento, valorDeDataLocal } from "@/lib/date/format";
import { canReachScroll, clearFeedScroll, readFeedScroll } from "@/lib/feed-scroll-restoration";
import { captionRequired } from "@/lib/feed/caption-required";
import { carriesCaughtUp, caughtUpOrder, useMarkFeedSeen } from "@/lib/feed/caught-up";
import { composerExpanded as composerExpandedWith } from "@/lib/feed/composer-expanded";
import { availableFeedPostTypes, resolveFeedPostType } from "@/lib/feed/composer-post-type";
import { crossPostFailureMessage, crossPostsToCorporate } from "@/lib/feed/cross-post";
import { useFeedArrivals } from "@/lib/feed/feed-arrivals";
import { useFeedLiveRefresh } from "@/lib/feed/feed-live";
import { keepPostsById } from "@/lib/feed/keep-posts-by-id";
import { normalizePollOptions } from "@/lib/feed/poll-options";
import {
  feedQueryKey,
  feedRefreshOptions,
  refreshFeedFirstPage,
} from "@/lib/feed/post-query-cache";
import { useFeedTab } from "@/lib/feed/use-feed-tab";
import {
  effectiveIdentity,
  professionalProfileState,
  useInterfaceContext,
} from "@/lib/interface-context";
import { isProhibitedContent } from "@/lib/media-moderation";
import { mediaPreviewUrl } from "@/lib/media-preview-url";
import { usePullToRefresh } from "@/lib/pull-to-refresh";
import { requireAuth } from "@/lib/require-auth";
import { ogMetas } from "@/lib/seo";
import { uploadComposerMedia } from "@/lib/upload-composer-media";
import { useIsAuthenticated } from "@/lib/use-auth";
import { VideoLimitError } from "@/lib/use-media-upload";
import { useMediaUpload } from "@/lib/use-media-upload";
import { cn } from "@/lib/utils";

import { AppContainer } from "@/components/app-container";
import { SaciDuelBanner } from "@/components/events/saci-duel-banner";
import { SaciSpot } from "@/components/events/saci-spot";
import { CompanyPromptCard } from "@/components/feed/company-prompt-card";
import { PostTypePicker } from "@/components/feed/post-type-picker";
import { ProfessionalComposerNotice } from "@/components/feed/professional-composer-notice";
import { TodayGamesCard } from "@/components/games/today-games-card";
import { HtmlEditor } from "@/components/html-editor";
import { LinkedInSyncPrompt } from "@/components/linkedin-sync-prompt";
import { MentionTextarea } from "@/components/mention-textarea";
import { ConductLessonDialog } from "@/components/moderation/conduct-lesson-dialog";
import { NightRestReminder } from "@/components/night-rest-reminder";
import { PortfolioFeedEntry } from "@/components/portfolio/portfolio-feed-entry";
import { PostCard } from "@/components/post-card";
import { PdfAttachmentCard } from "@/components/post/pdf-attachment-card";
import { PollComposer } from "@/components/post/poll-composer";
import { ProfilePeek } from "@/components/profile/profile-peek";

/** Abas válidas da tela inicial (a URL carrega a escolhida). */
const HOME_TABS: HomeTab[] = ["ALL", "FOR_YOU", "UNSEEN", "TRENDING", "INTERACTED", "CORPORATE"];

const TAB_LABELS: Record<HomeTab, string> = {
  ALL: texts.feed.tabs.all,
  FOR_YOU: texts.feed.tabs.forYou,
  UNSEEN: texts.feed.tabs.unseen,
  TRENDING: texts.feed.tabs.trending,
  INTERACTED: texts.feed.tabs.interacted,
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

const TAB_ICONS: Record<HomeTab, typeof Layers> = {
  ALL: Layers,
  FOR_YOU: Compass,
  UNSEEN: Clock,
  TRENDING: Flame,
  INTERACTED: MessageSquare,
  CORPORATE: Briefcase,
  FOLLOWING: Compass,
  RECENT: MessageSquare,
  PROJECTS: Layers,
  NEWS: Layers,
  TUTORIALS: Layers,
  OPPORTUNITIES: Briefcase,
  REVIEWS: MessageSquare,
  FUN: Flame,
};

/** Tipos de post para o filtro do feed "Tudo". */
const POST_TYPE_FILTERS = [
  { value: "", label: texts.feed.tabs.allTypes },
  { value: "INSIGHT", label: "Insights" },
  { value: "QUESTION", label: "Dúvidas" },
  { value: "PROJECT", label: "Projetos" },
  { value: "NEWS", label: "Notícias" },
  { value: "TUTORIAL", label: "Tutoriais" },
  { value: "OPPORTUNITY", label: "Oportunidades" },
  { value: "REVIEW", label: "Avaliações" },
  { value: "DIVERTIDO", label: "Diversão" },
  { value: "ARTICLE", label: "Artigos" },
  { value: "POLL", label: "Enquetes" },
  { value: "COMPLAINT", label: "Reclamações" },
] as const;

const POST_TYPE_ICONS: Record<string, typeof Sparkles> = {
  "": Sparkles,
  INSIGHT: Lightbulb,
  QUESTION: HelpCircle,
  PROJECT: FolderGit2,
  NEWS: Newspaper,
  TUTORIAL: BookOpen,
  OPPORTUNITY: Briefcase,
  REVIEW: Star,
  DIVERTIDO: Smile,
  ARTICLE: FileText,
  POLL: BarChart3,
  COMPLAINT: AlertCircle,
};

export const Route = createFileRoute("/feed")({
  beforeLoad: requireAuth,
  /**
   * A aba vive na URL (`/feed?aba=ALL`): abrir uma publicação e voltar restaura a MESMA aba em que
   * a pessoa estava — antes o retorno caía sempre em "Para você".
   */
  validateSearch: (
    search: Record<string, unknown>,
  ): { aba?: HomeTab; compor?: "ARTICLE" | "MEDIA" | "POST" } => {
    const aba: HomeTab | undefined =
      typeof search.aba === "string" && HOME_TABS.includes(search.aba as HomeTab)
        ? (search.aba as HomeTab)
        : undefined;
    // Profile shortcuts: `compor=ARTICLE` opens the composer in article mode, `compor=MEDIA` attaches
    // the files picked on the profile (see `composer-handoff`); `compor=POST` is the dock's
    // "Publicar" and just opens the composer.
    const compor =
      search.compor === "ARTICLE" || search.compor === "MEDIA" || search.compor === "POST"
        ? search.compor
        : undefined;
    return { ...(aba ? { aba } : {}), ...(compor ? { compor } : {}) };
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

/**
 * Posts por página em cada feed. Dez é o teto: a lista carrega aos poucos, como as mensagens, e
 * cada página é uma consulta pesada no servidor (enriquecimento em lote de autor, mídia, enquetes
 * e contadores). O backend recusa mais que isso de qualquer forma.
 */
const FEED_PAGE_SIZE = 10;

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

/** "open" and "resolved" filter the questions feed; "all" sends no filter. */
const RESOLVED_FILTER: Record<QuestionStatus, boolean | undefined> = {
  all: undefined,
  open: false,
  resolved: true,
};

function useFeed(tab: HomeTab, typeFilter?: string, resolved?: boolean, tabReady = true) {
  const authenticated = useIsAuthenticated();
  return useInfiniteQuery({
    queryKey: feedQueryKey(tab, typeFilter, resolved),
    queryFn: ({ pageParam }): Promise<FeedPage> =>
      tab === "CORPORATE"
        ? feedApi.corporate(pageParam ?? null, FEED_PAGE_SIZE)
        : feedApi.list(pageParam ?? null, FEED_PAGE_SIZE, tab, typeFilter || undefined, resolved),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: authenticated && tabReady,
    staleTime: 20_000,
    // Post novo no topo nao invalida os objetos dos posts que nao mudaram: o memo do PostCard
    // deixa os outros de fora. Sem isso, replaceEqualDeep compara por posicao e cada card
    // re-renderiza quando alguem publica.
    structuralSharing: keepPostsById,
    // O feed não se renova sozinho: quem mantém a lista em dia é a varredura de `feed-live.ts`,
    // uma página por vez, sem trocar o que está na tela (ver `feedRefreshOptions`).
    ...feedRefreshOptions(tab),
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

function useSuggestions(enabled: boolean) {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ["network", "suggestions"],
    // Busca um lote maior: o "ver outras" gira entre os 4 primeiros sem pedir de novo.
    queryFn: () => networkApi.suggestions(12),
    enabled: authenticated && enabled,
    staleTime: 120_000,
  });
}

function useEvents(enabled: boolean) {
  const authenticated = useIsAuthenticated();
  return useQuery({
    queryKey: ["events"],
    queryFn: () => eventsApi.list(),
    enabled: authenticated && enabled,
    staleTime: 120_000,
  });
}

/**
 * A fileira de um post no feed. O wrapper existe sempre, no mesmo índice da árvore, porque o
 * `ref` (observer de "visto") só é condicional ao índice 0 — se o wrapper some quando o post sai
 * do topo, o React vê um tipo de elemento diferente ali e remonta o `PostCard`, perdendo estado
 * local (comentários abertos) sempre que uma publicação nova chega (issue #743).
 */
export const FeedPostRow = memo(function FeedPostRow({
  post,
  index,
  feedTab,
  firstPostRef,
}: {
  post: PostView;
  index: number;
  feedTab: HomeTab;
  firstPostRef: (element: HTMLElement | null) => void;
}) {
  return (
    <div ref={index === 0 ? firstPostRef : undefined}>
      <PostCard post={post} feedTab={feedTab} />
    </div>
  );
});

// Exportada para o teste da guarda de duplo envio; a rota continua montando pelo Route.
export function Home() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const authenticated = useIsAuthenticated();
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(min-width: 64rem)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  // A aba vem da URL; trocar de aba REPLACES o histórico (o "voltar" continua voltando para a
  // página anterior, e não passeando pelas abas).
  const { aba, compor } = Route.useSearch();
  const navigate = Route.useNavigate();
  // Interface profissional: o início É o feed corporativo (publicações de trabalho). O feed social
  // continua a uma aba de distância, nas duas interfaces.
  const context = useInterfaceContext();
  const professional = context === "PROFESSIONAL";
  // Sem `?aba=` a tela reabre na última aba escolhida (guardada no navegador); sem nada guardado,
  // "Tudo" na social e "Corporativo" na profissional.
  const {
    tab,
    setTab,
    ready: tabReady,
    socialTab: lastSocialTab,
  } = useFeedTab(aba, professional, (next) => {
    void navigate({ search: next === null ? {} : { aba: next }, replace: true });
  });

  // Dentro do corporativo o seletor volta para a aba social em que a pessoa estava.
  const otherFeed: HomeTab = professional ? lastSocialTab : "CORPORATE";
  const [menuTopic, setMenuTopic] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  const [questionStatus, setQuestionStatus] = useState<QuestionStatus>("all");
  // The backend honors type (and resolved) only on the "Tudo" tab.
  const questionsFeed = tab === "ALL" && typeFilter === "QUESTION";
  const {
    data: feedData,
    isLoading: feedQueryLoading,
    isFetching: feedFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFeed(
    tab,
    tab === "ALL" ? typeFilter : undefined,
    questionsFeed ? RESOLVED_FILTER[questionStatus] : undefined,
    tabReady,
  );
  // Enquanto a aba guardada não é lida, a tela mostra o carregando em vez de um feed vazio.
  const feedLoading = feedQueryLoading || !tabReady;
  // Renovação de fundo: confere uma página por vez do que já está carregado e junta por id, sem
  // refazer a consulta (que traria todas as páginas e reescreveria o topo embaixo de quem lê).
  useFeedLiveRefresh({
    queryClient,
    queryKey: feedQueryKey(
      tab,
      tab === "ALL" ? typeFilter : undefined,
      questionsFeed ? RESOLVED_FILTER[questionStatus] : undefined,
    ),
    enabled: authenticated && tabReady,
  });
  const { data: profile } = useProfile();
  const { data: suggestions } = useSuggestions(isDesktop);
  const { data: eventsData } = useEvents(isDesktop);
  const {
    data: corporate,
    isError: corporateError,
    isFetching: corporateFetching,
    refetch: refetchCorporate,
  } = useQuery({
    queryKey: ["business-profile"],
    queryFn: () => corporateApi.me(),
    enabled: authenticated,
    staleTime: 120_000,
  });
  const identity = effectiveIdentity(context, corporate);
  const corporateState = professionalProfileState({ data: corporate, isError: corporateError });
  // Na interface profissional só a identidade profissional publica: sem perfil ativo, o
  // compositor dá lugar ao convite para criar/ativar (nada sai pelo perfil social daqui). Se a
  // consulta falhou ou ainda carrega, não se sabe: nada de convite, só o erro com "tentar de novo".
  const composerLocked = professional && corporateState !== "ACTIVE";

  const [draft, setDraft] = useState("");
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [postType, setPostType] = useState<PostView["type"]>(() =>
    compor === "ARTICLE" ? "ARTICLE" : "INSIGHT",
  );
  // The composer rests as one line (ComposerLauncher) until the person starts; any shortcut opens it.
  const [composerOpen, setComposerOpen] = useState(() => compor !== undefined);
  const composerRef = useRef<HTMLFormElement>(null);
  // Shortcut requests are one-shot: drop them from the URL so a refresh opens the usual composer.
  useEffect(() => {
    if (!compor) return;
    setComposerOpen(true);
    void navigate({ search: (prev) => ({ ...prev, compor: undefined }), replace: true });
  }, [compor, navigate]);
  // Opening puts the cursor in the field, so one tap on the launcher (or on "Publicar") is enough.
  useEffect(() => {
    if (composerOpen) composerRef.current?.querySelector<HTMLElement>(`[role="textbox"]`)?.focus();
  }, [composerOpen]);
  // Assunto do post avulso (obrigatório: sem ele o post fica fora dos filtros e de "O que quero
  // ver"/"não gosto"). Em comunidade o post herda o assunto DELA — lá o compositor é outro.
  const [topic, setTopic] = useState<string>(() => readLastTopic());
  const [media, setMedia] = useState<MediaItem[]>([]);
  const mediaReady = media.every(
    (item) =>
      item.type !== "image" ||
      item.file.type === "application/pdf" ||
      (item.moderationStatus === "allowed" && Boolean(item.mediaId)),
  );
  const [mediaSpoiler, setMediaSpoiler] = useState(false);
  const [conductLessonOpen, setConductLessonOpen] = useState(false);
  // Vídeo acima dos limites (#656): popup com a regra antes de o upload sair.
  const [videoLimitReason, setVideoLimitReason] = useState<"size" | "duration" | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState<string | null>(null);
  const [pageHtml, setPageHtml] = useState("");
  const [articleBody, setArticleBody] = useState("");
  // Agendamento: o post fica na fila do backend e só entra no feed na hora marcada.
  const [schedulingOpen, setSchedulingOpen] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  // Publicar também no feed profissional (#723): a mesma publicação sai como BUSINESS assinada
  // pelo perfil profissional. A oferta só existe fora da interface profissional (lá tudo já vai
  // para o feed corporativo), com o perfil ativo, e para os tipos que pertencem aos dois feeds.
  const [crossPost, setCrossPostState] = useState(false);
  const [crossPostError, setCrossPostError] = useState<string | null>(null);
  // Marcar a oferta tira o aviso de "sem perfil profissional": a próxima tentativa é nova.
  const setCrossPost = (v: boolean) => {
    setCrossPostState(v);
    setCrossPostError(null);
  };
  const crossPostAvailable =
    !professional && corporateState === "ACTIVE" && postType !== "BUSINESS";
  const crossPostByType = crossPostsToCorporate(postType, true);
  const crossPosting = crossPostAvailable && crossPostByType && crossPost;
  // A identidade ativa manda no tipo: profissional publica BUSINESS (destino: feed
  // corporativo) e, voltando para social, a seleção fica em INSIGHT. A publicação já saiu com
  // o tipo que a pessoa escolheu: trocar a identidade não reescreve a seleção de quem escreve.
  const postTypeSelecionado = useRef(postType);
  postTypeSelecionado.current = postType;
  useEffect(() => {
    if (identity === "CORPORATE") {
      setPostType("BUSINESS");
    } else {
      setPostType((current) =>
        current === "BUSINESS"
          ? postTypeSelecionado.current === "BUSINESS"
            ? "INSIGHT"
            : postTypeSelecionado.current
          : current,
      );
    }
  }, [identity]);

  const availableTypes = availableFeedPostTypes(identity);
  const resolvedPostType = resolveFeedPostType(identity, postType);
  const pageMode = resolvedPostType === "PAGE";
  // Qualquer trabalho em andamento mantém o compositor inteiro aberto (rascunho, mídia, tipo
  // diferente do de repouso). BUSINESS é o repouso da identidade profissional: contá-lo prendia
  // o compositor expandido para sempre e o launcher nunca aparecia.
  const composerExpanded = composerExpandedWith({
    open: composerOpen,
    draft,
    mediaCount: media.length,
    postType: resolvedPostType,
  });
  const articleMode = resolvedPostType === "ARTICLE";
  // Enquete: o campo de cima vira o título e as alternativas são o que se vota.
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [pollMultipleChoice, setPollMultipleChoice] = useState(false);
  const [pollEndsAt, setPollEndsAt] = useState<string | undefined>(undefined);
  const pollMode = resolvedPostType === "POLL";
  const currentType =
    availableTypes.find((option) => option.id === resolvedPostType) ?? availableTypes[0];
  const fileRef = useRef<HTMLInputElement>(null);
  // Guarda de reentrada da publicação (ver `publishPost`): um ref, não estado — o segundo envio
  // precisa ser descartado na hora, sem esperar um novo render.
  const publishingRef = useRef(false);
  const upload = useMediaUpload();

  // Resultado da publicação: o post criado, e o erro cru para saber o que explicar (sem perfil
  // profissional ativo não há como mandar a publicação ao feed profissional).
  const createPost = useMutation({
    mutationFn: async (data: CreatePostInput) => {
      try {
        return { post: await feedApi.create(data), failure: null };
      } catch (error) {
        return { post: null, failure: error };
      }
    },
    onSuccess: () => {
      // O post novo entra no topo: confere a primeira página de cada feed na tela, sem refazer as
      // páginas que a pessoa já carregou.
      void refreshFeedFirstPage(queryClient);
    },
  });

  const scheduledQuery = useQuery({
    queryKey: ["feed", "scheduled"],
    queryFn: () => feedApi.scheduled(),
    enabled: authenticated,
    staleTime: 60_000,
  });
  const scheduledList = scheduledQuery.data ?? [];

  // Rascunho do compositor (V332): um por conta, em qualquer dispositivo. Salva sozinho
  // enquanto a pessoa escreve; publicar, agendar ou descartar apaga.
  const draftQuery = useQuery({
    queryKey: ["feed", "draft"],
    queryFn: () => feedApi.draft(),
    enabled: authenticated && !composerLocked,
  });
  const [rascunhoSalvoEm, setRascunhoSalvoEm] = useState<string | null>(null);

  // Restaurar o rascunho do servidor UMA vez, e só se o compositor está intocado aqui — quem
  // já começou a escrever não é sobrescrito pelo que veio de outro dispositivo. Mídia anexada
  // não faz parte do rascunho (os arquivos só sobem ao publicar): quem restaurar reanexa.
  const rascunhoRestauradoRef = useRef(false);
  useEffect(() => {
    const salvo = draftQuery.data?.draft;
    if (!salvo || rascunhoRestauradoRef.current) return;
    rascunhoRestauradoRef.current = true;
    const compositorIntacto =
      draft.trim() === "" &&
      media.length === 0 &&
      pageHtml === "" &&
      articleBody === "" &&
      normalizePollOptions(pollOptions).length === 0;
    if (!compositorIntacto) return;
    setPostType(resolveFeedPostType(identity, salvo.type as PostView["type"]));
    setDraft(salvo.content ?? "");
    setPageHtml(salvo.pageHtml ?? "");
    setArticleBody(salvo.articleBody ?? "");
    if (salvo.topic) setTopic(salvo.topic);
    if (salvo.pollOptions.length > 0) setPollOptions([...salvo.pollOptions]);
    setPollMultipleChoice(salvo.pollMultipleChoice);
    setPollEndsAt(salvo.pollEndsAt ? valorDeDataLocal(new Date(salvo.pollEndsAt)) : undefined);
    setMentionedUserIds(salvo.mentionedUserIds);
    setComposerOpen(true);
    setRascunhoSalvoEm(salvo.updatedAt);
    // Regravar o que acabou de chegar é escrita à toa: o primeiro autosave depois da
    // restauração é pulado; a próxima mudança de verdade salva.
    pularAutosaveRef.current = true;
    // Roda uma vez, quando o rascunho chega (a guarda do ref impede repetição).
  }, [draftQuery.data]);

  // Autosave: 1,5s depois da última mudança, o estado do compositor viaja para o servidor.
  // Mesma régua mínima do backend: só salva quando há algo para restaurar. Falha no autosave
  // é silenciosa — a pessoa segue escrevendo, e o rascunho anterior continua lá.
  const pularAutosaveRef = useRef(false);
  const saveDraftMutation = useMutation({
    mutationFn: (data: Parameters<typeof feedApi.saveDraft>[0]) => feedApi.saveDraft(data),
    onSuccess: (resposta) => setRascunhoSalvoEm(resposta.draft.updatedAt),
  });
  useEffect(() => {
    if (!authenticated || composerLocked) return;
    const temConteudo =
      (pageMode ? pageHtml.trim() !== "" : draft.trim() !== "") ||
      (articleMode && articleBody.trim() !== "") ||
      (pollMode && normalizePollOptions(pollOptions).length > 0);
    if (!temConteudo) return;
    const id = setTimeout(() => {
      if (pularAutosaveRef.current) {
        pularAutosaveRef.current = false;
        return;
      }
      saveDraftMutation.mutate({
        type: resolvedPostType,
        content: pageMode ? "" : draft,
        ...(pageMode ? { pageHtml } : {}),
        ...(articleMode ? { articleBody } : {}),
        ...(topic ? { topic } : {}),
        ...(pollMode ? { pollOptions: normalizePollOptions(pollOptions) } : {}),
        ...(pollMode ? { pollMultipleChoice } : {}),
        ...(pollMode && pollEndsAt ? { pollEndsAt: new Date(pollEndsAt).toISOString() } : {}),
        ...(pageMode ? {} : { mentionedUserIds }),
      });
    }, 1500);
    return () => clearTimeout(id);
  }, [
    authenticated,
    composerLocked,
    draft,
    postType,
    pageMode,
    pageHtml,
    articleMode,
    articleBody,
    pollMode,
    pollOptions,
    pollMultipleChoice,
    pollEndsAt,
    topic,
    mentionedUserIds,
  ]);

  /** Descartar apaga o rascunho salvo E limpa o compositor: começar de novo é isso. */
  const descartarRascunho = () => {
    setRascunhoSalvoEm(null);
    void feedApi.discardDraft().catch(() => {});
    setDraft("");
    setMentionedUserIds([]);
    setPostType("INSIGHT");
    setMedia([]);
    setMediaSpoiler(false);
    setPageHtml("");
    setArticleBody("");
    setPollOptions(["", ""]);
    setPollMultipleChoice(false);
    setPollEndsAt(undefined);
    setSchedulingOpen(false);
  };

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
    if (!mediaReady) return;
    const content = draft.trim();
    if (pageMode ? !pageHtml.trim() : !content) return;
    if (articleMode && !articleBody.trim()) return;
    if (!topic) return;
    const scheduledOptions = normalizePollOptions(pollOptions);
    if (pollMode && scheduledOptions.length < POLL_MIN_OPTIONS) return;
    if (!scheduleAt) return;

    setPublishError(null);
    try {
      let mediaIds: string[] = [];
      let finalContent = content;
      if (!pageMode && media.length > 0) {
        mediaIds = await uploadComposerMedia(media, upload.uploadAll);
        // Mídia NO MEIO do texto (item 9): pendentes viram ids reais no upload.
        finalContent = finalContent.replace(/\{\{media:pendente-(\d+)\}\}/g, (_mk, index) => {
          const uploaded = mediaIds[Number(index)];
          return uploaded ? `{{media:${uploaded}}}` : "";
        });
      }
      await schedulePost.mutateAsync({
        type: resolvedPostType,
        content: pageMode ? "" : finalContent,
        mediaIds,
        mediaSpoiler,
        // As menções viajam com o agendado e valem na PUBLICAÇÃO (quem foi marcado é avisado
        // quando o post entra no ar, não quando foi agendado).
        mentionedUserIds: pageMode ? [] : mentionedUserIds,
        ...(pageMode ? { pageHtml } : {}),
        ...(articleMode ? { articleBody } : {}),
        ...(pollMode ? { pollOptions: scheduledOptions } : {}),
        // O assunto viaja com o agendado e vale quando ele entra no ar.
        topic,
        scheduledAt: new Date(scheduleAt).toISOString(),
      });
      setDraft("");
      setMentionedUserIds([]);
      setPostType("INSIGHT");
      // Publicou: a próxima publicação parte de nova escolha (a oferta vem marcada de novo).
      postTypeSelecionado.current = "INSIGHT";
      setMedia([]);
      setMediaSpoiler(false);
      setPageHtml("");
      setArticleBody("");
      setPollOptions(["", ""]);
      setScheduleAt("");
      setSchedulingOpen(false);
      // Agendou: o rascunho não tem mais o que guardar.
      setRascunhoSalvoEm(null);
      void feedApi.discardDraft().catch(() => {});
    } catch {
      // o motivo já foi para o publishError pelo onError da mutation
    }
  };

  // O mínimo do input datetime-local é AGORA+1min (o backend recusa mais perto que isso).
  const minScheduleAt = valorDeDataLocal(new Date(Date.now() + 60_000));

  /**
   * Depois de publicar de fato: se a publicação foi ao feed profissional, a lista corporativa na
   * tela também confere a primeira página (o refresh da publicação cobre o feed em que ela está).
   */
  const handlePublished = async (postId: string | null, corporate: boolean) => {
    if (!corporate) return;
    try {
      const linked = await authApi.oauthProviders();
      if (postId && linked.some((l) => l.provider === "LINKEDIN")) {
        setLinkedinUrl(`${texts.siteUrl}/post/${postId}`);
      }
    } catch {
      // sem a checagem, simplesmente não oferta — a publicação no énois já aconteceu
    }
    const key = feedQueryKey("CORPORATE", undefined, undefined);
    void queryClient.invalidateQueries({ queryKey: key });
  };

  const publishPost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Guarda de reentrada: o botão desabilita com `createPost.isPending`, mas ele só liga quando o
    // `mutateAsync` começa — antes disso há awaits (upload da mídia) em que um segundo Enter
    // publicaria duas vezes.
    if (publishingRef.current) return;
    if (!mediaReady) return;
    const content = draft.trim();
    // Pagina e uma coisa OU outra: o HTML e o conteudo e o texto do post nao e exigido. Artigo
    // precisa de titulo (o texto de cima) E do corpo. Nos demais, o texto de cima e o post.
    if (pageMode ? !pageHtml.trim() : !content) return;
    if (articleMode && !articleBody.trim()) return;
    if (!topic) return;
    // Enquete sem pelo menos 2 alternativas preenchidas não sai (o backend recusaria em 400).
    const options = normalizePollOptions(pollOptions);
    if (pollMode && options.length < POLL_MIN_OPTIONS) return;
    publishingRef.current = true;
    const formData = new FormData(event.currentTarget);
    setPublishError(null);
    // Publicação replicada sai como BUSINESS: é o tipo que o perfil profissional assina e o que
    // o feed corporativo lista (#723).
    const replicada = crossPosting;
    try {
      let mediaIds: string[] = [];
      if (!pageMode && media.length > 0) {
        mediaIds = await uploadComposerMedia(media, upload.uploadAll);
      }
      const result = await createPost.mutateAsync({
        content: pageMode ? "" : content,
        type: replicada ? "BUSINESS" : resolvedPostType,
        mediaIds,
        mediaSpoiler,
        ...(pageMode ? { pageHtml } : {}),
        ...(articleMode ? { articleBody } : {}),
        ...(pollMode ? { pollOptions: options, pollMultipleChoice, pollEndsAt } : {}),
        mentionedUserIds: pageMode ? [] : mentionedUserIds,
        topic,
        website: String(formData.get("website") ?? ""),
      });
      if (result.failure !== null) {
        throw result.failure;
      }
      const created = result.post;
      // "Também no LinkedIn": só para publicações da identidade PROFISSIONAL (o perfil pessoal
      // nunca compartilha no LinkedIn), replicadas no feed profissional inclusive.
      setDraft("");
      setMentionedUserIds([]);
      setPostType("INSIGHT");
      setMedia([]);
      setMediaSpoiler(false);
      setPageHtml("");
      setArticleBody("");
      setPollOptions(["", ""]);
      // Publicou: o rascunho não tem mais o que guardar.
      setRascunhoSalvoEm(null);
      void feedApi.discardDraft().catch(() => {});
      void handlePublished(created?.id ?? null, postType === "BUSINESS" || replicada);
    } catch (err) {
      // Replicar sem perfil profissional ativo: a oferta desmarcou (o post segue no feed social
      // ao enviar de novo); qualquer outro erro fica na mensagem da publicação.
      if (replicada && crossPostFailureMessage(err)) {
        setCrossPost(false);
        setCrossPostError(crossPostFailureMessage(err));
      }
      setPublishError(
        crossPostFailureMessage(err) ??
          (err instanceof Error ? err.message : texts.feed.composer.publishError),
      );
    } finally {
      publishingRef.current = false;
    }
  };

  const addMediaFiles = (files: File[]) => {
    if (files.length === 0) return;

    for (const file of files) {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf";
      if (!isVideo && !isImage && !isPdf) continue;

      const hasExistingImages = media.some((m) => m.type === "image");
      const hasExistingVideo = media.some((m) => m.type === "video");

      if (isVideo && (hasExistingImages || hasExistingVideo || media.length >= 1)) break;
      if ((isImage || isPdf) && hasExistingVideo) break;
      if ((isImage || isPdf) && media.length >= 4) break;

      const preview = URL.createObjectURL(file);
      const item: MediaItem = {
        type: isVideo ? "video" : "image",
        file,
        preview,
        ...(isImage ? { moderationStatus: "checking" } : {}),
      };
      setMedia((prev) => [...prev, item]);
      if (isImage) {
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
          .catch((error: unknown) => {
            if (error instanceof VideoLimitError) {
              setVideoLimitReason(error.reason);
            }
            const isProhibited = isProhibitedContent(error);
            if (isProhibited) {
              setConductLessonOpen(true);
            }
            setMedia((current) =>
              current.map((entry) =>
                entry.preview === preview
                  ? {
                      ...entry,
                      moderationStatus: isProhibited ? "prohibited" : "blocked",
                      moderationError:
                        error instanceof Error
                          ? error.message
                          : texts.feed.composer.imageCheckError,
                    }
                  : entry,
              ),
            );
          });
      }
    }
  };

  // Files picked on the profile shortcut arrive once, right after the navigation.
  useEffect(() => {
    if (compor === "MEDIA") addMediaFiles(takeComposerFiles());
    // one-shot on arrival; addMediaFiles is rebuilt every render.
  }, [compor]);

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

  // "Você está em dia" lives only on "Para você". The marker counts as it arrived on the first page
  // OF THIS VISIT: after POST /feed/seen a refetch would bring the new value and the divider would
  // jump to the top while the person reads.
  const firstPage = feedData?.pages[0];
  const caughtUpTab = carriesCaughtUp(tab);
  const [lastSeenAt, setLastSeenAt] = useState<string | null | undefined>(undefined);
  if (lastSeenAt === undefined && caughtUpTab && firstPage) {
    setLastSeenAt(firstPage.lastSeenAt ?? null);
  }
  // A primeira página que a atualização reescreveu espera fora da lista enquanto a pessoa lê: dentro
  // dela, cada post novo empurraria todos os cartões para baixo.
  const arrivals = useFeedArrivals(
    feedData,
    tab,
    `${tab}|${typeFilter}|${questionsFeed ? questionStatus : ""}`,
  );
  const { posts: feedPosts, caughtUpAt } = caughtUpOrder(
    arrivals.pages.flatMap((page) => page.items),
    caughtUpTab ? (lastSeenAt ?? null) : null,
  );
  const firstPostRef = useMarkFeedSeen(feedPosts, caughtUpTab);

  // Puxar para renovar no topo, em toque: renova SÓ a lista do feed — o gesto é sobre o que está
  // na tela, não sobre o aplicativo. O indicador de renovação é o mesmo da busca automática.
  const [refreshingFeed, setRefreshingFeed] = useState(false);
  const refreshingFeedRef = useRef(false);
  const pullToRefresh = usePullToRefresh(
    useCallback(() => {
      if (refreshingFeedRef.current) return;
      refreshingFeedRef.current = true;
      setRefreshingFeed(true);
      void refreshFeedFirstPage(queryClient).finally(() => {
        refreshingFeedRef.current = false;
        setRefreshingFeed(false);
      });
    }, [queryClient]),
    (feedFetching && !isFetchingNextPage) || refreshingFeed,
  );

  useEffect(() => {
    let ticking = false;
    const updateScrollTopVisibility = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setShowScrollTop(window.scrollY > 400);
          ticking = false;
        });
        ticking = true;
      }
    };

    updateScrollTopVisibility();
    window.addEventListener("scroll", updateScrollTopVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollTopVisibility);
  }, []);

  // The saved position belongs to the pages the reader left, not to a first page a refresh rewrote.
  // A held first page is a new list; the first post of the current one is a later page arriving.
  const feedListSignature = `${arrivals.held === null ? "current" : "held"}|${feedPosts[0]?.id ?? ""}`;

  useEffect(() => {
    if (feedLoading || feedPosts.length === 0 || typeof window === "undefined") return;

    const savedScroll = readFeedScroll(tab);
    if (!savedScroll) return;

    // Se o post salvo ainda nao chegou (paginacao), busca a proxima pagina.
    const loaded = feedPosts.some((post) => post.id === savedScroll.postId);
    if (!loaded && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
      return;
    }

    // A pagina pode nao ser alta o suficiente ainda pra posicao salva.
    if (!canReachScroll(savedScroll.scrollY)) return;

    clearFeedScroll();
    const restore = () => {
      window.scrollTo({ top: savedScroll.scrollY, behavior: "auto" });
      document.getElementById(`feed-post-${savedScroll.postId}`)?.focus({ preventScroll: true });
    };

    requestAnimationFrame(() => requestAnimationFrame(restore));
    // `feedPosts` is rebuilt every render; its length and which list it is are the signal.
  }, [
    feedLoading,
    feedPosts.length,
    feedListSignature,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    tab,
  ]);

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
      <h1 className="sr-only">{texts.navigation.items.feed}</h1>

      <NightRestReminder />

      {/* Pergunta única ao voltar do vínculo com o LinkedIn (flag gravada pelo diálogo de contas). */}
      <LinkedInSyncPrompt />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <SaciDuelBanner />

          {composerLocked && (corporateState === "ERROR" || corporateState === "NOT_READY") && (
            <ProfessionalComposerNotice
              state={corporateState}
              onRetry={() => void refetchCorporate()}
              retrying={corporateFetching}
            />
          )}

          {/* Outside the composer so the launcher's media button can open it in the same tap. */}
          {!composerLocked && (
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*,application/pdf"
              multiple
              className="hidden"
              onChange={handleMediaSelect}
            />
          )}

          {/* Composer at rest: one line with the signer's photo; the full form only once opened. */}
          {!composerLocked && !composerExpanded && (
            <ComposerLauncher
              avatar={
                identity === "CORPORATE" ? corporate?.avatar || undefined : profileUser?.avatar
              }
              avatarFrame={identity === "CORPORATE" ? undefined : profileUser?.avatarFrame}
              name={
                identity === "CORPORATE"
                  ? (corporate?.name ?? texts.feed.you)
                  : (profileUser?.name ?? texts.feed.you)
              }
              onOpen={() => setComposerOpen(true)}
              onAddMedia={() => {
                // Inside the tap: Safari only opens a file picker from the user's gesture.
                fileRef.current?.click();
                setComposerOpen(true);
              }}
            />
          )}

          {/* Composer */}
          {!composerLocked && composerExpanded && (
            <form
              ref={composerRef}
              onSubmit={publishPost}
              className="relative surface-card p-4 sm:p-5"
            >
              {/* Na borda de cima do compositor, dentro da folga: não cobre o campo nem botões. */}
              <SaciSpot spot="feed" className="absolute -top-4 right-4" />
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
                {/* Quem assina aparece no compositor: no profissional, a foto do perfil profissional. */}
                <UserAvatar
                  frame={identity === "CORPORATE" ? undefined : profileUser?.avatarFrame}
                  frameOverflow="hidden"
                  src={
                    identity === "CORPORATE" ? corporate?.avatar || undefined : profileUser?.avatar
                  }
                  alt={
                    identity === "CORPORATE"
                      ? (corporate?.name ?? texts.feed.you)
                      : (profileUser?.name ?? texts.feed.you)
                  }
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
                    /* Ctrl+Enter publica: o atalho passa pelo mesmo submit do formulário (honeypot
                       e guarda de reentrada incluídos), não por um caminho próprio. */
                    onSubmitShortcut={() => composerRef.current?.requestSubmit()}
                  />
                )}
              </div>

              {crossPostAvailable && (
                <ComposerCrossPost
                  checked={crossPost}
                  onChange={setCrossPost}
                  unavailableReason={crossPostByType ? null : texts.feed.composer.crossPost.byType}
                  error={crossPostError}
                />
              )}

              {postType === "QUESTION" && <QuestionComposerHint className="mt-2 pl-14" />}

              {pollMode && (
                <PollComposer
                  options={pollOptions}
                  onChange={setPollOptions}
                  multipleChoice={pollMultipleChoice}
                  onMultipleChoiceChange={setPollMultipleChoice}
                  endsAt={pollEndsAt}
                  onEndsAtChange={setPollEndsAt}
                />
              )}

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
                    /* Mesmo atalho do campo de cima: escrever o artigo inteiro sem sair do
                       teclado. */
                    onSubmitShortcut={() => composerRef.current?.requestSubmit()}
                  />
                </div>
              )}

              {!pageMode && media.length > 0 && (
                <div className="relative mt-3">
                  {mediaType === "image" ? (
                    <div
                      className={`grid gap-2 ${media.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
                    >
                      {media.map((item, i) => {
                        // A prévia é `blob:` do arquivo que a própria pessoa escolheu; o `src`
                        // só recebe esse esquema.
                        const previewUrl = mediaPreviewUrl(item.preview);
                        return (
                          <div
                            key={i}
                            className="relative overflow-hidden rounded-xl border border-border-soft"
                          >
                            <SpoilerPreview
                              active={mediaSpoiler}
                              label={texts.posts.mediaSpoiler.badge}
                            >
                              {item.file.type === "application/pdf" && previewUrl ? (
                                <PdfAttachmentCard
                                  url={previewUrl}
                                  title={item.file.name}
                                  file={item.file}
                                />
                              ) : (
                                <img
                                  src={previewUrl}
                                  alt=""
                                  className={`h-48 w-full object-cover bg-surface-1 ${item.moderationStatus === "prohibited" ? "scale-105 blur-lg" : ""}`}
                                />
                              )}
                            </SpoilerPreview>

                            {item.moderationStatus === "prohibited" && (
                              <div className="absolute inset-0 grid place-items-center bg-surface-card/85 p-3 text-center backdrop-blur-md">
                                <div className="max-w-xs">
                                  <AlertTriangle
                                    aria-hidden
                                    className={cn(
                                      "mx-auto mb-1.5 h-7 w-7 text-amber-500 animate-pulse",
                                      "dark:text-amber-400",
                                    )}
                                  />

                                  <p className="text-sm font-semibold text-text-strong">
                                    {texts.feed.composer.imageProhibitedTitle}
                                  </p>

                                  <p className="mt-1 text-xs text-text-subtle">
                                    {texts.feed.composer.imageProhibitedMessage}
                                  </p>

                                  <button
                                    type="button"
                                    onClick={() => setConductLessonOpen(true)}
                                    className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-colors"
                                  >
                                    <GraduationCap className="h-3.5 w-3.5" aria-hidden />

                                    <>{texts.conductLesson.open}</>
                                  </button>
                                </div>
                              </div>
                            )}

                            {item.moderationStatus === "checking" && (
                              <div className="absolute inset-0 grid place-items-center bg-surface-card/70 backdrop-blur-sm">
                                <span className="rounded-full bg-surface-card px-3 py-1 text-xs text-text-strong">
                                  {texts.feed.composer.imageChecking}
                                </span>
                              </div>
                            )}
                            {item.moderationStatus === "blocked" && (
                              <div className="absolute inset-x-2 bottom-2 rounded-lg bg-destructive/90 px-2 py-1 text-xs text-white">
                                {item.moderationError ?? texts.feed.composer.imageCheckError}
                              </div>
                            )}

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
                        );
                      })}
                    </div>
                  ) : (
                    <div className="relative overflow-hidden rounded-xl border border-border-soft">
                      <SpoilerPreview active={mediaSpoiler} label={texts.posts.mediaSpoiler.badge}>
                        <video
                          src={mediaPreviewUrl(media[0].preview)}
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

              <div
                data-composer-toolbar=""
                className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border-soft pt-3 text-sm font-normal text-text-subtle"
              >
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
                            : "border border-dashed border-primary/60 text-text-strong hover:border-primary",
                        )}
                      >
                        <span className="truncate">
                          {topic
                            ? (TOPIC_LABELS[topic as keyof typeof TOPIC_LABELS] ?? topic)
                            : texts.feed.composer.topicRequired}
                        </span>

                        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-text-subtle" />
                      </button>
                    </PopoverTrigger>

                    <PopoverContent align="start" className="w-56 p-1">
                      <div className="flex max-h-72 flex-col gap-0.5 overflow-y-auto">
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
                  <div>
                    <PostTypePicker
                      options={availableTypes}
                      value={resolvedPostType}
                      onChange={(id) => setPostType(id as PostView["type"])}
                    />

                    {currentType.id === "MOMENT" && (
                      <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                        <Clock className="h-3.5 w-3.5" />
                        {currentType.hint}
                      </p>
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
                  {((!pageMode && media.length > 0) ||
                    (pageMode && pageHtml.trim().length > 0)) && (
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

                <ComposerDraftStatus salvoEm={rascunhoSalvoEm} onDescartar={descartarRascunho} />

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
                    // Clicável: aborta o PUT em curso. O progresso agora vem dos bytes reais
                    // enviados (XHR onprogress), não só da contagem de arquivos concluídos.
                    <button
                      type="button"
                      onClick={upload.cancel}
                      className="cursor-pointer text-xs font-normal text-text-subtle underline-offset-2 hover:underline"
                    >
                      {texts.feed.composer.uploadProgress(upload.progress)} · {texts.common.cancel}
                    </button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-full gap-1.5"
                    disabled={
                      (pageMode ? !pageHtml.trim() : !draft.trim()) ||
                      (articleMode && !articleBody.trim()) ||
                      !topic ||
                      createPost.isPending ||
                      upload.status === "uploading" ||
                      !mediaReady
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
                      !topic ||
                      createPost.isPending ||
                      upload.status === "uploading" ||
                      !mediaReady
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
                    disabled={
                      !scheduleAt ||
                      !topic ||
                      schedulePost.isPending ||
                      upload.status === "uploading" ||
                      !mediaReady
                    }
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

              {/* Com mídia e sem texto o Publicar fica desabilitado: diz o que falta. Fica na linha
                de baixo, como o erro, para não apertar os botões no celular. */}
              {!publishError && captionRequired({ postType, mediaCount: media.length, draft }) && (
                <p role="status" className="mt-2 text-right text-xs font-normal text-text-subtle">
                  {texts.feed.composer.captionRequired}
                </p>
              )}

              {publishError && (
                <p className="mt-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-normal text-destructive">
                  {publishError}
                </p>
              )}
            </form>
          )}

          {scheduledList.length > 0 && (
            <section className="surface-card p-4">
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

          {professional && (
            <h2 className="text-sm font-semibold text-text-strong">{texts.feed.tabs.corporate}</h2>
          )}

          <Tabs value={tab} onValueChange={(val) => setTab(val as HomeTab)}>
            <TabsList>
              {HOME_TABS.map((opcao) => {
                const Icon = TAB_ICONS[opcao] ?? Layers;
                const label =
                  opcao === "CORPORATE" && !professional
                    ? texts.feed.tabs.corporate
                    : (TAB_LABELS[opcao] ?? opcao);

                return (
                  <TabsTrigger key={opcao} value={opcao}>
                    <Icon size={16} aria-hidden="true" />

                    <>{label}</>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>

          {tab === "ALL" && (
            <PillRow label={texts.feed.tabs.type}>
              {POST_TYPE_FILTERS.map((f) => {
                const Icon = POST_TYPE_ICONS[f.value] ?? Sparkles;
                const active = typeFilter === f.value;

                return (
                  <Pill
                    key={f.value}
                    size="sm"
                    active={active}
                    onClick={() => setTypeFilter(f.value)}
                  >
                    <Icon size={14} aria-hidden="true" />

                    <>{f.label}</>
                  </Pill>
                );
              })}
            </PillRow>
          )}

          {questionsFeed && (
            <QuestionStatusFilter value={questionStatus} onChange={setQuestionStatus} />
          )}

          <div className="relative">
            {arrivals.notice && (
              <button
                type="button"
                data-new-posts
                onClick={arrivals.release}
                className="fixed left-1/2 top-20 z-50 animate-[slide-down_0.4s_ease-out_forwards] rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-lg hover:brightness-110 active:scale-95 sm:top-24"
              >
                <span className="flex items-center gap-1.5">
                  <ArrowUp className="h-3.5 w-3.5 animate-bounce" />

                  {arrivals.held
                    ? texts.feed.newPostsCount(arrivals.held.count)
                    : texts.feed.newPosts}
                </span>
              </button>
            )}

            {feedLoading && <PostCardSkeletons />}

            {!feedLoading && ((feedFetching && !isFetchingNextPage) || refreshingFeed) && (
              <div
                role="status"
                className="pointer-events-none absolute inset-x-0 -top-8 z-10 flex justify-center"
              >
                <span className="inline-flex items-center gap-2 rounded-full bg-surface-card px-3 py-1.5 text-sm text-text-subtle shadow-[var(--shadow-float)]">
                  <Loader2 aria-hidden className="h-4 w-4 animate-spin text-primary" />
                  {texts.feed.refreshing}
                </span>
              </div>
            )}

            {/* Feedback do gesto de puxar: o ponto acompanha o dedo, passa do limite girando
                contínuo e ao soltar vira o "Atualizando..." de cima. Sem isso o gesto parecia
                não fazer nada — e, sem o overscroll do documento bloqueado, o Chrome assumia
                o gesto e recarregava a página inteira. */}
            {pullToRefresh.pulling && !feedFetching && !refreshingFeed && (
              <PullIndicator pull={pullToRefresh.pull} trigger={pullToRefresh.trigger} />
            )}

            <div className="space-y-4">
              {!feedLoading &&
                feedPosts.map((p, index) => {
                  const row = (
                    <Fragment key={p.id}>
                      {index === caughtUpAt && <CaughtUpDivider />}

                      <FeedPostRow
                        post={p}
                        index={index}
                        feedTab={tab}
                        firstPostRef={firstPostRef}
                      />
                    </Fragment>
                  );

                  // A entrada do feed principal, logo depois do compositor: a vitrine de quem está
                  // lendo, ou o convite para montar a dela, antes de qualquer publicação.
                  return tab === "FOR_YOU" && index === 0 ? (
                    <Fragment key={`portfolio-${p.id}`}>
                      <PortfolioFeedEntry />
                      {row}
                    </Fragment>
                  ) : (
                    row
                  );
                })}

              {!feedLoading && feedPosts.length === 0 && (
                <EmptyState
                  title={tab === "INTERACTED" ? texts.feed.emptyInteracted : texts.feed.empty}
                />
              )}

              <InfiniteScroll
                hasMore={Boolean(hasNextPage)}
                loading={isFetchingNextPage}
                onLoadMore={loadNextPage}
                loadingLabel={texts.feed.loadingMore}
                endLabel={feedPosts.length > 0 ? texts.feed.endOfFeed : undefined}
              />
            </div>
          </div>
        </div>

        {/* Right rail: TUDO num único filho do grid. O cartão de doação já foi um filho solto
            aqui — ele esticava até a altura da coluna inteira e empurrava/escondia os outros
            cartões (o que está acontecendo agora) para fora da dobra. */}
        <aside className="sticky top-20 hidden max-h-[calc(100vh-10rem)] space-y-4 self-start overflow-y-auto scrollbar-on-hover lg:block">
          {/* Three quiet tables at most: what happens today, people to meet, and support as one
              line at the end. "Novidades para explorar" left (it repeated the menu; Explore has
              every room) and so did the profile card (the account menu carries it). */}
          {eventList.length > 0 && (
            <div className="surface-card p-4 sm:p-5">
              <h2 className="text-sm font-extrabold text-text-strong">
                {texts.feed.sidebar.happeningNow}
              </h2>

              <ul className="mt-3 space-y-3">
                {eventList.slice(0, 3).map((e) => {
                  const ticket = ingressoDeEvento(e.date);
                  return (
                    <li key={e.id}>
                      {/* O item inteiro é o link para o evento. A seta é o que diz isso: sem ela, o
                        título só reagia no hover e a linha parecia texto solto. */}
                      <Link
                        to="/eventos"
                        search={{ evento: e.id }}
                        className="group/ev flex items-center gap-3"
                      >
                        {/* An event is a ticket: amber when it happens today. */}
                        {ticket && (
                          <EventTicket
                            day={ticket.day}
                            month={ticket.month}
                            tone={ticket.today ? "today" : "primary"}
                          />
                        )}

                        <span className="min-w-0 flex-1">
                          <p className="text-sm font-normal text-text-strong underline-offset-2 group-hover/ev:underline">
                            {e.title}
                          </p>

                          <p className="text-xs font-normal text-text-subtle">
                            {texts.feed.sidebar.eventMeta(
                              e.time,
                              texts.events.formats[e.format],
                              texts.feed.sidebar.confirmed(e.attendees),
                            )}
                          </p>
                        </span>

                        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-text-subtle transition group-hover/ev:translate-x-0.5 group-hover/ev:text-primary" />
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <Link
                to="/eventos"
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                {texts.feed.sidebar.seeAllEvents}
              </Link>
            </div>
          )}
          <TodayGamesCard enabled={isDesktop} />

          {suggestionList.length > 0 && (
            <div className="surface-card p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" />

                <h2 className="text-sm font-normal text-text-strong">
                  {texts.feed.sidebar.suggestions}
                </h2>

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
                    <ProfilePeek username={u.username} name={u.name} className="shrink-0">
                      <UserAvatar
                        src={u.avatar}
                        frame={u.avatarFrame}
                        alt={u.name}
                        className="h-10 w-10"
                      />
                    </ProfilePeek>

                    {/* `overflow-hidden` é a contenção de verdade: o nome personalizado pode vir
                        com fonte maior e sombra, e sem isso ele pinta por cima do "Conectar". */}
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <ProfilePeek
                        username={u.username}
                        name={u.name}
                        className="block max-w-full truncate text-sm font-normal text-text-strong hover:underline"
                      >
                        <StyledName name={u.name} style={u.nameStyle} />
                      </ProfilePeek>

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

          <CompanyPromptCard enabled={isDesktop} />
          <ApoieCard />
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
          className="fixed bottom-20 right-4 z-40 rounded-full border-border-soft bg-surface-card/95 shadow-lg backdrop-blur-sm lg:hidden"
        >
          <ArrowUp className="h-4 w-4" aria-hidden />
        </Button>
      )}

      <ConductLessonDialog open={conductLessonOpen} onOpenChange={setConductLessonOpen} />

      <Dialog
        open={videoLimitReason !== null}
        onOpenChange={(open) => !open && setVideoLimitReason(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{texts.feed.composer.videoLimitTitle}</DialogTitle>

            <DialogDescription>
              {videoLimitReason === "duration"
                ? texts.feed.composer.videoLimitDuration(3)
                : texts.feed.composer.videoLimitSize(10, 3)}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button onClick={() => setVideoLimitReason(null)}>
              {texts.feed.composer.videoLimitClose}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
