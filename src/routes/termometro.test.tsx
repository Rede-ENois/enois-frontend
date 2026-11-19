// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { TermometroJanelaView } from "@/types/application/termometro/termometro-janela-view";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A rota do Termômetro: o app só alimenta o painel do design system com o agregado do backend.
 * Este teste prende exatamente isso — o painel carrega as quatro janelas, a troca de período
 * não refaz requisição (as janelas já vêm juntas), o erro tem retry e nenhuma frase de pessoa
 * aparece: o backend não manda autor e a rota não inventa.
 */

const mocks = vi.hoisted(() => ({
  painel: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    options,
    useSearch: () => ({}),
  }),
}));
vi.mock("@/lib/api", () => ({
  termometroApi: { painel: mocks.painel },
}));
vi.mock("@/lib/require-auth", () => ({ requireAuth: () => undefined }));
// O invólucro da página busca dados de sessão do runtime do servidor; aqui ele só emoldura.
vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const { Route } = await import("./termometro");
const options = (Route as unknown as { options: Record<string, unknown> }).options;
const TermometroPage = (options as { component: () => React.JSX.Element }).component;

const emocao = (
  nome: TermometroJanelaView["emocoes"][number]["emocao"],
  porcentagem: number,
  contagem: number,
) => ({
  emocao: nome,
  porcentagem,
  contagem,
});

const janela = (
  periodo: TermometroJanelaView["periodo"],
  extra: Partial<TermometroJanelaView> = {},
): TermometroJanelaView => ({
  periodo,
  amostraSuficiente: true,
  manifestacoes: 40,
  participantes: 30,
  dominante: "ALEGRE",
  emocoes: [emocao("ALEGRE", 60, 24), emocao("CANSADA", 40, 16)],
  ...extra,
});

const painelCompleto = (): TermometroJanelaView[] => [
  janela("HOJE"),
  janela("ULTIMAS_24H"),
  janela("ULTIMOS_7D"),
  janela("ULTIMOS_30D", {
    manifestacoes: 120,
    participantes: 80,
    emocoes: [emocao("ALEGRE", 50, 60), emocao("CANSADA", 50, 60)],
  }),
];

// Frases do desenho que vivem no design system (mensagens padrão termometro*).
const ds = {
  loading: "Medindo o clima…",
  error: "Não foi possível abrir o Termômetro. Tente de novo.",
  retry: "Tentar de novo",
  periodoHoje: "Hoje",
  periodo7d: "7 dias",
  periodo30d: "30 dias",
  manifestacoes: (n: number) =>
    n === 1 ? "1 manifestação analisada" : `${n} manifestações analisadas`,
  amostraInsuficiente:
    "Ainda há gente de menos nesta janela para mostrar um indicador confiável. Tudo aqui é contado só quando o conjunto é grande o bastante.",
};

describe("rota do Termômetro", () => {
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
          <TermometroPage />
        </QueryClientProvider>,
      );
    });
    await settleMuito();
  };

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    mocks.painel.mockReset();
    mocks.painel.mockResolvedValue(painelCompleto());
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    host.remove();
    vi.unstubAllGlobals();
  });

  it("o painel carrega as janelas do servidor e abre no período escolhido", async () => {
    await render();

    expect(document.body.textContent).toContain(texts.termometro.title);
    expect(mocks.painel).toHaveBeenCalledTimes(1);
    // Abre em Hoje, com o agregado daquela janela.
    expect(document.body.textContent).toContain(ds.manifestacoes(40));
    // E a janela de 30 dias já está em memória: uma requisição serve as quatro.
    const aba30d = [...document.body.querySelectorAll<HTMLButtonElement>("[role=tab]")].find(
      (aba) => aba.textContent === ds.periodo30d,
    );
    await act(async () => aba30d?.click());
    await settleMuito();

    expect(document.body.textContent).toContain(ds.manifestacoes(120));
    // Nada de texto de quem publicou: o painel só tem porcentagem e contagem do conjunto.
    expect(document.body.textContent).not.toContain("desabafo nenhum citado aqui");
  });

  it("trocar de periodo NAO refaz requisição: as janelas já vieram juntas", async () => {
    await render();

    const aba7d = [...document.body.querySelectorAll<HTMLButtonElement>("[role=tab]")].find(
      (aba) => aba.textContent === ds.periodo7d,
    );
    await act(async () => aba7d?.click());
    await settleMuito();

    expect(mocks.painel).toHaveBeenCalledTimes(1);
    expect(document.body.textContent).toContain(ds.manifestacoes(40));
  });

  it("janela com amostra pequena mostra o aviso do desenho, não indicador", async () => {
    mocks.painel.mockResolvedValue([
      janela("HOJE", { amostraSuficiente: false, manifestacoes: 4, participantes: 5, emocoes: [] }),
      janela("ULTIMAS_24H", {
        amostraSuficiente: false,
        manifestacoes: 6,
        participantes: 7,
        emocoes: [],
      }),
      janela("ULTIMOS_7D", {
        amostraSuficiente: false,
        manifestacoes: 10,
        participantes: 12,
        emocoes: [],
      }),
      janela("ULTIMOS_30D", {
        amostraSuficiente: false,
        manifestacoes: 18,
        participantes: 19,
        emocoes: [],
      }),
    ]);
    await render();

    expect(document.body.textContent).toContain(ds.amostraInsuficiente);
    expect(document.body.textContent).not.toContain("60%");
  });

  it("erro do servidor mostra o aviso do desenho e o retry refaz a busca", async () => {
    mocks.painel.mockRejectedValue(new Error("fora do ar"));
    await render();

    expect(document.body.textContent).toContain(ds.error);
    const retry = [...document.body.querySelectorAll("button")].find(
      (botao) => botao.textContent === ds.retry,
    );
    mocks.painel.mockResolvedValue(painelCompleto());
    await act(async () => retry?.click());
    await settleMuito();

    expect(mocks.painel).toHaveBeenCalledTimes(2);
    expect(document.body.textContent).toContain(ds.manifestacoes(40));
  });
});
