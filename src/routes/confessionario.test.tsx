// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { ConfissaoPostView } from "@/types/application/confessionario/confissao-post-view";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A rota do Confessionário: o app só traduz dados para as views do design system, e este teste
 * prende exatamente essa tradução — a linha do tempo carrega, o deep link do aviso abre os
 * comentários, reagir alterna com uma reação por pessoa, comentar manda o texto, publicar sai
 * do compositor e a recusa do servidor mantém o rascunho para corrigir. As frases do desenho
 * vêm do DS (`@rede-enois/design-system`, mensagens padrão `confessionario*`); as de avisos,
 * de `texts.confessionario`.
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
  confessionarioApi: {
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

const { Route } = await import("./confessionario");
const options = (Route as unknown as { options: Record<string, unknown> }).options;
const ConfessionarioPage = (options as { component: () => React.JSX.Element }).component;

const confissao = (id: string, extra: Partial<ConfissaoPostView> = {}): ConfissaoPostView => ({
  id,
  content: `História ${id}`,
  createdAt: "2026-11-01T12:00:00Z",
  reactions: 0,
  reactionSummary: {},
  myReaction: null,
  comments: 0,
  mine: false,
  ...extra,
});

const comentario = {
  id: "c-1",
  postId: "p-1",
  content: "Já passei por isso também",
  createdAt: "2026-11-01T13:00:00Z",
  mine: false,
};

// Frases do desenho que vivem no design system (mensagens padrão confessionario*).
const ds = {
  publicar: "Contar",
  comentar: "Comentar",
  caixaDeComentario: "Comente sem se identificar…",
  removerHistoria: "Remover minha história",
  removerComentario: "Remover comentário",
  denunciar: "Denunciar história",
  verMais: "Ver mais histórias",
};

describe("rota do Confessionário", () => {
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
          <ConfessionarioPage />
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

  const abrirComentarios = async (post: string) => {
    const convite = [...document.body.querySelectorAll("button")].find(
      (botao) =>
        botao.textContent?.includes("comentário") && botao.getAttribute("aria-expanded") !== null,
    );
    if (!convite) throw new Error(`convite aos comentários de ${post} não renderizado`);
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
    mocks.feed.mockResolvedValue({
      items: [confissao("p-1"), confissao("p-2")],
      nextCursor: null,
    });
    mocks.comments.mockResolvedValue({ items: [comentario] });
    mocks.publish.mockResolvedValue(confissao("p-3"));
    mocks.comment.mockResolvedValue(comentario);
    mocks.react.mockResolvedValue({ LAUGH: 1 });
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

  it("a linha do tempo carrega e o compositor espera a história", async () => {
    await render();

    expect(document.body.textContent).toContain(texts.confessionario.title);
    expect(document.body.textContent).toContain(texts.confessionario.subtitle);
    expect(document.body.textContent).toContain("História p-1");
    expect(document.body.textContent).toContain("História p-2");
    // ANONIMATO: nada de nome, @ ou avatar de quem contou — só o rótulo do desenho.
    expect(document.body.textContent).toContain("Alguém");
    expect(document.body.textContent).not.toContain("Autora");
    expect(document.body.textContent).not.toContain("@autora");
    expect(mocks.feed).toHaveBeenCalledWith(null);

    // Sem texto, contar fica travado: história é o texto.
    expect(botoes(ds.publicar)[0]?.disabled).toBe(true);
  });

  it("publicar manda o texto, avisa e recarrega a linha do tempo", async () => {
    await render();

    const campo = document.body.querySelector<HTMLTextAreaElement>("textarea");
    await digitar(campo, "nunca contei isso, mas...");

    const publicar = botoes(ds.publicar)[0];
    expect(publicar?.disabled).toBe(false);
    await act(async () => publicar?.click());
    await settleMuito();

    expect(mocks.publish).toHaveBeenCalledWith({ content: "nunca contei isso, mas..." });
    expect(mocks.toast).toHaveBeenCalledWith(texts.confessionario.publishSuccess, "success");
    expect(mocks.feed.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(campo?.value).toBe("");
  });

  it("a recusa do servidor mantém o rascunho de pé e avisa o porquê", async () => {
    mocks.publish.mockRejectedValue(Object.assign(new Error("recusado"), { code: "RATE_LIMITED" }));
    await render();

    const campo = document.body.querySelector<HTMLTextAreaElement>("textarea");
    await digitar(campo, "ainda dá vergonha");
    await act(async () => botoes(ds.publicar)[0]?.click());
    await settleMuito();

    expect(mocks.toast).toHaveBeenCalledWith(texts.confessionario.rateLimitError, "error");
    expect(campo?.value).toBe("ainda dá vergonha");
    expect(botoes(ds.publicar)[0]?.disabled).toBe(false);
  });

  it("o deep link do aviso abre os comentários da história apontada", async () => {
    mocks.search.mockReturnValue({ post: "p-2" });
    await render();

    expect(mocks.comments).toHaveBeenCalledWith("p-2");
    expect(document.body.textContent).toContain("Já passei por isso também");
  });

  it("reagir cria e tira a reação, uma por pessoa", async () => {
    mocks.feed
      .mockResolvedValueOnce({
        items: [confissao("p-1", { reactions: 1, reactionSummary: { LAUGH: 1 } })],
        nextCursor: null,
      })
      // Depois de reagir, a invalidação busca de novo: a reação agora é minha.
      .mockResolvedValue({
        items: [
          confissao("p-1", { reactions: 1, reactionSummary: { LAUGH: 1 }, myReaction: "LAUGH" }),
        ],
        nextCursor: null,
      });
    await render();

    const pilula = botoes("😂1")[0];
    if (!pilula) throw new Error("pílula de risada não renderizada");
    await act(async () => pilula.click());
    await settleMuito();
    expect(mocks.react).toHaveBeenCalledWith("p-1", "LAUGH");

    // A pílula, agora minha: clicar de novo tira a reação.
    const pilulaMinha = botoes("😂1")[0];
    if (!pilulaMinha) throw new Error("pílula de risada sumiu");
    await act(async () => pilulaMinha.click());
    await settleMuito();
    expect(mocks.unreact).toHaveBeenCalledWith("p-1");
  });

  it("comentar manda o comentário e a contagem se refetcha", async () => {
    await render();
    await abrirComentarios("p-1");

    expect(document.body.textContent).toContain("Já passei por isso também");

    const caixa = document.body.querySelector<HTMLTextAreaElement>(
      `textarea[placeholder="${ds.caixaDeComentario}"]`,
    );
    await digitar(caixa, "Rindo junto daqui.");
    const comentar = botoes(ds.comentar)[0];
    if (!comentar) throw new Error("botão de comentar não renderizado");
    await act(async () => comentar.click());
    await settleMuito();

    expect(mocks.comment).toHaveBeenCalledWith(
      "p-1",
      expect.objectContaining({ content: "Rindo junto daqui." }),
    );
    expect(mocks.toast).toHaveBeenCalledWith(texts.confessionario.commentSuccess, "success");
  });

  it("a marca mine do servidor libera remover a própria história", async () => {
    mocks.feed.mockResolvedValue({
      items: [confissao("p-1", { mine: true })],
      nextCursor: null,
    });
    await render();

    const remover = botaoPorRotulo(ds.removerHistoria);
    if (!remover) throw new Error("botão de remover não renderizado (não é a própria?)");
    await act(async () => remover.click());
    await settleMuito();

    expect(mocks.removePost).toHaveBeenCalledWith("p-1");
    expect(mocks.toast).toHaveBeenCalledWith(texts.confessionario.removeDone, "success");
  });

  it("quem escreveu o comentário remove o próprio", async () => {
    // O comentário na tela é MEU (mine do servidor): o gesto aparece só para quem escreveu.
    mocks.comments.mockResolvedValue({ items: [{ ...comentario, mine: true }] });
    await render();
    await abrirComentarios("p-1");

    const remover = botaoPorRotulo(ds.removerComentario);
    if (!remover) throw new Error("botão de remover comentário não renderizado");
    await act(async () => remover.click());
    await settleMuito();

    expect(mocks.removeComment).toHaveBeenCalledWith("p-1", "c-1");
    expect(mocks.toast).toHaveBeenCalledWith(texts.confessionario.removeCommentDone, "success");
  });

  it("a linha do tempo pagina pelo cursor quando há mais", async () => {
    mocks.feed
      .mockResolvedValueOnce({ items: [confissao("p-1")], nextCursor: "cur-1" })
      .mockResolvedValue({ items: [confissao("p-2")], nextCursor: null });
    await render();

    const verMais = botoes(ds.verMais)[0];
    if (!verMais) throw new Error("botão de carregar mais não renderizado");
    await act(async () => verMais.click());
    await settleMuito();

    expect(mocks.feed).toHaveBeenCalledWith("cur-1");
    expect(document.body.textContent).toContain("História p-2");
  });

  it("denunciar abre o diálogo com o alvo da história (mecanismo de sempre)", async () => {
    await render();

    const denunciar = botaoPorRotulo(ds.denunciar);
    if (!denunciar) throw new Error("botão de denunciar não renderizado");
    await act(async () => denunciar.click());
    await settleMuito();

    const dialogo = document.body.querySelector<HTMLElement>('[data-testid="denuncia"]');
    expect(dialogo?.getAttribute("data-alvo")).toBe("CONFESSIONARIO_POST:p-1");
  });
});
