// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot, hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
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
  suggestions: vi.fn().mockResolvedValue([]),
  events: vi.fn().mockResolvedValue({ items: [] }),
  games: vi.fn().mockResolvedValue([]),
  companies: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/api", () => ({
  authApi: { oauthProviders: vi.fn().mockResolvedValue([]) },
  communitiesApi: { follow: vi.fn(), unfollow: vi.fn() },
  companiesApi: { mine: mocks.companies },
  corporateApi: { status: vi.fn().mockResolvedValue({ state: "ACTIVE" }) },
  eventsApi: { list: mocks.events },
  feedApi: {
    list: vi.fn().mockResolvedValue({ items: [], nextCursor: null, lastSeenAt: null }),
    corporate: vi.fn().mockResolvedValue({ items: [], nextCursor: null, lastSeenAt: null }),
    scheduled: vi.fn().mockResolvedValue([]),
    create: mocks.create,
  },
  gamesApi: { trendingToday: mocks.games },
  mediaApi: { get: vi.fn() },
  networkApi: { suggestions: mocks.suggestions },
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
vi.mock("@/components/feed/post-type-picker", () => ({ PostTypePicker: () => null }));
vi.mock("@/components/feed/professional-composer-notice", () => ({
  ProfessionalComposerNotice: () => null,
}));
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

vi.mock("@rede-enois/design-system/domain", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@rede-enois/design-system/domain")>();
  return { ...actual, TodayGamesCard: () => null };
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
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
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

  it("consulta a barra lateral apenas no desktop e preserva o convite dispensado", async () => {
    vi.useFakeTimers();
    let desktop = false;
    const listeners = new Set<() => void>();
    vi.stubGlobal("matchMedia", (query: string) => ({
      get matches() {
        return query === "(min-width: 64rem)" && desktop;
      },
      addEventListener: (_type: string, listener: () => void) => {
        if (query === "(min-width: 64rem)") listeners.add(listener);
      },
      removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
    }));
    const calls = () =>
      [mocks.suggestions, mocks.events, mocks.games, mocks.companies].map(
        (query) => query.mock.calls.length,
      );
    const flush = () =>
      act(async () => {
        await vi.advanceTimersByTimeAsync(5);
      });
    const resize = async (matches: boolean) => {
      await act(async () => {
        desktop = matches;
        listeners.forEach((listener) => listener());
      });
      await flush();
    };

    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Home />
        </QueryClientProvider>,
      ),
    );
    await flush();
    expect(calls()).toEqual([0, 0, 0, 0]);
    expect(listeners.size).toBe(1);

    await resize(true);
    expect(calls()).toEqual([1, 1, 1, 1]);

    await resize(false);
    await act(async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["network", "suggestions"] }),
        client.invalidateQueries({ queryKey: ["events"] }),
        client.invalidateQueries({ queryKey: ["games", "trending", "today"] }),
        client.invalidateQueries({ queryKey: ["companies", "mine"] }),
      ]);
    });
    expect(calls()).toEqual([1, 1, 1, 1]);

    await resize(true);
    expect(calls()).toEqual([2, 2, 2, 2]);
    const close = host.querySelector<HTMLButtonElement>('button[aria-label="Fechar"]');
    expect(close).not.toBeNull();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("armazenamento bloqueado");
    });
    await act(async () => close!.click());
    expect(host.textContent).not.toContain("Sua empresa no Énóis");

    await resize(false);
    await resize(true);
    expect(host.textContent).not.toContain("Sua empresa no Énóis");
  });

  it("hidrata a barra lateral no desktop sem diferença em relação ao servidor", async () => {
    vi.stubGlobal("matchMedia", () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const app = (
      <QueryClientProvider client={client}>
        <Home />
      </QueryClientProvider>
    );
    const html = renderToString(app);
    expect(mocks.suggestions).not.toHaveBeenCalled();
    expect(mocks.events).not.toHaveBeenCalled();
    expect(mocks.games).not.toHaveBeenCalled();
    expect(mocks.companies).not.toHaveBeenCalled();

    await act(async () => root.unmount());
    host.innerHTML = html;
    const onRecoverableError = vi.fn();
    await act(async () => {
      root = hydrateRoot(host, app, { onRecoverableError });
    });
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(mocks.suggestions).toHaveBeenCalledTimes(1);
    expect(mocks.events).toHaveBeenCalledTimes(1);
    expect(mocks.games).toHaveBeenCalledTimes(1);
    expect(mocks.companies).toHaveBeenCalledTimes(1);
  });
});
