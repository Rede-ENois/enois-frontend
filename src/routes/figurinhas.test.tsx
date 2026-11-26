// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Catálogo de figurinhas da comunidade.
 *
 * O que a página tem de garantir: mostra só o que o servidor devolveu (ele já filtra as ativas),
 * leva o código ao texto sem inventar figurinha, oferece denúncia de qualquer uma e só deixa
 * remover a PRÓPRIA — a ação vem do autor da figurinha, não de quem está na tela.
 */

const mocks = vi.hoisted(() => ({
  pagina: vi.fn(),
  remover: vi.fn(),
  criado: vi.fn(),
  envioPermitido: vi.fn(),
  idAtual: { valor: "u1" as string | null },
}));

vi.mock("@/lib/figurinhas/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/figurinhas/api")>();
  return {
    ...actual,
    figurinhasApi: {
      ...actual.figurinhasApi,
      pagina: (page: number, limit: number, q?: string) => mocks.pagina(page, limit, q),
      remover: (id: string) => mocks.remover(id),
      envioPermitido: () => mocks.envioPermitido(),
    },
  };
});
vi.mock("@/lib/current-user", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/current-user")>()),
  getCurrentUserId: () => mocks.idAtual.valor,
}));
// A pista de sessão é função de servidor/cliente do router: no jsdom ela tenta ler o cookie do
// servidor. "Sem sessão" é o padrão dos testes; quem quer logado troca o `idAtual`.
vi.mock("@/lib/auth-hint", () => ({
  AUTH_HINT_COOKIE: "enois_auth",
  setAuthHint: () => {},
  clearAuthHint: () => {},
  syncAuthHint: () => {},
  readAuthHint: () => false,
}));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    options,
    useSearch: () => ({}),
  }),
  Link: (props: Record<string, unknown>) => <a {...props} />,
  useNavigate: () => () => undefined,
}));

const { Route } = await import("./figurinhas");
const Figurinhas = (Route as unknown as { options: { component: () => React.JSX.Element } }).options
  .component;

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const MINHA = {
  id: "fig_1",
  codigo: ":valeu:",
  origem: "COMUNIDADE",
  nome: "Valeu",
  autorId: "u1",
  imagem: "https://cdn.example/valeu.png",
  largura: 100,
  altura: 100,
  ativo: true,
  criadoEm: "2026-11-20T12:00:00Z",
  desativadoEm: null,
};

const DE_OUTRA = { ...MINHA, id: "fig_2", codigo: ":neymar:", nome: "Neymar", autorId: "u2" };

const AUTORES = {
  u1: { username: "mel", nome: "Mel", avatarUrl: "" },
  u2: { username: "zeca", nome: "Zeca", avatarUrl: "" },
};

const PAGINA = {
  items: [MINHA, DE_OUTRA],
  autores: AUTORES,
  page: 1,
  limit: 48,
  total: 2,
  totalPages: 1,
};

function renderPage() {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let root: Root | null = null;
  act(() => {
    root = createRoot(host);
    root.render(
      <QueryClientProvider client={client}>
        <Figurinhas />
      </QueryClientProvider>,
    );
  });
  return {
    host,
    // A página só fica pronta quando o catálogo saiu de "carregando": esperar um número fixo de
    // voltas deixa a resolução da promessa para o teste seguinte, que então recebe "Carregando".
    pronto: async ({ esperaMs = 0 } = {}) => {
      const motivo = () => host.textContent?.includes("Carregando figurinhas");
      for (let turn = 0; turn < 100; turn += 1) {
        if (!motivo()) return;
        await act(async () => {});
      }
      for (let turn = 0; turn < 100 && motivo(); turn += 1) {
        await act(async () => {
          await new Promise((resolve) => setTimeout(resolve, esperaMs));
        });
        if (esperaMs > 0) await act(async () => {});
      }
    },
    unmount: () => act(() => root?.unmount()),
  };
}

const botaoPorLabel = (host: HTMLElement, label: string) =>
  [...host.querySelectorAll("button")].find((b) => b.getAttribute("aria-label") === label);

