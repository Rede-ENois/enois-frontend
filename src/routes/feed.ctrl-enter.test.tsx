// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Home } from "./feed";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Ctrl+Enter no campo do compositor publica o post. O atalho entra pelo mesmo submit do
 * formulário (`requestSubmit`), então a guarda de reentrada vale também para ele: um segundo
 * Ctrl+Enter enquanto a publicação ainda não resolveu não publica duas vezes.
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
// O editor de menção é o campo do rascunho: um textarea simples repassa o atalho de envio.
vi.mock("@/components/mention-textarea", () => ({
  MentionTextarea: ({
    onChange,
    onSubmitShortcut,
  }: {
    onChange: (value: string, ids: string[]) => void;
    onSubmitShortcut?: () => void;
  }) => (
    <textarea
      data-testid="composer-draft"
      onKeyDown={(event) => {
        if (event.ctrlKey && event.key === "Enter") onSubmitShortcut?.();
      }}
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

describe("Ctrl+Enter no compositor do feed", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.draft.value = "";
    // A publicação nunca resolve: mantém a janela de reentrada aberta entre os dois atalhos.
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

  async function typeDraft(text: string) {
    act(() => {
      const area = host.querySelector<HTMLTextAreaElement>('[data-testid="composer-draft"]');
      expect(area).not.toBeNull();
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
      setter.call(area!, text);
      area!.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => {});
  }

  function pressCtrlEnter() {
    return act(async () => {
      const area = host.querySelector<HTMLElement>('[data-testid="composer-draft"]')!;
      area.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", ctrlKey: true, bubbles: true }),
      );
    });
  }

  it("Ctrl+Enter no campo publica o post pelo submit do formulário", async () => {
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Home />
        </QueryClientProvider>,
      ),
    );

    await typeDraft("texto do post");
    expect(mocks.create).not.toHaveBeenCalled();

    await pressCtrlEnter();
    await act(async () => {});

    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(mocks.create.mock.calls[0]?.[0]?.content).toBe("texto do post");
  });

  it("um segundo Ctrl+Enter durante a publicação NÃO publica duas vezes", async () => {
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Home />
        </QueryClientProvider>,
      ),
    );

    await typeDraft("texto do post");
    await pressCtrlEnter();
    await pressCtrlEnter();
    await act(async () => {});

    expect(mocks.create).toHaveBeenCalledTimes(1);
  });
});
