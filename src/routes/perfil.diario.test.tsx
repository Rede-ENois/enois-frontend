// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { DiarioEvento } from "@/types/application/feed/diario-evento";
import type { DiarioPagina } from "@/types/application/feed/diario-pagina";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Frases do desenho que vivem no design system (mensagens padrão `diario`); o pacote não
 * exporta as mensagens, então o teste as repete — a fonte da verdade é o design system.
 */
const ds = {
  publicacao: "Publicação",
  comentario: "Comentário",
  repost: "Repost",
  vazio: "Nada por aqui ainda. Quando houver atividade, ela aparece nesta linha do tempo.",
  carregarMais: "Carregar mais",
  contextoDe: (autorNome: string) => `por ${autorNome}`,
};

/**
 * O diário de atividade do perfil: este teste prende a cola da rota — a aba DIARIO busca
 * /users/{username}/diario por cursor, entrega os eventos ao componente do design system e o
 * clique num evento abre o post dele (/post/$postId).
 */

const mocks = vi.hoisted(() => ({
  listDiario: vi.fn(),
  navegar: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    options,
    useSearch: () => ({}),
    useNavigate: () => () => undefined,
    notFound: () => undefined,
  }),
  useNavigate: () => mocks.navegar,
  Link: (props: Record<string, unknown>) => <a {...props} />,
  notFound: () => undefined,
}));
vi.mock("@/lib/api", () => ({
  ApiError: class extends Error {},
  contributorSealsApi: {},
  feedApi: { listDiario: mocks.listDiario },
  gamesApi: {},
  messagesApi: {},
  networkApi: {},
  profileApi: {},
  rankingApi: {},
  recommendationsApi: {},
  authApi: {},
}));
vi.mock("@/lib/api/media", () => ({ resolveCdnUrl: (url: string | null) => url ?? "" }));

const { PerfilDiario } = await import("./perfil.$username");

const evento = (overrides: Partial<DiarioEvento> = {}): DiarioEvento => ({
  tipo: "PUBLICACAO",
  quando: "2026-11-15T18:00:00Z",
  postId: "post_1",
  trecho: "publicação no diário",
  contexto: null,
  ...overrides,
});

const pagina = (itens: DiarioEvento[], nextCursor: string | null = null): DiarioPagina => ({
  itens,
  nextCursor,
});

describe("o diário de atividade do perfil", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  const settle = () => act(() => new Promise<void>((done) => setTimeout(done, 0)));

  const render = async () => {
    await act(async () => {
      root.render(
        <QueryClientProvider client={client}>
          <PerfilDiario username="ana" />
        </QueryClientProvider>,
      );
    });
    await settle();
    await settle();
  };

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    mocks.listDiario.mockReset();
    mocks.navegar.mockReset();
    mocks.listDiario.mockResolvedValue(pagina([]));
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

  it("busca o diário pelo username e entrega os eventos ao design system", async () => {
    mocks.listDiario.mockResolvedValue(
      pagina([
        evento({ tipo: "PUBLICACAO", trecho: "publicação de hoje" }),
        evento({
          tipo: "COMENTARIO",
          postId: "post_2",
          trecho: "opinião no post da Ana",
          contexto: { autorNome: "Ana", autorUsername: "ana", trecho: "post original da Ana" },
        }),
        evento({ tipo: "REPOST", postId: "post_3", trecho: "repostado" }),
      ]),
    );
    await render();

    expect(mocks.listDiario).toHaveBeenCalledWith("ana", null, 20);
    expect(host.textContent).toContain(ds.publicacao);
    expect(host.textContent).toContain(ds.comentario);
    expect(host.textContent).toContain(ds.repost);
    expect(host.textContent).toContain("opinião no post da Ana");
    expect(host.textContent).toContain(ds.contextoDe("Ana"));
    expect(host.textContent).toContain("post original da Ana");
  });

  it("o clique no evento abre o post dele", async () => {
    mocks.listDiario.mockResolvedValue(
      pagina([evento({ postId: "post_alvo", trecho: "clique aqui" })]),
    );
    await render();

    const botao = [...host.querySelectorAll("button")].find(
      (b) => b.textContent === "clique aqui",
    )!;
    act(() => botao.click());
    expect(mocks.navegar).toHaveBeenCalled();
    const chamada = mocks.navegar.mock.calls[0][0];
    expect(chamada.to).toBe("/post/$postId");
    expect(chamada.params.postId).toBe("post_alvo");
  });

  it("carrega a página seguinte pelo cursor do Carregar mais", async () => {
    mocks.listDiario
      .mockResolvedValueOnce(pagina([evento({ postId: "p1" })], "cursor-1"))
      .mockResolvedValueOnce(pagina([evento({ postId: "p2", trecho: "segunda página" })], null));
    await render();

    expect(host.textContent).toContain(ds.carregarMais);
    const carregar = [...host.querySelectorAll("button")].find(
      (b) => b.textContent === ds.carregarMais,
    )!;
    await act(async () => {
      carregar.click();
    });
    await settle();

    expect(mocks.listDiario).toHaveBeenLastCalledWith("ana", "cursor-1", 20);
    expect(host.textContent).toContain("segunda página");
    // Acabou o diário: o botão sai.
    expect(host.textContent).not.toContain(ds.carregarMais);
  });

  it("sem eventos mostra a mensagem de vazio do design system", async () => {
    mocks.listDiario.mockResolvedValue(pagina([]));
    await render();
    expect(host.textContent).toContain(ds.vazio);
  });

  it("enquanto a primeira página carrega, o vazio não pisca", async () => {
    let resolve!: (p: DiarioPagina) => void;
    mocks.listDiario.mockReturnValue(
      new Promise<DiarioPagina>((done) => {
        resolve = done;
      }),
    );
    await act(async () => {
      root.render(
        <QueryClientProvider client={client}>
          <PerfilDiario username="ana" />
        </QueryClientProvider>,
      );
    });
    await settle();

    expect(host.textContent).not.toContain(ds.vazio);
    expect(
      host.querySelectorAll("[data-slot], [class*='skeleton'], [class*='animate']").length,
    ).toBeGreaterThan(0);

    await act(async () => {
      resolve(pagina([]));
    });
    await settle();
    expect(host.textContent).toContain(ds.vazio);
  });
});
