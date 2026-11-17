// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { PostMedia } from "@/types/application/feed/post-media";
import type { PostView } from "@/types/application/feed/post-view";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Frases do desenho que vivem no design system (mensagens padrão `profileGallery`); o pacote não
 * exporta as mensagens, então o teste as repete — a fonte da verdade é o design system.
 */
const ds = {
  openPhoto: "Abrir foto",
  revealPhoto: "Foto sensível: toque para revelar",
  counter: (index: number, total: number) => `Foto ${index} de ${total}`,
  zoomIn: "Ampliar",
  loadMore: "Carregar mais fotos",
  error: "Não foi possível abrir as fotos. Tente de novo.",
};

/**
 * A galeria de fotos do perfil: a rota traduz a aba MÍDIA do feed em fotos para o carrossel do
 * design system. Este teste prende essa tradução — só imagem com endereço vira foto, foto
 * sensível nasce velada, o botão de carregar mais caminha pelo cursor e o visualizador abre na
 * foto clicada. Sem fotos, a seção não existe no perfil.
 */

const mocks = vi.hoisted(() => ({
  listByUserId: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    options,
    useSearch: () => ({}),
    useNavigate: () => () => undefined,
    notFound: () => undefined,
  }),
  Link: (props: Record<string, unknown>) => <a {...props} />,
  notFound: () => undefined,
}));
vi.mock("@/lib/api", () => ({
  ApiError: class extends Error {},
  contributorSealsApi: {},
  feedApi: { listByUserId: mocks.listByUserId },
  gamesApi: {},
  messagesApi: {},
  networkApi: {},
  profileApi: {},
  rankingApi: {},
  recommendationsApi: {},
  authApi: {},
}));
vi.mock("@/lib/api/media", () => ({ resolveCdnUrl: (url: string | null) => url ?? "" }));

const { PerfilFotos } = await import("./perfil.$username");

const midia = (id: string, overrides: Partial<PostMedia> = {}): PostMedia => ({
  id,
  cdnUrl: `https://cdn.example.test/${id}.jpg`,
  mimeType: "image/jpeg",
  width: 800,
  height: 600,
  ...overrides,
});

const post = (id: string, media: PostMedia[], overrides: Partial<PostView> = {}): PostView => ({
  id,
  authorId: "u1",
  authorUsername: "ana",
  authorName: "Ana",
  authorAvatar: null,
  type: "INSIGHT",
  content: `post ${id}`,
  tags: [],
  mediaIds: media.map((item) => item.id),
  createdAt: "2026-11-01T12:00:00Z",
  visibility: "PUBLIC",
  counters: { reactions: 0, comments: 0, saves: 0, shares: 0, reposts: 0 },
  status: "ACTIVE",
  media,
  mediaSpoiler: false,
  ...overrides,
});

const pagina = (items: PostView[], nextCursor: string | null = null) => ({
  items,
  nextCursor,
});

describe("a galeria de fotos do perfil", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  const settle = () => act(() => new Promise<void>((done) => setTimeout(done, 0)));

  const render = async () => {
    await act(async () => {
      root.render(
        <QueryClientProvider client={client}>
          <PerfilFotos userId="u1" />
        </QueryClientProvider>,
      );
    });
    await settle();
    await settle();
  };

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    mocks.listByUserId.mockReset();
    mocks.listByUserId.mockResolvedValue(pagina([]));
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
  });

  it("sem fotos, a seção não existe", async () => {
    mocks.listByUserId.mockResolvedValue(pagina([post("p1", [])]));
    await render();

    expect(host.textContent).not.toContain(texts.profile.sections.photos);
  });

  it("a aba MÍDIA vira tira de fotos: só imagem com endereço, na ordem", async () => {
    mocks.listByUserId.mockResolvedValue(
      pagina([
        post("p1", [midia("m1"), midia("video", { mimeType: "video/mp4" })]),
        post("p2", [midia("sem-url", { cdnUrl: null }), midia("m2")]),
      ]),
    );
    await render();

    expect(host.textContent).toContain(texts.profile.sections.photos);
    expect(mocks.listByUserId).toHaveBeenCalledWith("u1", null, 24, "MEDIA");

    const miniaturas = host.querySelectorAll("img");
    expect(miniaturas).toHaveLength(2);
    expect(miniaturas[0]?.getAttribute("src")).toContain("m1.jpg");
    expect(miniaturas[1]?.getAttribute("src")).toContain("m2.jpg");
  });

  it("a foto sensível nasce velada na tira e se revela no visualizador", async () => {
    mocks.listByUserId.mockResolvedValue(
      pagina([post("p1", [midia("m1")], { mediaSpoiler: true })]),
    );
    await render();

    const miniatura = host.querySelector("img");
    expect(miniatura?.className).toContain("blur-md");

    const abrir = [...host.querySelectorAll("button")].find(
      (botao) => botao.getAttribute("aria-label") === ds.openPhoto,
    );
    if (!abrir) throw new Error("miniatura não renderizada");
    await act(async () => abrir.click());
    await settle();

    const dialogo = document.body.querySelector('[role="dialog"]');
    expect(dialogo?.textContent).toContain(ds.revealPhoto);
  });

  it("abrir uma foto mostra o visualizador com zoom na foto clicada", async () => {
    mocks.listByUserId.mockResolvedValue(
      pagina([post("p1", [midia("m1")]), post("p2", [midia("m2")])]),
    );
    await render();

    const abrir = [...host.querySelectorAll("button")].find(
      (botao) => botao.getAttribute("aria-label") === ds.openPhoto,
    );
    if (!abrir) throw new Error("miniatura não renderizada");
    await act(async () => abrir.click());
    await settle();

    const dialogo = document.body.querySelector('[role="dialog"]');
    expect(dialogo?.textContent).toContain(ds.counter(1, 2));
    expect(document.body.querySelector(`button[aria-label="${ds.zoomIn}"]`)).not.toBeNull();
  });

  it("quando há mais páginas, o cursor caminha", async () => {
    mocks.listByUserId
      .mockResolvedValueOnce(pagina([post("p1", [midia("m1")])], "cursor-1"))
      .mockResolvedValueOnce(pagina([post("p2", [midia("m2")])]));

    await render();
    const carregar = [...host.querySelectorAll("button")].find(
      (botao) => botao.textContent === ds.loadMore,
    );
    if (!carregar) throw new Error("botão de carregar mais não renderizado");
    await act(async () => carregar.click());
    await settle();
    await settle();

    expect(mocks.listByUserId).toHaveBeenNthCalledWith(2, "u1", "cursor-1", 24, "MEDIA");
    expect(host.querySelectorAll("img")).toHaveLength(2);
  });

  it("sem fotos e com erro, o aviso do design system aparece", async () => {
    mocks.listByUserId.mockRejectedValue(new Error("falta rede"));
    await render();

    expect(host.textContent).toContain(texts.profile.sections.photos);
    expect(host.textContent).toContain(ds.error);
  });
});
