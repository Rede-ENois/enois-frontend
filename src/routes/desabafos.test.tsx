// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { DesabafoPostView } from "@/types/application/desabafos/desabafo-post-view";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A rota dos Desabafos: o app só traduz dados para as views do design system, e este teste
 * prende exatamente essa tradução — a linha do tempo carrega, o deep link do aviso abre as
 * acolhidas, apoiar alterna com uma reação por pessoa, acolher manda o texto, publicar sai do
 * compositor e a recusa do servidor mantém o rascunho para corrigir. As frases do desenho vêm
 * do DS (`@rede-enois/design-system`, mensagens padrão `desabafos*`); as de avisos, de
 * `texts.desabafos`.
 */

const mocks = vi.hoisted(() => ({
  search: vi.fn<() => Record<string, unknown>>(() => ({})),
  feed: vi.fn(),
  comments: vi.fn(),
  publish: vi.fn(),
  removePost: vi.fn(),
  comment: vi.fn(),
  removeComment: vi.fn(),
  react: vi.fn(),
  unreact: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    options,
    useSearch: () => mocks.search(),
    useNavigate: () => () => undefined,
  }),
}));
vi.mock("@/lib/api", () => ({
  desabafosApi: {
    feed: mocks.feed,
    comments: mocks.comments,
    publish: mocks.publish,
    removePost: mocks.removePost,
    comment: mocks.comment,
    removeComment: mocks.removeComment,
    react: mocks.react,
    unreact: mocks.unreact,
  },
}));
vi.mock("@/lib/current-user", () => ({ useCurrentUser: () => ({ data: { id: "me" } }) }));
vi.mock("@/lib/require-auth", () => ({ requireAuth: () => undefined }));
vi.mock("@rede-enois/design-system/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@rede-enois/design-system/ui")>();
  return { ...actual, useToast: () => ({ toast: mocks.toast }) };
});
vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
// A denúncia é testada no próprio componente dela; a rota só precisa saber o tipo do alvo.
vi.mock("@/components/post/report-dialog", () => ({
  ReportDialog: ({
    targetId,
    targetType,
    open,
  }: {
    targetId: string;
    targetType: string;
    open: boolean;
  }) => (open ? <div data-testid="denuncia" data-alvo={`${targetType}:${targetId}`} /> : null),
}));

const { Route } = await import("./desabafos");
const options = (Route as unknown as { options: Record<string, unknown> }).options;
const DesabafosPage = (options as { component: () => React.JSX.Element }).component;

const autoria = (id: string) => ({
  id,
  name: "Autora",
  username: "autora",
  avatar: null,
  avatarFrame: null,
  style: null,
});

const desabafo = (id: string, extra: Partial<DesabafoPostView> = {}): DesabafoPostView => ({
  id,
  author: autoria("autora"),
  content: `Desabafo ${id}`,
  createdAt: "2026-11-01T12:00:00Z",
  reactions: 0,
  reactionSummary: {},
  myReaction: null,
  comments: 0,
  ...extra,
});

const acolhida = {
  id: "c-1",
  postId: "p-1",
  author: autoria("outra"),
  content: "Estou aqui com você",
  createdAt: "2026-11-01T13:00:00Z",
};

// Frases do desenho que vivem no design system (mensagens padrão desabafos*).
const ds = {
  publicar: "Desabafar",
  acolher: "Acolher",
  caixaDeAcolhida: "Acolha com palavras…",
  removerDesabafo: "Remover meu desabafo",
  removerAcolhida: "Remover acolhida",
  denunciar: "Denunciar desabafo",
  verMais: "Ver mais desabafos",
};

