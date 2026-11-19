// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api-client";

import { Home } from "./feed";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * #723: a oferta de publicar também no feed profissional. Marcada, a publicação sai como
 * BUSINESS (é o tipo que o perfil profissional assina); recusada pelo backend, a oferta
 * desmarca sozinha para o post ainda sair no feed social.
 */

// Idioma do compositor: o type picker do design system fica de fora do teste, e o tipo escolhido
// entra por ele no mount.
const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  oauthProviders: vi.fn().mockResolvedValue([]),
  draft: { value: "" },
  postType: { value: "INSIGHT" },
}));

vi.mock("@/lib/api", () => ({
  authApi: { oauthProviders: mocks.oauthProviders },
  communitiesApi: { follow: vi.fn(), unfollow: vi.fn() },
  companiesApi: { mine: vi.fn().mockResolvedValue([]) },
  corporateApi: { status: vi.fn().mockResolvedValue({ state: "ACTIVE" }) },
  eventsApi: { list: vi.fn().mockResolvedValue({ items: [] }) },
  feedApi: {
    list: vi.fn().mockResolvedValue({ items: [], nextCursor: null, lastSeenAt: null }),
    corporate: vi.fn().mockResolvedValue({ items: [], nextCursor: null, lastSeenAt: null }),
    scheduled: vi.fn().mockResolvedValue([]),
    create: mocks.create,
  },
  gamesApi: { trendingToday: vi.fn().mockResolvedValue([]) },
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
  useMediaUpload: () => ({ upload: vi.fn(), uploadAll: vi.fn(), status: "idle" }),
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
// O tipo escolhido entra pelo picker; os tipos sociais ouvem o evento dele.
vi.mock("@/components/feed/post-type-picker", () => ({
  PostTypePicker: (props: { value?: string; onChange: (type: string) => void }) => {
    const { onChange } = props;
    return (
      <button
        type="button"
        data-testid="pick-type"
        onClick={() => {
          mocks.postType.value = "PROJECT";
          onChange("PROJECT");
        }}
      />
    );
  },
}));
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

describe("publicar também no feed profissional", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  const mount = async () => {
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Home />
        </QueryClientProvider>,
      ),
    );
    await act(async () => {});
  };

  const write = async (content: string) => {
    act(() => {
      const area = host.querySelector<HTMLTextAreaElement>('[data-testid="composer-draft"]');
      expect(area).not.toBeNull();
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
      setter.call(area!, content);
      area!.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => {});
  };

  const submit = async () => {
    const form = host.querySelector("form");
    expect(form).not.toBeNull();
    await act(async () => {
      form!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    await act(async () => {});
  };

  const checkbox = () => host.querySelector<HTMLInputElement>('input[type="checkbox"]');

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.draft.value = "";
    mocks.postType.value = "INSIGHT";
    mocks.create.mockResolvedValue({ id: "p1", type: "BUSINESS" });
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
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("com a oferta marcada, a publicação sai como BUSINESS", async () => {
    await mount();
    expect(host.textContent).toContain("Publicar também no feed profissional");
    await act(async () =>
      host.querySelector<HTMLButtonElement>('[data-testid="pick-type"]')!.click(),
    );
    await write("novo projeto");
    expect(checkbox()?.checked).toBe(true);

    await submit();

    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(mocks.create.mock.calls[0]![0]).toMatchObject({
      content: "novo projeto",
      type: "BUSINESS",
    });
  });

  it("desmarcada, a publicação fica no tipo do feed social", async () => {
    await mount();
    await act(async () =>
      host.querySelector<HTMLButtonElement>('[data-testid="pick-type"]')!.click(),
    );
    await write("novo projeto");
    await act(async () => checkbox()!.click());

    await submit();

    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(mocks.create.mock.calls[0]![0]).toMatchObject({ type: "PROJECT" });
  });

  it("sem perfil profissional ativo, a recusa desmarca a oferta e explica", async () => {
    mocks.create.mockRejectedValueOnce(
      new ApiError(403, "NO_ACTIVE_CORPORATE_PROFILE", "forbidden"),
    );
    await mount();
    await write("insight do dia");

    await submit();

    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(mocks.create.mock.calls[0]![0]).toMatchObject({ type: "BUSINESS" });
    expect(checkbox()?.checked).toBe(false);
    const alert = host.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain(texts.feed.composer.crossPost.noProfile);

    // A tentativa seguinte publica no feed social, sem a oferta marcada.
    mocks.create.mockResolvedValueOnce({ id: "p2", type: "INSIGHT" });
    await write("insight do dia, de novo");
    await submit();
    expect(mocks.create).toHaveBeenCalledTimes(2);
    expect(mocks.create.mock.calls[1]![0]).toMatchObject({ type: "INSIGHT" });
  });
});
