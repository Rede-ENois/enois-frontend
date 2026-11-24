// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { ColecaoResumo } from "@/types/application/colecoes/colecao-resumo";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A rota das Coleções (lista): o app traduz dados para as views do design system e este teste
 * prende essa tradução — a lista carrega, criar uma coleção chama a API com título e descrição
 * e navega para a pasta, e a recusa do servidor vira aviso. As frases do desenho vêm do DS
 * (`colecoes*`, mensagens padrão); as de avisos, de `texts.colecoes`.
 */

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  navigate: vi.fn(),
  toast: vi.fn(),
  detalheAberto: vi.fn(() => false),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    options,
  }),
  useNavigate: () => mocks.navigate,
  // O roteador pergunta se o caminho é exatamente a listagem; em teste a resposta vem de fora.
  useMatchRoute: () => (opts: { to: string }) => (mocks.detalheAberto() ? false : opts),
  Outlet: () => <div data-testid="rota-filha" />,
}));
vi.mock("@/lib/api", () => ({
  colecoesApi: {
    list: mocks.list,
    get: mocks.get,
    create: mocks.create,
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

const { Route } = await import("./colecoes");
const options = (Route as unknown as { options: Record<string, unknown> }).options;
const ColecoesPage = (options as { component: () => React.JSX.Element }).component;
/** A listagem é mãe do detalhe: com o filho aberto, o `Outlet` é quem desenha. */
const Pagina = () => (mocks.detalheAberto() ? <div data-testid="rota-filha" /> : <ColecoesPage />);

// Frases do desenho que vivem no design system (mensagens padrão colecoes*).
const ds = {
  buscar: "Buscar pelo título ou pela descrição",
  semResultado: (termo: string) => `Nenhuma coleção com o termo "${termo}".`,
  criarTitulo: "Criar coleção",
  salvar: "Salvar",
  abrirColecao: "Abrir coleção",
  contagem: (n: number) => `${n} posts`,
};

const colecao = (id: string, extra: Partial<ColecaoResumo> = {}): ColecaoResumo => ({
  id,
  title: `Coleção ${id}`,
  description: `Descrição do ${id}`,
  postCount: 2,
  createdAt: "2026-11-01T12:00:00Z",
  ...extra,
});

describe("rota das Coleções (lista)", () => {
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
          <Pagina />
        </QueryClientProvider>,
      );
    });
    await settleMuito();
  };

  const botoes = (texto: string) =>
    [...document.body.querySelectorAll("button")].filter(
      (botao) => botao.textContent?.trim() === texto,
    );

  const digitar = async (campo: HTMLInputElement | HTMLTextAreaElement, texto: string) => {
    await act(async () => {
      const proto =
        campo instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(campo, texto);
      campo.dispatchEvent(new Event("input", { bubbles: true }));
    });
  };

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.detalheAberto.mockReturnValue(false);
    mocks.list.mockResolvedValue({ items: [colecao("c-1"), colecao("c-2")], nextCursor: null });
    mocks.create.mockResolvedValue(colecao("c-novo"));
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

  it("a lista carrega os cartões com título, descrição e contagem", async () => {
    await render();

    expect(document.body.textContent).toContain("Coleção c-1");
    expect(document.body.textContent).toContain("Descrição do c-1");
    expect(document.body.textContent).toContain(ds.contagem(2));
    expect(mocks.list).toHaveBeenCalledWith(null, undefined);
  });

  it("com a coleção aberta pelo endereço, a listagem sai da frente e a coleção desenha", async () => {
    mocks.detalheAberto.mockReturnValue(true);
    await render();

    expect(document.body.querySelector("[data-testid='rota-filha']")).not.toBeNull();
    expect(mocks.list).not.toHaveBeenCalled();
  });

  it("sem nenhuma coleção, o vazio do DS fala", async () => {
    mocks.list.mockResolvedValue({ items: [], nextCursor: null });
    await render();

    expect(document.body.textContent).toContain("Nenhuma coleção ainda");
  });

  it("a busca só vai ao servidor depois da pausa, e o termo aparado filtra", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      await render();
      expect(mocks.list).toHaveBeenCalledWith(null, undefined);

      const campo = document.body.querySelector<HTMLInputElement>("input[type='search']")!;
      expect(campo.placeholder).toBe(ds.buscar);
      await digitar(campo, "  receitas ");
      await settle();
      expect(mocks.list).toHaveBeenCalledTimes(1);

      mocks.list.mockResolvedValue({ items: [], nextCursor: null });
      await act(async () => {
        vi.advanceTimersByTime(300);
      });
      await settleMuito();

      expect(mocks.list).toHaveBeenLastCalledWith(null, "receitas");
    } finally {
      vi.useRealTimers();
    }
  });

  it("busca sem resultado diz o termo, não o vazio geral", async () => {
    await render();
    mocks.list.mockResolvedValue({ items: [], nextCursor: null });

    const campo = document.body.querySelector<HTMLInputElement>("input[type='search']")!;
    await digitar(campo, "vôlei");
    await act(() => new Promise<void>((done) => setTimeout(done, 350)));
    await settleMuito();

    expect(document.body.textContent).toContain(ds.semResultado("vôlei"));
    expect(document.body.textContent).not.toContain("Nenhuma coleção ainda");
  });

  it("abrir um cartão navega para a página da coleção", async () => {
    await render();

    const cartao = document.body.querySelector<HTMLButtonElement>(
      `button[aria-label="${ds.abrirColecao}"]`,
    );
    await act(async () => cartao!.click());
    await settleMuito();
    expect(mocks.navigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: "/colecoes/$colecaoId", params: { colecaoId: "c-1" } }),
    );
  });

  it("criar coleção salva título e descrição, avisa e navega para a pasta", async () => {
    await render();

    await act(async () => botoes(texts.colecoes.criar)[0].click());
    await settleMuito();

    const dialogo = document.body.querySelector("[role='dialog']")!;
    expect(dialogo.textContent).toContain(ds.criarTitulo);

    const titulo = dialogo.querySelector<HTMLInputElement>("#colecao-titulo")!;
    const descricao = dialogo.querySelector<HTMLTextAreaElement>("#colecao-descricao")!;
    await digitar(titulo, "Leituras de domingo");
    await digitar(descricao, "Textos longos para reler");
    await act(async () => botoes(ds.salvar)[0].click());
    await settleMuito();

    expect(mocks.create).toHaveBeenCalledWith({
      title: "Leituras de domingo",
      description: "Textos longos para reler",
    });
    expect(mocks.toast).toHaveBeenCalledWith(texts.colecoes.criado, "success");
    expect(mocks.navigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: "/colecoes/$colecaoId", params: { colecaoId: "c-novo" } }),
    );
  });

  it("a recusa do servidor vira aviso, sem derrubar a página", async () => {
    mocks.create.mockRejectedValue({ code: "COLECAO_TITLE_TOO_LONG" });
    await render();

    await act(async () => botoes(texts.colecoes.criar)[0].click());
    await settleMuito();
    const titulo = document.body.querySelector<HTMLInputElement>("#colecao-titulo")!;
    await digitar(titulo, "qualquer título");
    await act(async () => botoes(ds.salvar)[0].click());
    await settleMuito();

    expect(mocks.toast).toHaveBeenCalledWith(texts.colecoes.titleTooLongError, "error");
    expect(document.body.textContent).toContain("Coleção c-1");
  });
});
