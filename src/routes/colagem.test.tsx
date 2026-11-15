// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { ColagemPostView } from "@/types/application/colagem/colagem-post-view";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A rota da Colagem: o app só traduz dados para as views do design system, e este teste prende
 * exatamente essa tradução — o mural carrega, o deep link do aviso abre a foto, reagir alterna
 * com uma reação por pessoa, contribuir manda o texto, publicar cola a foto subida e a recusa
 * do servidor mantém o rascunho para corrigir. As frases do desenho vêm do DS
 * (`@rede-enois/design-system`, mensagens padrão `colagem*`); as de avisos, de `texts.colagem`.
 */

const mocks = vi.hoisted(() => ({
  search: vi.fn<() => Record<string, unknown>>(() => ({})),
  feed: vi.fn(),
  post: vi.fn(),
  comments: vi.fn(),
  publish: vi.fn(),
  removePost: vi.fn(),
  comment: vi.fn(),
  removeComment: vi.fn(),
  react: vi.fn(),
  unreact: vi.fn(),
  upload: vi.fn(),
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
  REACTION_EMOJIS: { LIKE: "👍" },
  colagemApi: {
    feed: mocks.feed,
    post: mocks.post,
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
vi.mock("@/lib/use-media-upload", () => ({
  useMediaUpload: () => ({ upload: mocks.upload, status: "idle" }),
}));
vi.mock("@rede-enois/design-system/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@rede-enois/design-system/ui")>();
  return { ...actual, useToast: () => ({ toast: mocks.toast }) };
});
vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const { Route } = await import("./colagem");
const options = (Route as unknown as { options: Record<string, unknown> }).options;
const ColagemPage = (options as { component: () => React.JSX.Element }).component;

const autoria = (id: string) => ({
  id,
  name: "Autora",
  username: "autora",
  avatar: null,
  avatarFrame: null,
  style: null,
});

const foto = (id: string, extra: Partial<ColagemPostView> = {}): ColagemPostView => ({
  id,
  author: autoria("autora"),
  mediaId: `m-${id}`,
  mediaUrl: `https://cdn.test/${id}.jpg`,
  mimeType: "image/jpeg",
  width: 800,
  height: 600,
  description: `Foto ${id}`,
  mediaSpoiler: false,
  createdAt: "2026-11-01T12:00:00Z",
  reactions: 0,
  reactionSummary: {},
  myReaction: null,
  comments: 0,
  ...extra,
});

const comentario = {
  id: "c-1",
  author: autoria("outra"),
  content: "que luz boa",
  mediaId: null,
  mediaUrl: null,
  mediaSpoiler: false,
  parentCommentId: null,
  createdAt: "2026-11-01T13:00:00Z",
};

// Frases do desenho que vivem no design system (mensagens padrão colagem*).
const ds = {
  abrirFoto: "Abrir fotografia",
  legenda: "Legenda (opcional)",
  publicar: "Colar na Colagem",
  fotoDoDialogo: "Foto da Colagem",
  removerFoto: "Remover minha foto",
  caixaDeContribuicao: "Texto ou uma fotografia…",
  contribuir: "Contribuir",
};

describe("rota da Colagem", () => {
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
          <ColagemPage />
        </QueryClientProvider>,
      );
    });
    await settleMuito();
  };

  const botoes = (texto: string) =>
    [...document.body.querySelectorAll("button")].filter(
      (botao) => botao.textContent?.trim() === texto,
    );

  const abrirPrimeiraFoto = async () => {
    const azulejo = document.body.querySelector<HTMLButtonElement>(
      `button[aria-label="${ds.abrirFoto}"]`,
    );
    if (!azulejo) throw new Error("azulejo da foto não renderizado");
    await act(async () => azulejo.click());
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

  const escolherArquivo = async (input: HTMLInputElement, arquivo: File) => {
    await act(async () => {
      Object.defineProperty(input, "files", { value: [arquivo] });
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  };

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.search.mockReturnValue({});
    mocks.feed.mockResolvedValue({ items: [foto("p-1"), foto("p-2")], nextCursor: null });
    mocks.post.mockImplementation((id: string) => foto(id));
    mocks.comments.mockResolvedValue({ items: [comentario], nextCursor: null });
    mocks.publish.mockResolvedValue(foto("p-3"));
    mocks.comment.mockResolvedValue(comentario);
    mocks.react.mockResolvedValue({ LIKE: 1 });
    mocks.upload.mockResolvedValue({ mediaId: "m-novo", cdnUrl: "https://cdn.test/nova.jpg" });
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

  it("o mural carrega: as fotos ficam na grade e o compositor espera a escolha", async () => {
    await render();

    expect(document.body.textContent).toContain(texts.colagem.title);
    expect(document.body.textContent).toContain(texts.colagem.subtitle);
    expect(document.body.querySelectorAll(`button[aria-label="${ds.abrirFoto}"]`)).toHaveLength(2);
    expect(mocks.feed).toHaveBeenCalledWith(null);

    // Sem foto escolhida, publicar fica travado com o aviso do porquê.
    const publicar = botoes(ds.publicar)[0];
    expect(publicar?.disabled).toBe(true);
  });

  it("o deep link do aviso abre a foto apontada direto", async () => {
    mocks.search.mockReturnValue({ foto: "p-2" });
    await render();

    expect(document.body.textContent).toContain(ds.fotoDoDialogo);
    expect(document.body.textContent).toContain("Foto p-2");
    expect(mocks.post).toHaveBeenCalledWith("p-2");
    expect(mocks.comments).toHaveBeenCalledWith("p-2");
  });

  it("reagir na foto aberta cria e tira a reação, uma por pessoa", async () => {
    mocks.post
      .mockResolvedValueOnce(
        foto("p-1", { reactions: 1, reactionSummary: { LIKE: 1 }, myReaction: null }),
      )
      // Depois de reagir, a invalidação busca de novo: a reação agora é minha.
      .mockResolvedValue(
        foto("p-1", { reactions: 1, reactionSummary: { LIKE: 1 }, myReaction: "LIKE" }),
      );
    await render();
    await abrirPrimeiraFoto();

    // A pílula é emoji + contagem colados ("👍1"), botão com aria-pressed marcando a minha.
    const pilula = botoes("👍1")[0];
    if (!pilula) throw new Error("pílula de reação não renderizada");
    await act(async () => pilula.click());
    await settleMuito();
    expect(mocks.react).toHaveBeenCalledWith("p-1", "LIKE");

    // A mesma pílula, agora minha: clicar de novo tira a reação.
    const pilulaMinha = botoes("👍1")[0];
    if (!pilulaMinha) throw new Error("pílula de reação sumiu");
    await act(async () => pilulaMinha.click());
    await settleMuito();
    expect(mocks.unreact).toHaveBeenCalledWith("p-1");
  });

  it("contribuir com um texto manda o comentário e limpa a caixa", async () => {
    await render();
    await abrirPrimeiraFoto();

    expect(document.body.textContent).toContain("que luz boa");

    const caixa = document.body.querySelector<HTMLTextAreaElement>(
      `textarea[placeholder="${ds.caixaDeContribuicao}"]`,
    );
    await digitar(caixa, "Linda!");
    const contribuir = botoes(ds.contribuir)[0];
    if (!contribuir) throw new Error("botão de contribuir não renderizado");
    await act(async () => contribuir.click());
    await settleMuito();

    expect(mocks.comment).toHaveBeenCalledWith(
      "p-1",
      expect.objectContaining({ content: "Linda!" }),
    );
    expect(mocks.toast).toHaveBeenCalledWith(texts.colagem.commentSuccess, "success");
    expect(caixa?.value).toBe("");
  });

  it("publicar sobe a foto escolhida e cola com a legenda", async () => {
    await render();

    const input = host.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error("seletor de arquivo não renderizado");
    await escolherArquivo(input, new File(["foto"], "céu.jpg", { type: "image/jpeg" }));
    await settleMuito();
    expect(mocks.upload).toHaveBeenCalled();

    const legenda = host.querySelector<HTMLTextAreaElement>(`textarea[aria-label="${ds.legenda}"]`);
    await digitar(legenda, "olhar o céu");

    const publicar = botoes(ds.publicar)[0];
    expect(publicar?.disabled).toBe(false);
    await act(async () => publicar?.click());
    await settleMuito();

    expect(mocks.publish).toHaveBeenCalledWith(
      expect.objectContaining({ mediaId: "m-novo", description: "olhar o céu" }),
    );
    expect(mocks.toast).toHaveBeenCalledWith(texts.colagem.publishSuccess, "success");
    // O mural se refetcha: a foto nova entra na grade.
    expect(mocks.feed.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("a recusa do servidor mantém o rascunho de pé e avisa o porquê", async () => {
    mocks.publish.mockRejectedValue(Object.assign(new Error("recusada"), { code: "RATE_LIMITED" }));
    await render();

    const input = host.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error("seletor de arquivo não renderizado");
    await escolherArquivo(input, new File(["foto"], "céu.jpg", { type: "image/jpeg" }));
    await settleMuito();
    const legenda = host.querySelector<HTMLTextAreaElement>(`textarea[aria-label="${ds.legenda}"]`);
    await digitar(legenda, "olhar o céu");

    const publicar = botoes(ds.publicar)[0];
    await act(async () => publicar?.click());
    await settleMuito();

    expect(mocks.toast).toHaveBeenCalledWith(texts.colagem.rateLimitError, "error");
    // O DS segurou a promessa rejeitada: legenda e foto continuam no compositor.
    expect(legenda?.value).toBe("olhar o céu");
    expect(botoes(ds.publicar)[0]?.disabled).toBe(false);
  });

  it("a autoria remove a própria foto da Colagem", async () => {
    mocks.post.mockResolvedValue(foto("p-1", { author: autoria("me") }));
    mocks.removePost.mockResolvedValue({ removed: true });
    await render();
    await abrirPrimeiraFoto();

    const remover = botoes(ds.removerFoto)[0];
    if (!remover) throw new Error("botão de remover não renderizado (não é a autoria?)");
    await act(async () => remover.click());
    await settleMuito();

    // A confirmação chega com o mesmo rótulo: o último botão é o da confirmação.
    const confirmar = botoes(ds.removerFoto).at(-1);
    if (!confirmar) throw new Error("confirmação de remoção não renderizada");
    await act(async () => confirmar.click());
    await settleMuito();

    expect(mocks.removePost).toHaveBeenCalledWith("p-1");
    expect(mocks.toast).toHaveBeenCalledWith(texts.colagem.deletePhotoDone, "success");
    // A foto sai da tela junto: o diálogo fecha.
    expect(document.body.textContent).not.toContain(ds.fotoDoDialogo);
  });
});
