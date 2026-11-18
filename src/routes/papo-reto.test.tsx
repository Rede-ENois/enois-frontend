// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { PapoIntervaloTimelineView } from "@/types/application/paporeto/papo-intervalo-view";
import type { PapoAssuntoView } from "@/types/application/paporeto/papo-subject-view";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A rota do Papo Reto: o app só alimenta o painel do design system com o agregado do backend.
 * Este teste prende exatamente isso — o ranking e a contagem de falas analisadas chegam em
 * duas buscas independentes, a timeline só é buscada quando o assunto abre (e a troca de
 * janela busca de novo), o erro tem retry e nenhuma frase de pessoa aparece: o backend não
 * manda autor e a rota não inventa.
 */

const mocks = vi.hoisted(() => ({
  ranking: vi.fn(),
  timeline: vi.fn(),
  analise: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    options,
    useSearch: () => ({}),
  }),
}));
vi.mock("@/lib/api", () => ({
  papoRetoApi: { ranking: mocks.ranking, timeline: mocks.timeline, analise: mocks.analise },
}));
vi.mock("@/lib/require-auth", () => ({ requireAuth: () => undefined }));
// O invólucro da página busca dados de sessão do runtime do servidor; aqui ele só emoldura.
vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const { Route } = await import("./papo-reto");
const options = (Route as unknown as { options: Record<string, unknown> }).options;
const PapoRetoPage = (options as { component: () => React.JSX.Element }).component;

const assunto = (nome: string, status: PapoAssuntoView["status"]): PapoAssuntoView => ({
  subject: nome,
  status,
  pontuacao: 4.2,
  falasPost: 12,
  falasComentario: 8,
  pessoas: 9,
  falasUltimaHora: 3,
  crescimento: 25,
});

const ranking: PapoAssuntoView[] = [
  assunto("inteligencia artificial", "EMERGENTE"),
  assunto("feira de projetos", "HOT"),
];

const timeline: PapoIntervaloTimelineView[] = [
  { hora: "2026-11-18T17:00:00Z", falas: 2 },
  { hora: "2026-11-18T18:00:00Z", falas: 5 },
];

// Frases do desenho que vivem no design system (mensagens padrão paporeto*).
const ds = {
  title: "Papo Reto",
  loading: "Ouvindo o papo…",
  error: "Não foi possível abrir o Papo Reto. Tente de novo.",
  retry: "Tentar de novo",
  falasAnalisadas: (n: number) => `${n} falas analisadas na última semana`,
  statusEmergente: "Emergindo",
  janela30d: "30 dias",
};

describe("rota do Papo Reto", () => {
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
          <PapoRetoPage />
        </QueryClientProvider>,
      );
    });
    await settleMuito();
  };

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    mocks.ranking.mockReset();
    mocks.timeline.mockReset();
    mocks.analise.mockReset();
    mocks.ranking.mockResolvedValue(ranking);
    mocks.timeline.mockResolvedValue(timeline);
    mocks.analise.mockResolvedValue(87);
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

  it("o painel carrega o ranking, a analise e abre sem timeline nenhuma", async () => {
    await render();

    expect(document.body.textContent).toContain(texts.papoReto.title);
    expect(mocks.ranking).toHaveBeenCalledTimes(1);
    expect(mocks.analise).toHaveBeenCalledTimes(1);
    expect(document.body.textContent).toContain(ds.falasAnalisadas(87));
    expect(document.body.textContent).toContain("inteligencia artificial");
    expect(document.body.textContent).toContain(ds.statusEmergente);
    // Assunto fechado não busca timeline: a série só chega quando o assunto abre.
    expect(mocks.timeline).not.toHaveBeenCalled();
    expect(document.body.querySelectorAll("[role=img]")).toHaveLength(0);
  });

  it("abrir o assunto busca a timeline dele, e trocar de janela busca de novo", async () => {
    await render();

    const abrir = [...document.body.querySelectorAll<HTMLButtonElement>("button")].find((botao) =>
      (botao.getAttribute("aria-label") ?? "").includes("inteligencia artificial"),
    );
    await act(async () => abrir?.click());
    await settleMuito();

    expect(mocks.timeline).toHaveBeenCalledTimes(1);
    expect(mocks.timeline).toHaveBeenCalledWith("inteligencia artificial", "24h");
    expect(document.body.querySelectorAll("[role=img]")).toHaveLength(1);

    const aba30d = [...document.body.querySelectorAll<HTMLButtonElement>("[role=tab]")].find(
      (aba) => aba.textContent === ds.janela30d,
    );
    await act(async () => aba30d?.click());
    await settleMuito();

    expect(mocks.timeline).toHaveBeenCalledWith("inteligencia artificial", "30d");
  });

  it("fechar o assunto desliga a timeline sem recarregar o ranking", async () => {
    await render();

    const abrir = [...document.body.querySelectorAll<HTMLButtonElement>("button")].find((botao) =>
      (botao.getAttribute("aria-label") ?? "").includes("inteligencia artificial"),
    );
    await act(async () => abrir?.click());
    await settleMuito();

    const fechar = [...document.body.querySelectorAll<HTMLButtonElement>("button")].find((botao) =>
      (botao.getAttribute("aria-label") ?? "").includes("inteligencia artificial"),
    );
    await act(async () => fechar?.click());
    await settleMuito();

    expect(document.body.querySelectorAll("[role=img]")).toHaveLength(0);
    expect(mocks.ranking).toHaveBeenCalledTimes(1);
  });

  it("erro do ranking mostra o aviso do desenho e o retry refaz as duas buscas", async () => {
    mocks.ranking.mockRejectedValue(new Error("fora do ar"));
    mocks.analise.mockRejectedValue(new Error("fora do ar"));
    await render();

    expect(document.body.textContent).toContain(ds.error);
    const retry = [...document.body.querySelectorAll("button")].find(
      (botao) => botao.textContent === ds.retry,
    );
    mocks.ranking.mockResolvedValue(ranking);
    mocks.analise.mockResolvedValue(87);
    await act(async () => retry?.click());
    await settleMuito();

    expect(mocks.ranking).toHaveBeenCalledTimes(2);
    expect(mocks.analise).toHaveBeenCalledTimes(2);
    expect(document.body.textContent).toContain("inteligencia artificial");
  });

  it("erro da analise nao derruba o painel: o ranking segue", async () => {
    mocks.analise.mockRejectedValue(new Error("fora do ar"));
    await render();

    expect(document.body.textContent).toContain("inteligencia artificial");
    expect(document.body.textContent).not.toContain(ds.falasAnalisadas(87));
  });

  it("a rota exige sessão e declara o título do SEO da página", () => {
    expect(options.beforeLoad).toBeTypeOf("function");
    const head = (options as { head: () => { meta: { title: string }[] } }).head();
    expect(head.meta[0]?.title).toBe(texts.papoReto.seoTitle);
  });
});
