// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { ColecaoPost } from "@/types/application/colecoes/colecao-post";
import type { ColecaoResumo } from "@/types/application/colecoes/colecao-resumo";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api-client";

/**
 * A rota de uma coleção: a pasta abre com cabeçalho e posts guardados (o card do feed rende cada
 * um), guardar aceita link OU id e extrai o identificador, recusa do servidor aparece na linha
 * de guardar traduzida por código, tirar da pasta confirma e apaga só o elo — o post segue
 * salvo no perfil. Coleção é privada: sempre é sua, então as ações estão lá.
 */

const mocks = vi.hoisted(() => ({
  params: vi.fn<() => Record<string, string>>(() => ({ colecaoId: "c-1" })),
  get: vi.fn(),
  posts: vi.fn(),
  edit: vi.fn(),
  remove: vi.fn(),
  addPost: vi.fn(),
  removePost: vi.fn(),
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
  colecoesApi: {
    get: mocks.get,
    posts: mocks.posts,
    edit: mocks.edit,
    remove: mocks.remove,
    addPost: mocks.addPost,
    removePost: mocks.removePost,
  },
}));
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

const { Route } = await import("./colecoes.$colecaoId");
const options = (Route as unknown as { options: Record<string, unknown> }).options;
const ColecaoPage = (options as { component: () => React.JSX.Element }).component;

// Frases do desenho que vivem no design system (mensagens padrão colecoes*).
const ds = {
  contagem: (n: number) => `${n} posts guardados`,
  guardar: "Guardar",
  guardados: "Posts da coleção",
  guardadoEm: (dia: string) => `guardado em ${dia}`,
  tirar: "Tirar da coleção",
  tirarConfirmTitle: "Tirar este post da coleção?",
  editar: "Editar coleção",
  remover: "Remover coleção",
  salvar: "Salvar",
};

const colecao = (extra: Partial<ColecaoResumo> = {}): ColecaoResumo => ({
  id: "c-1",
  title: "Receitas da vó",
  description: "Tudo que a comunidade postou",
  postCount: 2,
  createdAt: "2026-11-01T12:00:00Z",
  ...extra,
});

const guardado = (postId: string): ColecaoPost => ({
  postId,
  post: { id: postId } as ColecaoPost["post"],
  adicionadoAt: "2026-11-02T12:00:00Z",
});