describe("rota dos Desabafos", () => {
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
          <DesabafosPage />
        </QueryClientProvider>,
      );
    });
    await settleMuito();
  };

  const botoes = (texto: string) =>
    [...document.body.querySelectorAll("button")].filter(
      (botao) => botao.textContent?.trim() === texto,
    );

  const botaoPorRotulo = (rotulo: string) =>
    document.body.querySelector<HTMLButtonElement>(`button[aria-label="${rotulo}"]`);

  const abrirAcolhidas = async (post: string) => {
    const convite = [...document.body.querySelectorAll("button")].find(
      (botao) =>
        botao.textContent?.includes("acolhida") && botao.getAttribute("aria-expanded") !== null,
    );
    if (!convite) throw new Error(`convite às acolhidas de ${post} não renderizado`);
    await act(async () => convite.click());
    await settleMuito();
  };

  const digitar = async (campo: HTMLTextAreaElement | null, texto: string) => {
    if (!campo) throw new Error("campo de texto não renderizado");
    await act(async () => {
      const valor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
      valor?.call(campo, texto);
      campo.dispatchEvent(new Event("input", { bubbles: true }));
    });
  };

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.search.mockReturnValue({});
    mocks.feed.mockResolvedValue({ items: [desabafo("p-1"), desabafo("p-2")], nextCursor: null });
    mocks.comments.mockResolvedValue({ items: [acolhida] });
    mocks.publish.mockResolvedValue(desabafo("p-3"));
    mocks.comment.mockResolvedValue(acolhida);
    mocks.react.mockResolvedValue({ SUPPORT: 1 });
    mocks.removePost.mockResolvedValue({ removed: true });
    mocks.removeComment.mockResolvedValue({ removed: true });
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

  it("a linha do tempo carrega e o compositor espera o texto", async () => {
    await render();

    expect(document.body.textContent).toContain(texts.desabafos.title);
    expect(document.body.textContent).toContain(texts.desabafos.subtitle);
    expect(document.body.textContent).toContain("Desabafo p-1");
    expect(document.body.textContent).toContain("Desabafo p-2");
    expect(mocks.feed).toHaveBeenCalledWith(null);

    // Sem texto, publicar fica travado: desabafo é o texto.
    expect(botoes(ds.publicar)[0]?.disabled).toBe(true);
  });

  it("publicar manda o texto, avisa e recarrega a linha do tempo", async () => {
    await render();

    const campo = document.body.querySelector<HTMLTextAreaElement>("textarea");
    await digitar(campo, "hoje foi difícil");

    const publicar = botoes(ds.publicar)[0];
    expect(publicar?.disabled).toBe(false);
    await act(async () => publicar?.click());
    await settleMuito();

    expect(mocks.publish).toHaveBeenCalledWith({ content: "hoje foi difícil" });
    expect(mocks.toast).toHaveBeenCalledWith(texts.desabafos.publishSuccess, "success");
    expect(mocks.feed.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(campo?.value).toBe("");
  });

  it("a recusa do servidor mantém o rascunho de pé e avisa o porquê", async () => {
    mocks.publish.mockRejectedValue(Object.assign(new Error("recusado"), { code: "RATE_LIMITED" }));
    await render();

    const campo = document.body.querySelector<HTMLTextAreaElement>("textarea");
    await digitar(campo, "hoje foi difícil");
    await act(async () => botoes(ds.publicar)[0]?.click());
    await settleMuito();

    expect(mocks.toast).toHaveBeenCalledWith(texts.desabafos.rateLimitError, "error");
    expect(campo?.value).toBe("hoje foi difícil");
    expect(botoes(ds.publicar)[0]?.disabled).toBe(false);
  });

  it("o deep link do aviso abre as acolhidas do desabafo apontado", async () => {
    mocks.search.mockReturnValue({ post: "p-2" });
    await render();

    expect(mocks.comments).toHaveBeenCalledWith("p-2");
    expect(document.body.textContent).toContain("Estou aqui com você");
  });

  it("apoiar cria e tira a reação, uma por pessoa", async () => {
    mocks.feed
      .mockResolvedValueOnce({
        items: [desabafo("p-1", { reactions: 1, reactionSummary: { SUPPORT: 1 } })],
        nextCursor: null,
      })
      // Depois de apoiar, a invalidação busca de novo: o apoio agora é meu.
      .mockResolvedValue({
        items: [
          desabafo("p-1", { reactions: 1, reactionSummary: { SUPPORT: 1 }, myReaction: "SUPPORT" }),
        ],
        nextCursor: null,
      });
    await render();

    const pilula = botoes("💪1")[0];
    if (!pilula) throw new Error("pílula de apoio não renderizada");
    await act(async () => pilula.click());
    await settleMuito();
    expect(mocks.react).toHaveBeenCalledWith("p-1", "SUPPORT");

    // A pílula, agora minha: clicar de novo tira o apoio.
    const pilulaMinha = botoes("💪1")[0];
    if (!pilulaMinha) throw new Error("pílula de apoio sumiu");
    await act(async () => pilulaMinha.click());
    await settleMuito();
    expect(mocks.unreact).toHaveBeenCalledWith("p-1");
  });

  it("acolher manda a acolhida e a contagem se refetcha", async () => {
    await render();
    await abrirAcolhidas("p-1");

    expect(document.body.textContent).toContain("Estou aqui com você");

    const caixa = document.body.querySelector<HTMLTextAreaElement>(
      `textarea[placeholder="${ds.caixaDeAcolhida}"]`,
    );
    await digitar(caixa, "Você não está sozinho.");
    const acolher = botoes(ds.acolher)[0];
    if (!acolher) throw new Error("botão de acolher não renderizado");
    await act(async () => acolher.click());
    await settleMuito();

    expect(mocks.comment).toHaveBeenCalledWith(
      "p-1",
      expect.objectContaining({ content: "Você não está sozinho." }),
    );
    expect(mocks.toast).toHaveBeenCalledWith(texts.desabafos.commentSuccess, "success");
  });

  it("a autoria remove o próprio desabafo", async () => {
    mocks.feed.mockResolvedValue({
      items: [desabafo("p-1", { author: autoria("me") })],
      nextCursor: null,
    });
    await render();

    const remover = botaoPorRotulo(ds.removerDesabafo);
    if (!remover) throw new Error("botão de remover não renderizado (não é a autoria?)");
    await act(async () => remover.click());
    await settleMuito();

    expect(mocks.removePost).toHaveBeenCalledWith("p-1");
    expect(mocks.toast).toHaveBeenCalledWith(texts.desabafos.removeDone, "success");
  });

  it("quem escreveu a acolhida remove a própria", async () => {
    // A acolhida na tela é MINHA (autoria "me"): o gesto de remover aparece só para quem escreveu.
    mocks.comments.mockResolvedValue({ items: [{ ...acolhida, author: autoria("me") }] });
    await render();
    await abrirAcolhidas("p-1");

    const remover = botaoPorRotulo(ds.removerAcolhida);
    if (!remover) throw new Error("botão de remover acolhida não renderizado");
    await act(async () => remover.click());
    await settleMuito();

    expect(mocks.removeComment).toHaveBeenCalledWith("p-1", "c-1");
    expect(mocks.toast).toHaveBeenCalledWith(texts.desabafos.removeCommentDone, "success");
  });

  it("a linha do tempo pagina pelo cursor quando há mais", async () => {
    mocks.feed
      .mockResolvedValueOnce({ items: [desabafo("p-1")], nextCursor: "cur-1" })
      .mockResolvedValue({ items: [desabafo("p-2")], nextCursor: null });
    await render();

    const verMais = botoes(ds.verMais)[0];
    if (!verMais) throw new Error("botão de carregar mais não renderizado");
    await act(async () => verMais.click());
    await settleMuito();

    expect(mocks.feed).toHaveBeenCalledWith("cur-1");
    expect(document.body.textContent).toContain("Desabafo p-2");
  });

  it("denunciar abre o diálogo com o alvo do desabafo (mecanismo de sempre)", async () => {
    await render();

    const denunciar = botaoPorRotulo(ds.denunciar);
    if (!denunciar) throw new Error("botão de denunciar não renderizado");
    await act(async () => denunciar.click());
    await settleMuito();

    const dialogo = document.body.querySelector<HTMLElement>('[data-testid="denuncia"]');
    expect(dialogo?.getAttribute("data-alvo")).toBe("DESABAFO_POST:p-1");
  });
});
