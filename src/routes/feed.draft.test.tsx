// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Home } from "./feed";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Rascunho do compositor (V332): restaura o que veio do servidor quando o compositor está
 * intocado, salva sozinho 1,5s depois da última tecla, e sai da frente quando publicar,
 * agendar ou descartar resolvem — o mesmo rascunho em qualquer dispositivo.
 */

const mocks = vi.hoisted(() => ({
  rota: { compor: undefined as string | undefined },
  draftApi: vi.fn(),
  saveDraft: vi.fn(),
  discardDraft: vi.fn(),
  list: vi.fn(),
  create: vi.fn(),
  uploadAll: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  authApi: { oauthProviders: vi.fn().mockResolvedValue([]) },
  communitiesApi: { follow: vi.fn(), unfollow: vi.fn() },
  corporateApi: { status: vi.fn().mockResolvedValue({ state: "ACTIVE" }) },
  eventsApi: { list: vi.fn().mockResolvedValue({ items: [] }) },
  feedApi: {
    list: mocks.list,
    corporate: vi.fn().mockResolvedValue({ items: [], nextCursor: null, lastSeenAt: null }),
    scheduled: vi.fn().mockResolvedValue([]),
    draft: mocks.draftApi,
    saveDraft: mocks.saveDraft,
    discardDraft: mocks.discardDraft,
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
  MentionTextarea: ({
    value,
    onChange,
  }: {
    value?: string;
    onChange: (value: string, ids: string[]) => void;
  }) => (
    <textarea
      data-testid="composer-draft"
      value={value ?? ""}
      onChange={(event) => {
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
      useSearch: () => ({ aba: undefined, compor: mocks.rota.compor }),
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

const rascunhoServidor = {
  id: "draft_1",
  type: "INSIGHT",
  content: "onde eu parei ontem",
  pageHtml: null,
  articleBody: null,
  topic: "TECNOLOGIA",
  pollOptions: [],
  pollMultipleChoice: false,
  pollEndsAt: null,
  mentionedUserIds: [],
  createdAt: "2026-11-15T10:00:00Z",
  updatedAt: "2026-11-15T10:05:00Z",
};

const digitar = (host: HTMLDivElement, texto: string) =>
  act(() => {
    const area = host.querySelector<HTMLTextAreaElement>('[data-testid="composer-draft"]');
    expect(area).not.toBeNull();
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;
    setter.call(area!, texto);
    area!.dispatchEvent(new Event("input", { bubbles: true }));
  });

describe("rascunho do compositor", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  const montar = async () => {
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Home />
        </QueryClientProvider>,
      ),
    );
    // As notificações da react-query viajam por setTimeout(0): com os timers falsos,
    // adiantá-los é o que faz a resposta chegar ao componente.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5);
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mocks.list.mockReset().mockResolvedValue({ items: [], nextCursor: null, lastSeenAt: null });
    mocks.draftApi.mockResolvedValue({ draft: null });
    mocks.saveDraft.mockImplementation((data: { content: string }) =>
      Promise.resolve({ draft: { ...rascunhoServidor, content: data.content } }),
    );
    mocks.discardDraft.mockResolvedValue({ status: "DISCARDED" });
    // Compor via atalho abre o compositor; os testes de restauração trocam para undefined.
    mocks.rota.compor = "POST";
    localStorage.setItem("connect-grow-last-topic", "TECNOLOGIA");
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    vi.useRealTimers();
    host.remove();
    client.clear();
    localStorage.clear();
  });

  it("compositor intocado restaura o rascunho do servidor e abre o compositor", async () => {
    mocks.rota.compor = undefined;
    mocks.draftApi.mockResolvedValue({ draft: rascunhoServidor });
    await montar();

    const area = host.querySelector<HTMLTextAreaElement>('[data-testid="composer-draft"]');
    expect(area).not.toBeNull();
    expect(area!.value).toBe("onde eu parei ontem");
    expect(host.textContent).toContain("Rascunho salvo");
    // O primeiro autosave depois da restauração é pulado: regravar o mesmo texto é escrita à toa.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600);
    });
    expect(mocks.saveDraft).not.toHaveBeenCalled();
  });

  it("compositor já em uso não é sobrescrito pelo rascunho do servidor", async () => {
    let resolverRascunho: (valor: { draft: typeof rascunhoServidor | null }) => void;
    mocks.draftApi.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolverRascunho = resolve;
        }),
    );
    await montar();
    digitar(host, "texto novo daqui");
    await act(async () => {});
    await act(async () => {
      resolverRascunho!({ draft: rascunhoServidor });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5);
    });

    const area = host.querySelector<HTMLTextAreaElement>('[data-testid="composer-draft"]');
    expect(area!.value).toBe("texto novo daqui");
  });

  it("salva sozinho 1,5s depois da última tecla", async () => {
    await montar();
    digitar(host, "anotando uma ideia");
    await act(async () => {});
    expect(mocks.saveDraft).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600);
    });

    expect(mocks.saveDraft).toHaveBeenCalledTimes(1);
    expect(mocks.saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "INSIGHT",
        content: "anotando uma ideia",
        topic: "TECNOLOGIA",
      }),
    );
    expect(host.textContent).toContain("Rascunho salvo");
  });

  it("digitar pouco não salva rascunho vazio", async () => {
    await montar();
    digitar(host, "   ");
    await act(async () => {});

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600);
    });

    expect(mocks.saveDraft).not.toHaveBeenCalled();
  });

  it("descartar apaga o rascunho salvo e limpa o compositor", async () => {
    mocks.rota.compor = undefined;
    mocks.draftApi.mockResolvedValue({ draft: rascunhoServidor });
    await montar();
    expect(host.querySelector('[data-testid="composer-draft"]')).not.toBeNull();

    const descartar = [...host.querySelectorAll("button")].find(
      (botao) => botao.textContent === "Descartar rascunho",
    );
    expect(descartar).toBeDefined();
    await act(async () => {
      descartar!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await act(async () => {});

    expect(mocks.discardDraft).toHaveBeenCalledTimes(1);
    // O compositor continua aberto (como depois de publicar), mas vazio e sem aviso.
    const area = host.querySelector<HTMLTextAreaElement>('[data-testid="composer-draft"]');
    expect(area).not.toBeNull();
    expect(area!.value).toBe("");
    expect(host.textContent).not.toContain("Rascunho salvo");
  });

  it("publicar apaga o rascunho", async () => {
    mocks.create.mockResolvedValue({ id: "post_1" });
    await montar();
    digitar(host, "saindo do rascunho para o feed");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600);
    });
    expect(mocks.saveDraft).toHaveBeenCalledTimes(1);

    const form = host.querySelector("form");
    expect(form).not.toBeNull();
    await act(async () => {
      form!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    await act(async () => {});

    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(mocks.discardDraft).toHaveBeenCalled();
  });

  it("ao puxar, busca só o topo e mantém o indicador durante a renovação", async () => {
    const key = ["feed", "ALL", "", ""] as const;
    const first = {
      items: [{ id: "p1", createdAt: "2024-01-01T00:00:00Z" }],
      nextCursor: "cursor-1",
      lastSeenAt: null,
    };
    const older = {
      items: [{ id: "p2", createdAt: "2024-01-01T00:00:00Z" }],
      nextCursor: null,
      lastSeenAt: null,
    };
    const fresh = { ...first, items: [older.items[0], first.items[0]] };
    client.setQueryData(key, { pages: [first, older], pageParams: [null, "cursor-1"] });
    let resolveFirst!: (page: typeof fresh) => void;
    mocks.list.mockImplementationOnce(
      () =>
        new Promise<typeof fresh>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    await montar();
    expect(mocks.list).not.toHaveBeenCalled();

    const pull = () => {
      const touch = { clientX: 10, clientY: 0 };
      window.dispatchEvent(
        new TouchEvent("touchstart", { touches: [touch] as unknown as Touch[] }),
      );
      window.dispatchEvent(
        new TouchEvent("touchmove", {
          touches: [{ ...touch, clientY: 90 }] as unknown as Touch[],
        }),
      );
      window.dispatchEvent(new TouchEvent("touchend", { touches: [] }));
    };

    await act(async () => pull());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5);
    });
    expect(mocks.list).toHaveBeenCalledTimes(1);
    expect(mocks.list).toHaveBeenCalledWith(null, 10, "ALL", undefined, undefined);
    expect(host.textContent).toContain("Atualizando publicações…");

    await act(async () => pull());
    expect(mocks.list).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFirst(fresh);
      await vi.advanceTimersByTimeAsync(5);
    });
    expect(mocks.list).toHaveBeenCalledTimes(1);
    const data = client.getQueryData<{ pages: { items: { id: string }[] }[] }>(key);
    expect(data?.pages.map((page) => page.items.map((item) => item.id))).toEqual([
      ["p2", "p1"],
      [],
    ]);
    expect(host.textContent).not.toContain("Atualizando publicações…");

    await act(async () => pull());
    expect(mocks.list).toHaveBeenCalledTimes(2);
  });
});
