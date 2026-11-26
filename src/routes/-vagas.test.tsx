// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { Job } from "@/types/application/job/job";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildJobFilters } from "@/lib/job-filters";
import { converterPaginacao } from "@/lib/jobs-paginacao";

(globalThis as unknown as { __dbg?: number }).__dbg = 1;

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  platforms: vi.fn(),
  saved: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({ options }),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  Outlet: () => null,
  useMatchRoute: () => () => false,
}));
vi.mock("@/lib/api", () => ({
  jobsApi: {
    list: mocks.list,
    platforms: mocks.platforms,
    saved: mocks.saved,
    save: vi.fn(),
    removeSave: vi.fn(),
  },
  reportsApi: { report: vi.fn() },
}));
vi.mock("@/lib/current-user", () => ({ useCurrentUser: () => ({ data: null }) }));
vi.mock("@/lib/use-auth", () => ({ useIsAuthenticated: () => false }));
vi.mock("@/lib/require-auth", () => ({ requireAuth: () => undefined }));
vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/events/saci-spot", () => ({ SaciSpot: () => null }));
vi.mock("@/components/create-external-job-dialog", () => ({
  CreateExternalJobDialog: () => null,
}));

const { JobsListPage } = await import("./vagas");

describe("/vagas — filtros da aba de plataformas externas", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  const settle = () => act(() => new Promise<void>((done) => setTimeout(done, 0)));

  const button = (label: string) =>
    [...host.querySelectorAll("button")].find((item) => item.textContent === label);

  const lastListParams = () => mocks.list.mock.calls.at(-1)?.[0] as Record<string, unknown>;

  beforeEach(async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.list.mockResolvedValue({ items: [], nextCursor: null });
    mocks.platforms.mockResolvedValue([]);
    mocks.saved.mockResolvedValue({ items: [], nextCursor: null });
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <JobsListPage />
        </QueryClientProvider>,
      ),
    );
    await settle();
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    client.clear();
    vi.unstubAllGlobals();
  });

  it("manda o Local como modelo de trabalho, que é o que o backend externo filtra", async () => {
    await act(async () => button("Plataformas externas")!.click());
    await settle();
    await act(async () => button("Remoto")!.click());
    await settle();

    const params = lastListParams();
    expect(params.source).toBe("EXTERNAL");
    expect(params.workModel).toBe("REMOTE");
    // `location` é texto livre da busca interna: o backend externo o descarta em silêncio, e a
    // lista voltava igual com o filtro ligado.
    expect(params.location).toBeUndefined();
  });

  it("manda o Tipo como vínculo e não oferece CLT/PJ nas externas", async () => {
    await act(async () => button("Plataformas externas")!.click());
    await settle();

    expect(button("CLT")).toBeUndefined();
    expect(button("PJ")).toBeUndefined();

    await act(async () => button("Tempo integral")!.click());
    await settle();

    const params = lastListParams();
    expect(params.employmentType).toBe("FULL_TIME");
    expect(params.type).toBeUndefined();
  });

  it("não manda habilidades para a aba externa", async () => {
    await act(async () => button("Plataformas externas")!.click());
    await settle();

    expect(host.querySelector('input[aria-label="Habilidades (ex.: Java, Spring)"]')).toBeNull();
    expect(lastListParams().skills).toBeUndefined();
  });

  it("a página seguinte entra no fim da lista e a seguinte começa do zero", () => {
    // O acumulado das páginas era refeito por um efeito sobre o estado delas; com a segunda
    // página voltando do cache (sem resposta nova) a lista ficava só com a primeira. Agora a
    // página entra na renderização da própria resposta, e é esta peça que decide como.
    // Só o id é comparado; o resto do Job não é lido pela peça testada.
    const vaga = (id: string) => ({ id, title: `Vaga ${id}` }) as unknown as Job;
    const vazia = { chave: "", jobs: [] as Job[], cursor: null };

    const primeira = converterPaginacao(vazia, "enois", null, {
      items: [vaga("a"), vaga("b")],
      nextCursor: "pagina-2",
    });
    expect(primeira).toEqual({ chave: "enois", jobs: [vaga("a"), vaga("b")], cursor: null });

    const segunda = converterPaginacao(primeira, "enois", "pagina-2", {
      items: [vaga("c"), vaga("b")],
      nextCursor: null,
    });
    // A vaga que já estava na lista (b) não entra duas vezes.
    expect(segunda.jobs.map((job) => job.id)).toEqual(["a", "b", "c"]);
    // De novo com a mesma página (cache): a mesma lista, sem render extra.
    expect(
      converterPaginacao(segunda, "enois", "pagina-2", {
        items: [vaga("c")],
        nextCursor: null,
      }),
    ).toBe(segunda);
    // Filtro diferente: a lista recomeça na primeira página dele.
    expect(
      converterPaginacao(segunda, "outro", null, { items: [vaga("z")], nextCursor: null }),
    ).toEqual({
      chave: "outro",
      jobs: [vaga("z")],
      cursor: null,
    });
  });

  it("na aba do Énóis continua mandando os filtros da busca interna", async () => {
    await act(async () => button("CLT")!.click());
    await settle();

    const params = lastListParams();
    expect(params.source).toBe("INTERNAL");
    expect(params.type).toBe("CLT");
    expect(params.workModel).toBeUndefined();
  });
});
