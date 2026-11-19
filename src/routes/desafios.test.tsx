// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { DesafioParticipacaoView } from "@/types/application/desafios/desafio-participacao-view";
import type { DesafioView } from "@/types/application/desafios/desafio-view";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A rota dos Desafios: o app traduz dados para as views do design system, e este teste prende
 * exatamente essa tradução — a linha do tempo carrega, o deep link do aviso abre o mural,
 * participar manda o texto, a torcida alterna, quem convocou remove e encerra reconhecendo,
 * e a denúncia sai com o alvo certo. As frases do desenho vêm do DS (mensagens padrão
 * `desafios*`); as de avisos, de `texts.desafios`.
 */

const mocks = vi.hoisted(() => ({
  search: vi.fn<() => Record<string, unknown>>(() => ({})),
  navigate: vi.fn(),
  feed: vi.fn(),
  participacoes: vi.fn(),
  publish: vi.fn(),
  close: vi.fn(),
  remove: vi.fn(),
  participate: vi.fn(),
  removeParticipacao: vi.fn(),
  cheer: vi.fn(),
  uncheer: vi.fn(),
  toast: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    options,
    useSearch: () => mocks.search(),
    useNavigate: () => mocks.navigate,
  }),
  useNavigate: () => mocks.navigate,
}));
vi.mock("@/lib/api", () => ({
  desafiosApi: {
    feed: mocks.feed,
    participacoes: mocks.participacoes,
    publish: mocks.publish,
    close: mocks.close,
    remove: mocks.remove,
    participate: mocks.participate,
    removeParticipacao: mocks.removeParticipacao,
    cheer: mocks.cheer,
    uncheer: mocks.uncheer,
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

const { Route } = await import("./desafios");
const options = (Route as unknown as { options: Record<string, unknown> }).options;
const DesafiosPage = (options as { component: () => React.JSX.Element }).component;

const autora = {
  id: "u-1",
  name: "Autora",
  username: "autora",
  avatar: null,
  avatarFrame: null,
  nameStyle: null,
};

const desafio = (id: string, extra: Partial<DesafioView> = {}): DesafioView => ({
  id,
  title: `Desafio ${id}`,
  description: `Convite do desafio ${id}`,
  author: autora,
  createdAt: "2026-11-01T12:00:00Z",
  endsAt: null,
  status: "ACTIVE",
  destaqueId: null,
  participacoes: 1,
  mine: false,
  ...extra,
});

const participacao = (id: string, extra: Partial<DesafioParticipacaoView> = {}) => ({
  id,
  desafioId: "d-1",
  author: autora,
  content: `Participação ${id}`,
  createdAt: "2026-11-01T13:00:00Z",
  cheers: 0,
  cheered: false,
  mine: false,
  ...extra,
});

// Frases do desenho que vivem no design system (mensagens padrão desafios*).
const ds = {
  convocar: "Convocar",
  tituloAria: "Título do desafio",
  descricaoAria: "Descrição do desafio",
  removerDesafio: "Remover desafio",
  denunciarDesafio: "Denunciar desafio",
  caixaDeParticipacao: "Escreva sua participação…",
  participar: "Participar",
  torcer: "Torcer",
  escolherDestaque: "Reconhecer e encerrar com essa",
  encerrar: "Encerrar desafio",
};

describe("rota dos Desafios", () => {
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
          <DesafiosPage />
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

  const botaoPorTitulo = (titulo: string) =>
    document.body.querySelector<HTMLButtonElement>(`button[title="${titulo}"]`);

  const digitar = async (campo: HTMLInputElement | HTMLTextAreaElement | null, texto: string) => {
    if (!campo) throw new Error("campo de texto não renderizado");
    await act(async () => {
      const prototipo =
        campo instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype;
      const valor = Object.getOwnPropertyDescriptor(prototipo, "value")?.set;
      valor?.call(campo, texto);
      campo.dispatchEvent(new Event("input", { bubbles: true }));
    });
  };

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.search.mockReturnValue({});
    mocks.navigate.mockResolvedValue(undefined);
    mocks.feed.mockResolvedValue({ items: [desafio("d-1")], nextCursor: null });
    mocks.participacoes.mockResolvedValue({
      items: [participacao("pa-1", { cheers: 2 })],
    });
    mocks.publish.mockResolvedValue(desafio("d-2"));
    mocks.participate.mockResolvedValue(participacao("pa-2"));
    mocks.cheer.mockResolvedValue(participacao("pa-1", { cheers: 3, cheered: true }));
    mocks.uncheer.mockResolvedValue({ removed: true });
    mocks.remove.mockResolvedValue({ removed: true });
    mocks.close.mockResolvedValue(desafio("d-1", { status: "CLOSED" }));
    mocks.removeParticipacao.mockResolvedValue({ removed: true });
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

  it("a linha do tempo carrega com autoria nominal e o compositor exige o convite", async () => {
    await render();

    expect(document.body.textContent).toContain(texts.desafios.title);
    expect(document.body.textContent).toContain(texts.desafios.subtitle);
    expect(document.body.textContent).toContain("Desafio d-1");
    // NOMINAL: o convite assina — nome, @ e avatar de quem convocou na tela.
    expect(document.body.textContent).toContain("@autora");
    expect(mocks.feed).toHaveBeenCalledWith(null);

    // Sem título, convocar fica travado: o desafio é o convite.
    expect(botoes(ds.convocar)[0]?.disabled).toBe(true);
  });

  it("convocar manda o convite, avisa e recarrega a linha do tempo", async () => {
    await render();

    const titulo = document.body.querySelector<HTMLInputElement>(
      `input[aria-label="${ds.tituloAria}"]`,
    );
    const descricao = document.body.querySelector<HTMLTextAreaElement>(
      `textarea[aria-label="${ds.descricaoAria}"]`,
    );
    await digitar(titulo, "Desenhar a mascote");
    await digitar(descricao, "Quem quiser, desenha e cola aqui.");

    const convocar = botoes(ds.convocar)[0];
    expect(convocar?.disabled).toBe(false);
    await act(async () => convocar?.click());
    await settleMuito();

    expect(mocks.publish).toHaveBeenCalledWith({
      title: "Desenhar a mascote",
      description: "Quem quiser, desenha e cola aqui.",
    });
    expect(mocks.toast).toHaveBeenCalledWith(texts.desafios.publishSuccess, "success");
    expect(mocks.feed.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("a recusa do servidor avisa o porquê do limite", async () => {
    mocks.publish.mockRejectedValue(Object.assign(new Error("recusado"), { code: "RATE_LIMITED" }));
    await render();

    const titulo = document.body.querySelector<HTMLInputElement>(
      `input[aria-label="${ds.tituloAria}"]`,
    );
    const descricao = document.body.querySelector<HTMLTextAreaElement>(
      `textarea[aria-label="${ds.descricaoAria}"]`,
    );
    await digitar(titulo, "Desenhar a mascote");
    await digitar(descricao, "Convite.");
    await act(async () => botoes(ds.convocar)[0]?.click());
    await settleMuito();

    expect(mocks.toast).toHaveBeenCalledWith(texts.desafios.rateLimitError, "error");
  });

  it("o deep link do aviso abre o mural do desafio apontado", async () => {
    mocks.search.mockReturnValue({ desafio: "d-1" });
    await render();

    expect(mocks.participacoes).toHaveBeenCalledWith("d-1");
    expect(document.body.textContent).toContain("Participação pa-1");
    // A torcida é contada, nunca nominada: pílula com número, sem lista de quem torceu.
    expect(document.body.querySelector(`button[aria-label="${ds.torcer}"]`)).toBeTruthy();
  });

  it("participar manda o texto e refetcha o mural", async () => {
    mocks.search.mockReturnValue({ desafio: "d-1" });
    await render();

    const caixa = document.body.querySelector<HTMLTextAreaElement>(
      `textarea[placeholder="${ds.caixaDeParticipacao}"]`,
    );
    await digitar(caixa, "Eu desenhei!");
    const enviar = botoes(ds.participar)[0];
    if (!enviar) throw new Error("botão de participar não renderizado");
    await act(async () => enviar.click());
    await settleMuito();

    expect(mocks.participate).toHaveBeenCalledWith(
      "d-1",
      expect.objectContaining({ content: "Eu desenhei!" }),
    );
    expect(mocks.toast).toHaveBeenCalledWith(texts.desafios.participateSuccess, "success");
    expect(mocks.participacoes.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("a torcida alterna com um clique", async () => {
    mocks.search.mockReturnValue({ desafio: "d-1" });
    await render();

    const torcer = document.body.querySelector<HTMLButtonElement>(
      `button[aria-label="${ds.torcer}"]`,
    );
    if (!torcer) throw new Error("pílula de torcida não renderizada");
    await act(async () => torcer.click());
    await settleMuito();

    expect(mocks.cheer).toHaveBeenCalledWith("pa-1");
  });

  it("a marca mine do servidor libera remover o próprio desafio", async () => {
    mocks.feed.mockResolvedValue({ items: [desafio("d-1", { mine: true })], nextCursor: null });
    await render();

    const remover = botaoPorRotulo(ds.removerDesafio);
    if (!remover) throw new Error("botão de remover não renderizado (não é o próprio?)");
    await act(async () => remover.click());
    await settleMuito();

    expect(mocks.remove).toHaveBeenCalledWith("d-1");
    expect(mocks.toast).toHaveBeenCalledWith(texts.desafios.removeDone, "success");
  });

  it("quem não convocou denuncia o desafio com o alvo certo", async () => {
    await render();

    const denunciar = botaoPorRotulo(ds.denunciarDesafio);
    if (!denunciar) throw new Error("botão de denunciar não renderizado");
    await act(async () => denunciar.click());
    await settleMuito();

    const denuncia = document.body.querySelector('[data-testid="denuncia"]');
    expect(denuncia?.getAttribute("data-alvo")).toBe("DESAFIO_POST:d-1");
  });

  it("quem convocou encerra reconhecendo uma participação", async () => {
    mocks.search.mockReturnValue({ desafio: "d-1" });
    mocks.feed.mockResolvedValue({ items: [desafio("d-1", { mine: true })], nextCursor: null });
    await render();

    const escolher = botaoPorTitulo(ds.escolherDestaque);
    if (!escolher) throw new Error("gesto de reconhecimento não renderizado (não é o próprio?)");
    await act(async () => escolher.click());
    await settleMuito();

    const encerrar = botoes(ds.encerrar)[0];
    if (!encerrar) throw new Error("botão de encerrar não renderizado");
    await act(async () => encerrar.click());
    await settleMuito();

    expect(mocks.close).toHaveBeenCalledWith("d-1", "pa-1");
    expect(mocks.toast).toHaveBeenCalledWith(texts.desafios.closeDone, "success");
  });

  it("remover a própria participação manda o id certo", async () => {
    mocks.search.mockReturnValue({ desafio: "d-1" });
    mocks.participacoes.mockResolvedValue({
      items: [participacao("pa-1", { mine: true })],
    });
    await render();

    const remover = document.body.querySelector<HTMLButtonElement>(
      `button[aria-label="${ds.removerDesafio.replace("desafio", "minha participação")}"]`,
    );
    if (!remover) throw new Error("botão de remover participação não renderizado");
    await act(async () => remover.click());
    await settleMuito();

    expect(mocks.removeParticipacao).toHaveBeenCalledWith("d-1", "pa-1");
    expect(mocks.toast).toHaveBeenCalledWith(texts.desafios.removeParticipacaoDone, "success");
  });
});
