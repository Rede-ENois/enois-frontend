// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { MuralContribuicao } from "@/types/application/murais/mural-contribuicao";
import type { MuralResumo } from "@/types/application/murais/mural-resumo";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api-client";

/**
 * A rota de um mural: o quadro abre com cabeçalho e publicações coladas (o card do feed rende
 * cada uma), colar aceita link OU id e extrai o identificador, recusa do servidor aparece na
 * linha de colar, quem colou ou o dono tira a publicação, e só o dono vê editar e remover o
 * quadro. O feed nunca é tocado: tirar do mural só apaga o elo.
 */

const mocks = vi.hoisted(() => ({
  params: vi.fn<() => Record<string, string>>(() => ({ muralId: "m-1" })),
  get: vi.fn(),
  contributions: vi.fn(),
  edit: vi.fn(),
  remove: vi.fn(),
  contribute: vi.fn(),
  removeContribution: vi.fn(),
  navigate: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    options,
    useParams: () => mocks.params(),
  }),
  useNavigate: () => mocks.navigate,
}));
vi.mock("@/lib/api", () => ({
  muraisApi: {
    get: mocks.get,
    contributions: mocks.contributions,
    edit: mocks.edit,
    remove: mocks.remove,
    contribute: mocks.contribute,
    removeContribution: mocks.removeContribution,
  },
}));
vi.mock("@/lib/current-user", () => ({ useCurrentUser: () => ({ data: { id: "dono" } }) }));
vi.mock("@/lib/require-auth", () => ({ requireAuth: () => undefined }));
vi.mock("@rede-enois/design-system/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@rede-enois/design-system/ui")>();
  return { ...actual, useToast: () => ({ toast: mocks.toast }) };
});
vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/post-card", () => ({
  PostCard: ({ post }: { post: { id: string } }) => <article>{`card-do-feed:${post.id}`}</article>,
}));

const { Route } = await import("./murais.$muralId");
const options = (Route as unknown as { options: Record<string, unknown> }).options;
const MuralPage = (options as { component: () => React.JSX.Element }).component;

// Frases do desenho que vivem no design system (mensagens padrão murais*).
const ds = {
  contagem: (n: number) => `${n} publicações coladas`,
  colar: "Colar",
  coladas: "Publicações do mural",
  coladoPor: (nome: string) => `colado por ${nome}`,
  tirar: "Tirar do mural",
  tirarConfirmTitle: "Tirar esta publicação do mural?",
  editar: "Editar mural",
  remover: "Remover mural",
  editarTitulo: "Editar mural",
  salvar: "Salvar",
};

const mural = (extra: Partial<MuralResumo> = {}): MuralResumo => ({
  id: "m-1",
  title: "Fotos da feira",
  description: "O que a feira tem de bonito",
  owner: {
    id: "dono",
    name: "Dona",
    username: "dona",
    avatar: null,
    avatarFrame: null,
    style: null,
  },
  contributions: 2,
  createdAt: "2026-11-01T12:00:00Z",
  ...extra,
});

const autoria = (id: string, nome: string) => ({
  id,
  name: nome,
  username: nome.toLowerCase(),
  avatar: null,
  avatarFrame: null,
  style: null,
});

const colado = (
  postId: string,
  addedById = "visita",
  addedByName = "Visita",
): MuralContribuicao => ({
  postId,
  post: { id: postId } as MuralContribuicao["post"],
  addedBy: autoria(addedById, addedByName),
  addedAt: "2026-11-02T12:00:00Z",
});

