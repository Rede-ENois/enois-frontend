// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { MuralResumo } from "@/types/application/murais/mural-resumo";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A rota dos Murais (lista): o app traduz dados para as views do design system e este teste
 * prende essa tradução — a lista carrega, criar um mural chama a API com título e descrição e
 * navega para o quadro, e a recusa do servidor vira aviso. As frases do desenho vêm do DS
 * (`murais*`, mensagens padrão); as de avisos, de `texts.murais`.
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
  muraisApi: {
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

const { Route } = await import("./murais");
const options = (Route as unknown as { options: Record<string, unknown> }).options;
const MuraisPage = (options as { component: () => React.JSX.Element }).component;
/** A listagem é mãe do detalhe: com o filho aberto, o `Outlet` é quem desenha. */
const Pagina = () => (mocks.detalheAberto() ? <div data-testid="rota-filha" /> : <MuraisPage />);

// Frases do desenho que vivem no design system (mensagens padrão murais*).
const ds = {
  criarTitulo: "Criar mural",
  tituloLabel: "Título",
  tituloPlaceholder: "Como esse mural se chama?",
  descricaoPlaceholder: "Que publicações moram aqui?",
  salvar: "Salvar",
  abrirMural: "Abrir mural",
  contagem: (n: number) => `${n} publicações`,
};

const mural = (id: string, extra: Partial<MuralResumo> = {}): MuralResumo => ({
  id,
  title: `Mural ${id}`,
  description: `Descrição do ${id}`,
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

describe("rota dos Murais (lista)", () => {
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
    mocks.list.mockResolvedValue({ items: [mural("m-1"), mural("m-2")], nextCursor: null });
    mocks.create.mockResolvedValue(mural("m-novo"));
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

  it("a lista carrega os cartões com título, dono e contagem", async () => {
    await render();

    expect(document.body.textContent).toContain("Mural m-1");
    expect(document.body.textContent).toContain("Dona");
    expect(document.body.textContent).toContain(ds.contagem(2));
    expect(mocks.list).toHaveBeenCalledWith(null);
  });

  it("com o mural aberto pelo endereço, a listagem sai da frente e o quadro desenha", async () => {
    mocks.detalheAberto.mockReturnValue(true);
    await render();

    expect(document.body.querySelector("[data-testid='rota-filha']")).not.toBeNull();
    expect(document.body.textContent).not.toContain("Mural m-1");
  });

  it("sem nenhum mural, o vazio do DS fala", async () => {
    mocks.list.mockResolvedValue({ items: [], nextCursor: null });
    await render();

    expect(document.body.textContent).toContain("Nenhum mural por aqui ainda");
  });

  it("abrir um cartão navega para a página do mural", async () => {
    await render();

    const cartao = document.body.querySelector<HTMLButtonElement>(
      `button[aria-label="${ds.abrirMural}"]`,
    );
    await act(async () => cartao!.click());
    await settleMuito();
    expect(mocks.navigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: "/murais/$muralId", params: { muralId: "m-1" } }),
    );
  });

  it("criar mural salva título e descrição, avisa e navega para o quadro", async () => {
    await render();

    await act(async () => botoes(texts.murais.criar)[0].click());
    await settleMuito();

    const dialogo = document.body.querySelector("[role='dialog']")!;
    expect(dialogo.textContent).toContain(ds.criarTitulo);

    const titulo = dialogo.querySelector<HTMLInputElement>("#mural-titulo")!;
    const descricao = dialogo.querySelector<HTMLTextAreaElement>("#mural-descricao")!;
    await digitar(titulo, "Fotos da feira");
    await digitar(descricao, "O que a feira tem de bonito");
    await act(async () => botoes(ds.salvar)[0].click());
    await settleMuito();

    expect(mocks.create).toHaveBeenCalledWith({
      title: "Fotos da feira",
      description: "O que a feira tem de bonito",
    });
    expect(mocks.toast).toHaveBeenCalledWith(texts.murais.criado, "success");
    expect(mocks.navigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: "/murais/$muralId", params: { muralId: "m-novo" } }),
    );
  });

  it("a recusa do servidor vira aviso, sem derrubar a página", async () => {
    mocks.create.mockRejectedValue({ code: "MURAL_TITLE_TOO_LONG" });
    await render();

    await act(async () => botoes(texts.murais.criar)[0].click());
    await settleMuito();
    const titulo = document.body.querySelector<HTMLInputElement>("#mural-titulo")!;
    await digitar(titulo, "qualquer título");
    await act(async () => botoes(ds.salvar)[0].click());
    await settleMuito();

    expect(mocks.toast).toHaveBeenCalledWith(texts.murais.titleTooLongError, "error");
    expect(document.body.textContent).toContain("Mural m-1");
  });
});