describe("catálogo de figurinhas da comunidade", () => {
  beforeEach(() => {
    mocks.pagina.mockResolvedValue(PAGINA);
    mocks.remover.mockResolvedValue(undefined);
    mocks.envioPermitido.mockResolvedValue({
      pode: true,
      reputacao: 250,
      reputacaoMinima: 100,
      identidadeVerificada: true,
      motivo: null,
    });
    mocks.idAtual.valor = "u1";
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it("desenha os cartões com nome, código e quem enviou", async () => {
    const page = renderPage();
    await page.pronto();

    const texto = page.host.textContent ?? "";
    expect(texto).toContain("Valeu");
    expect(texto).toContain(":valeu:");
    expect(texto).toContain("Mel");
    expect(texto).toContain("Zeca");
    expect(texto).toContain("2 figurinhas");
    page.unmount();
  });

  it("deixa remover só a própria figurinha", async () => {
    const page = renderPage();
    await page.pronto();

    expect(botaoPorLabel(page.host, "Remover :valeu:")).toBeTruthy();
    expect(botaoPorLabel(page.host, "Remover :neymar:")).toBeUndefined();
    page.unmount();
  });

  it("remove a própria pelo botão", async () => {
    const page = renderPage();
    await page.pronto();

    act(() => botaoPorLabel(page.host, "Remover :valeu:")!.click());
    await act(async () => {});
    expect(mocks.remover).toHaveBeenCalledWith("fig_1");
    page.unmount();
  });

  it("toda figurinha pode ser denunciada", async () => {
    const page = renderPage();
    await page.pronto();

    expect(botaoPorLabel(page.host, "Denunciar :neymar:")).toBeTruthy();
    expect(botaoPorLabel(page.host, "Denunciar :valeu:")).toBeTruthy();
    page.unmount();
  });

  it("quem ainda não tem 100 de reputação vê o que falta no lugar do envio", async () => {
    mocks.envioPermitido.mockResolvedValue({
      pode: false,
      reputacao: 40,
      reputacaoMinima: 100,
      identidadeVerificada: true,
      motivo: "LOW_REPUTATION",
    });
    const page = renderPage();
    await page.pronto();

    expect(page.host.textContent).toContain("Você tem 40");
    expect(page.host.querySelector('input[type="file"]')).toBeNull();
    page.unmount();
  });

  it("sem identidade verificada, o envio pede a verificação", async () => {
    mocks.envioPermitido.mockResolvedValue({
      pode: false,
      reputacao: 0,
      reputacaoMinima: 100,
      identidadeVerificada: false,
      motivo: "IDENTITY_REQUIRED",
    });
    const page = renderPage();
    await page.pronto();

    expect(page.host.textContent).toContain("Verifique sua identidade");
    expect(page.host.querySelector('input[type="file"]')).toBeNull();
    page.unmount();
  });

  it("com os números certos, o envio aparece com o seletor", async () => {
    const page = renderPage();
    await page.pronto();

    expect(page.host.querySelector('input[type="file"]')).toBeTruthy();
    page.unmount();
  });

  it("sem conta, a tela pede login e nem chega a pedir o catálogo, que exige sessão", async () => {
    mocks.idAtual.valor = null;
    const page = renderPage();
    await page.pronto();

    expect(botaoPorLabel(page.host, "Remover :valeu:")).toBeUndefined();
    expect(page.host.textContent).toContain("Entre na sua conta para enviar figurinhas");
    expect(page.host.textContent).not.toContain("Não foi possível carregar as figurinhas");
    expect(page.host.textContent).not.toContain("Tentar de novo");
    expect(mocks.pagina).not.toHaveBeenCalled();
    expect(mocks.envioPermitido).not.toHaveBeenCalled();
    page.unmount();
  });

  it("busca vazia e erro pedem os textos certos", async () => {
    mocks.pagina.mockResolvedValue({ ...PAGINA, items: [], total: 0 });
    const vazio = renderPage();
    await vazio.pronto();
    expect(vazio.host.textContent).toContain("Nenhuma figurinha com essa busca.");
    vazio.unmount();

    // O `retry: 1` da consulta espera 1s de verdade entre as tentativas (o timer roda fora do
    // `act`), e o erro só aparece depois dela: a espera é do tanque, não do relógio falso.
    mocks.pagina.mockRejectedValue(new Error("500"));
    const erro = renderPage();
    await erro.pronto({ esperaMs: 1500 });
    expect(erro.host.textContent).toContain("Não foi possível carregar as figurinhas agora.");
    erro.unmount();
  });
});