describe("rota de um mural", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  const settle = () => act(() => new Promise<void>((done) => setTimeout(done, 0)));
  const settleMuito = async () => {
    await settle();
    await settle();
  };

  const render = async () => {
    await act(async () => {
      root.render(
        <QueryClientProvider client={client}>
          <MuralPage />
        </QueryClientProvider>,
      );
    });
    await settleMuito();
  };

  const botoes = (texto: string) =>
    [...document.body.querySelectorAll("button")].filter(
      (botao) => botao.textContent?.trim() === texto,
    );

  const digitar = async (campo: HTMLInputElement, texto: string) => {
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(campo, texto);
      campo.dispatchEvent(new Event("input", { bubbles: true }));
    });
  };

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.params.mockReturnValue({ muralId: "m-1" });
    mocks.get.mockResolvedValue(mural());
    mocks.contributions.mockResolvedValue({
      items: [colado("post_1"), colado("post_2", "dono", "Dona")],
      nextCursor: null,
    });
    mocks.contribute.mockResolvedValue(colado("post_9"));
    mocks.removeContribution.mockResolvedValue({ removed: true });
    mocks.navigate.mockReturnValue(undefined);
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
    document.body.querySelector("[role='dialog']")?.remove();
  });

  it("o quadro abre com cabeçalho e as publicações coladas rendem como card do feed", async () => {
    await render();

    expect(document.body.textContent).toContain("Fotos da feira");
    expect(document.body.textContent).toContain(ds.contagem(2));
    expect(document.body.textContent).toContain(ds.coladoPor("Visita"));
    expect(document.body.textContent).toContain("card-do-feed:post_1");
    expect(document.body.textContent).toContain("card-do-feed:post_2");
    expect(mocks.contributions).toHaveBeenCalledWith("m-1", null);
  });

  it("colar aceita link inteiro e manda só o id do post", async () => {
    await render();

    const linha = host.querySelector<HTMLInputElement>("input")!;
    await digitar(linha, "https://enois.ia.br/post/post_9?origem=mural");
    await act(async () => botoes(ds.colar)[0].click());
    await settleMuito();

    expect(mocks.contribute).toHaveBeenCalledWith("m-1", "post_9");
    expect(mocks.toast).toHaveBeenCalledWith(texts.murais.colado, "success");
  });

  it("recusa de colagem aparece na linha, traduzida por código", async () => {
    mocks.contribute.mockRejectedValue({ code: "JA_NO_MURAL" });
    await render();

    const linha = host.querySelector<HTMLInputElement>("input")!;
    await digitar(linha, "post_1");
    await act(async () => botoes(ds.colar)[0].click());
    await settleMuito();

    expect(document.body.textContent).toContain(texts.murais.jaNoMural);
  });

  it("quem colou e o dono veem o gesto de tirar; tirar confirma e apaga só o elo", async () => {
    await render();

    const tirares = botoes(ds.tirar);
    expect(tirares.length).toBe(2);
    await act(async () => tirares[0].click());
    await settleMuito();

    const dialogo = document.body.querySelector("[role='dialog']")!;
    expect(dialogo.textContent).toContain(ds.tirarConfirmTitle);
    await act(async () =>
      [...dialogo.querySelectorAll("button")]
        .find((botao) => botao.textContent?.trim() === ds.tirar)!
        .click(),
    );
    await settleMuito();

    expect(mocks.removeContribution).toHaveBeenCalledWith("m-1", "post_1");
    expect(mocks.toast).toHaveBeenCalledWith(texts.murais.tirado, "success");
  });

  it("só o dono do quadro vê editar e remover o mural; editar salva e avisa", async () => {
    await render();
    expect(botoes(ds.editar).length).toBe(1);
    expect(botoes(ds.remover).length).toBe(1);

    await act(async () => botoes(ds.editar)[0].click());
    await settleMuito();
    const dialogo = document.body.querySelector("[role='dialog']")!;
    const titulo = dialogo.querySelector<HTMLInputElement>("#mural-titulo")!;
    expect(titulo.value).toBe("Fotos da feira");
    await digitar(titulo, "Feira de sábado");
    await act(async () => botoes(ds.salvar)[0].click());
    await settleMuito();

    expect(mocks.edit).toHaveBeenCalledWith("m-1", {
      title: "Feira de sábado",
      description: "O que a feira tem de bonito",
    });
    expect(mocks.toast).toHaveBeenCalledWith(texts.murais.editado, "success");
  });

  it("quem abre o mural tem o menu de compartilhar com os três itens", async () => {
    await render();

    expect(document.body.querySelector('button[aria-label="Compartilhar mural"]')).not.toBeNull();
    // Só o quadro recebe o menu; as ações do card do feed (publicações coladas) não o mostram.
    expect(document.body.querySelectorAll('button[aria-label="Compartilhar mural"]')).toHaveLength(
      1,
    );
    await act(async () => {
      document.body
        .querySelector<HTMLButtonElement>('button[aria-label="Compartilhar mural"]')!
        .click();
    });

    const itens = [...document.body.querySelectorAll("button")].map((b) => b.textContent?.trim());
    expect(itens).toContain(texts.murais.compartilharMenuCopiar);
    expect(itens).toContain(texts.murais.compartilharMenuEnviar);
    expect(itens).toContain(texts.murais.compartilharMenuAparelho);
  });

  it("quem não é dono não vê as ações do quadro", async () => {
    mocks.get.mockResolvedValue(mural({ owner: autoria("outro", "Outro") }));
    await render();

    expect(botoes(ds.editar).length).toBe(0);
    expect(botoes(ds.remover).length).toBe(0);
    // A publicação do próprio dono continua removível (ela mesma colou).
    expect(botoes(ds.tirar).length).toBe(1);
  });

  it("mural que não existe mais mostra o vazio traduzido", async () => {
    mocks.get.mockRejectedValue(new ApiError(404, "MURAL_NOT_FOUND", "Mural não encontrado."));
    await render();

    expect(document.body.textContent).toContain(texts.murais.naoEncontrado);
  });

  it("falha de leitura não vira 'não encontrado': a pessoa vê o erro e tenta de novo", async () => {
    mocks.get.mockRejectedValueOnce(
      new ApiError(0, "SESSION_CHECK_UNAVAILABLE", "Não foi possível confirmar sua sessão."),
    );
    await render();

    expect(document.body.textContent).toContain(texts.murais.erroLeitura);
    expect(document.body.textContent).not.toContain(texts.murais.naoEncontrado);
    expect(botoes(texts.murais.tentarDeNovo).length).toBe(1);
  });
});