describe("rota de uma coleção", () => {
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
          <ColecaoPage />
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
    mocks.params.mockReturnValue({ colecaoId: "c-1" });
    mocks.get.mockResolvedValue(colecao());
    mocks.posts.mockResolvedValue({
      items: [guardado("post_1"), guardado("post_2")],
      nextCursor: null,
    });
    mocks.addPost.mockResolvedValue(guardado("post_9"));
    mocks.removePost.mockResolvedValue({ removed: true });
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

  it("a pasta abre com cabeçalho e os posts guardados rendem como card do feed", async () => {
    await render();

    expect(document.body.textContent).toContain("Receitas da vó");
    expect(document.body.textContent).toContain(ds.contagem(2));
    expect(document.body.textContent).toContain(ds.guardadoEm("02 de nov."));
    expect(document.body.textContent).toContain("card-do-feed:post_1");
    expect(document.body.textContent).toContain("card-do-feed:post_2");
    expect(mocks.posts).toHaveBeenCalledWith("c-1", null);
  });

  it("guardar aceita link inteiro e manda só o id do post", async () => {
    await render();

    const linha = host.querySelector<HTMLInputElement>("input")!;
    await digitar(linha, "https://enois.ia.br/post/post_9?origem=colecao");
    await act(async () => botoes(ds.guardar)[0].click());
    await settleMuito();

    expect(mocks.addPost).toHaveBeenCalledWith("c-1", "post_9");
    expect(mocks.toast).toHaveBeenCalledWith(texts.colecoes.guardado, "success");
  });

  it("post não salvo vira recusa traduzida na linha", async () => {
    mocks.addPost.mockRejectedValue({ code: "NAO_SALVO" });
    await render();

    const linha = host.querySelector<HTMLInputElement>("input")!;
    await digitar(linha, "post_3");
    await act(async () => botoes(ds.guardar)[0].click());
    await settleMuito();

    expect(document.body.textContent).toContain(texts.colecoes.naoSalvo);
  });

  it("tirar da pasta confirma e apaga só o elo — o post segue salvo", async () => {
    await render();

    const tirares = botoes(ds.tirar);
    expect(tirares.length).toBe(2);
    await act(async () => tirares[0].click());
    await settleMuito();

    const dialogo = document.body.querySelector("[role='dialog']")!;
    expect(dialogo.textContent).toContain(ds.tirarConfirmTitle);
    expect(dialogo.textContent).toContain("continua salvo no seu perfil");
    await act(async () =>
      [...dialogo.querySelectorAll("button")]
        .find((botao) => botao.textContent?.trim() === ds.tirar)!
        .click(),
    );
    await settleMuito();

    expect(mocks.removePost).toHaveBeenCalledWith("c-1", "post_1");
    expect(mocks.toast).toHaveBeenCalledWith(texts.colecoes.tirado, "success");
  });

  it("a coleção é sua: editar e remover estão lá; editar salva e avisa", async () => {
    await render();
    expect(botoes(ds.editar).length).toBe(1);
    expect(botoes(ds.remover).length).toBe(1);

    await act(async () => botoes(ds.editar)[0].click());
    await settleMuito();
    const dialogo = document.body.querySelector("[role='dialog']")!;
    const titulo = dialogo.querySelector<HTMLInputElement>("#colecao-titulo")!;
    expect(titulo.value).toBe("Receitas da vó");
    await digitar(titulo, "Receitas de festa");
    await act(async () => botoes(ds.salvar)[0].click());
    await settleMuito();

    expect(mocks.edit).toHaveBeenCalledWith("c-1", {
      title: "Receitas de festa",
      description: "Tudo que a comunidade postou",
    });
    expect(mocks.toast).toHaveBeenCalledWith(texts.colecoes.editado, "success");
  });

  it("coleção que não existe mais mostra o vazio traduzido", async () => {
    mocks.get.mockRejectedValue(new ApiError(404, "COLECAO_NOT_FOUND", "Coleção não encontrada."));
    await render();

    expect(document.body.textContent).toContain(texts.colecoes.naoEncontrado);
  });

  it("falha de leitura não vira 'não encontrado': a pessoa vê o erro e tenta de novo", async () => {
    mocks.get.mockRejectedValueOnce(
      new ApiError(0, "SESSION_CHECK_UNAVAILABLE", "Não foi possível confirmar sua sessão."),
    );
    await render();

    expect(document.body.textContent).toContain(texts.colecoes.erroLeitura);
    expect(document.body.textContent).not.toContain(texts.colecoes.naoEncontrado);
    expect(botoes(texts.colecoes.tentarDeNovo).length).toBe(1);

    mocks.get.mockResolvedValue(colecao());
    await act(async () => botoes(texts.colecoes.tentarDeNovo)[0].click());
    await settleMuito();

    expect(document.body.textContent).toContain("card-do-feed:post_1");
  });

  const remover = async () => {
    await act(async () => botoes(ds.remover)[0].click());
    await settleMuito();
    const dialogo = document.body.querySelector("[role='dialog']")!;
    await act(async () =>
      [...dialogo.querySelectorAll("button")]
        .find((botao) => botao.textContent?.trim() === ds.remover)!
        .click(),
    );
    await settleMuito();
  };

  it("remover a coleção apaga no servidor, avisa e volta para a lista", async () => {
    mocks.remove.mockResolvedValue({ removed: true });
    await render();

    await remover();

    expect(mocks.remove).toHaveBeenCalledWith("c-1");
    expect(mocks.toast).toHaveBeenCalledWith(texts.colecoes.removido, "success");
    expect(mocks.navigate).toHaveBeenCalled();
  });

  it("coleção que já sumiu: remover avisa sucesso e volta, em vez de dizer que falhou", async () => {
    mocks.remove.mockRejectedValue(
      new ApiError(404, "COLECAO_NOT_FOUND", "Coleção não encontrada."),
    );
    await render();

    await remover();

    expect(mocks.toast).toHaveBeenCalledWith(texts.colecoes.removido, "success");
    expect(mocks.navigate).toHaveBeenCalled();
  });

  it("recusa de verdade ao remover fica com o aviso de erro e a tela na coleção", async () => {
    mocks.remove.mockRejectedValue(new ApiError(500, "INTERNAL", "erro"));
    await render();

    await remover();

    expect(mocks.toast).toHaveBeenCalledWith(texts.colecoes.erroRemover, "error");
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
