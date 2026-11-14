// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Home } from "./feed";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Pendência 3 (guardas de clique duplo). O botão de publicar desabilita com `createPost.isPending`,
 * mas ele só liga quando o `mutateAsync` COMEÇA. Antes disso há um await (envio da mídia) em que um
 * segundo Enter/duplo clique publicava o mesmo conteúdo duas vezes. A guarda de reentrada no
 * `publishPost` descarta o segundo envio na hora.
 */

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  uploadAll: vi.fn(),
  draft: { value: "" },
}));

vi.mock("@/lib/api", () => ({
  authApi: { oauthProviders: vi.fn().mockResolvedValue([]) },
  communitiesApi: { follow: vi.fn(), unfollow: vi.fn() },
  corporateApi: { status: vi.fn().mockResolvedValue({ state: "ACTIVE" }) },
  eventsApi: { list: vi.fn().mockResolvedValue({ items: [] }) },
  feedApi: {
    list: vi.fn().mockResolvedValue({ items: [], nextCursor: null, lastSeenAt: null }),
    corporate: vi.fn().mockResolvedValue({ items: [], nextCursor: null, lastSeenAt: null }),
    scheduled: vi.fn().mockResolvedValue([]),
    create: mocks.create,
  },
  mediaApi: { get: vi.fn() },
  networkApi: { suggestions: vi.fn().mockResolvedValue([]) },
  profileApi: { me: vi.fn().mockResolvedValue({ id: "u1" }) },
}));
vi.mock("@/lib/api/seals", () => ({
  sealsApi: { forPost: vi.fn().mockResolvedValue({ seals: [], mySeals: [] }) },
}));
vi.mock("@/lib/use-auth", () => ({
  useAuth: () => ({ requireAuth: () => true, user: { id: "u1" } }),
  useIsAuthenticated: () => true,
}));
vi.mock("@/lib/use-lite-mode", () => ({ useLiteMode: () => false }));
vi.mock("@/lib/feed/video-autoplay", () => ({ autoplayVideoRef: vi.fn() }));
vi.mock("@/lib/feed-scroll-restoration", () => ({
  saveFeedScroll: vi.fn(),
  readFeedScroll: vi.fn(() => null),
  clearFeedScroll: vi.fn(),
  canReachScroll: vi.fn(() => false),
}));
vi.mock("@/lib/feed/saved-posts", () => ({
  savedPostsQueryOptions: () => ({ queryKey: [], queryFn: vi.fn() }),
}));
vi.mock("@/lib/feed/feed-live", () => ({ useFeedLiveRefresh: vi.fn() }));
vi.mock("@/lib/use-media-upload", () => ({
  useMediaUpload: () => ({ upload: mocks.uploadAll, uploadAll: mocks.uploadAll, status: "idle" }),
  VideoLimitError: class VideoLimitError extends Error {},
}));
vi.mock("@/lib/pull-to-refresh", () => ({
  usePullToRefresh: () => ({ pull: 0, pulling: false, trigger: false }),
}));
vi.mock("@/lib/require-auth", () => ({ requireAuth: vi.fn() }));
vi.mock("@/lib/composer-handoff", () => ({ takeComposerFiles: vi.fn(() => []) }));
vi.mock("@/lib/interface-context", () => ({
  useInterfaceContext: () => "SOCIAL",
  effectiveIdentity: () => "SOCIAL",
  professionalProfileState: () => "ACTIVE",
}));

vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/events/saci-spot", () => ({ SaciSpot: () => null }));
vi.mock("@/components/events/saci-duel-banner", () => ({ SaciDuelBanner: () => null }));
vi.mock("@/components/feed/company-prompt-card", () => ({ CompanyPromptCard: () => null }));
vi.mock("@/components/feed/post-type-picker", () => ({ PostTypePicker: () => null }));
vi.mock("@/components/feed/professional-composer-notice", () => ({
  ProfessionalComposerNotice: () => null,
}));
vi.mock("@/components/games/today-games-card", () => ({ TodayGamesCard: () => null }));
vi.mock("@/components/html-editor", () => ({ HtmlEditor: () => null }));
vi.mock("@/components/linkedin-sync-prompt", () => ({ LinkedInSyncPrompt: () => null }));
vi.mock("@/components/moderation/conduct-lesson-dialog", () => ({
  ConductLessonDialog: () => null,
}));
vi.mock("@/components/night-rest-reminder", () => ({ NightRestReminder: () => null }));
vi.mock("@/components/post-card", () => ({ PostCard: () => null }));
vi.mock("@/components/post/poll-composer", () => ({ PollComposer: () => null }));
vi.mock("@/components/profile/profile-peek", () => ({ ProfilePeek: () => null }));
// O editor de menção é o campo do rascunho: um textarea simples bate para digitar o post.
vi.mock("@/components/mention-textarea", () => ({
  MentionTextarea: ({ onChange }: { onChange: (value: string, ids: string[]) => void }) => (
    <textarea
      data-testid="composer-draft"
      onChange={(event) => {
        mocks.draft.value = event.target.value;
        onChange(event.target.value, []);
      }}
    />
  ),
}));

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    Link: ({ children }: { children?: React.ReactNode }) => <a>{children}</a>,
    useLocation: () => ({ pathname: "/feed" }),
    useRouterState: () => ({ location: { pathname: "/feed" } }),
    useMatch: () => ({}),
    createFileRoute: () => (options: Record<string, unknown>) => ({
      ...options,
      useSearch: () => ({ aba: undefined, compor: "POST" }),
      useNavigate: () => vi.fn(),
    }),
  };
});

vi.mock("@rede-enois/design-system/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@rede-enois/design-system/ui")>();
  return { ...actual, useToast: () => ({ toast: vi.fn() }) };
});
vi.mock("@rede-enois/design-system/patterns", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@rede-enois/design-system/patterns")>();
  return { ...actual, InfiniteScroll: () => null };
});

describe("guarda de duplo envio no compositor", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.draft.value = "";
    // A publicação nunca resolve: mantém a janela de reentrada aberta entre os dois envios.
    mocks.create.mockImplementation(() => new Promise(() => undefined));
    localStorage.setItem("connect-grow-last-topic", "TECNOLOGIA");
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    client.clear();
    localStorage.clear();
  });

  it("um segundo envio durante o upload NÃO publica duas vezes", async () => {
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Home />
        </QueryClientProvider>,
      ),
    );

    act(() => {
      const area = host.querySelector<HTMLTextAreaElement>('[data-testid="composer-draft"]');
      expect(area).not.toBeNull();
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
      setter.call(area!, "texto do post");
      area!.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => {});

    const form = host.querySelector("form");
    expect(form).not.toBeNull();

    const submit = () =>
      act(async () => {
        form!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      });

    await submit();
    await submit();
    await act(async () => {});

    expect(mocks.create).toHaveBeenCalledTimes(1);
  });
});
