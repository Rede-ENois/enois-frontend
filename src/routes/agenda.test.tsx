// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { requireAuth } from "@/lib/require-auth";

/**
 * A agenda é a tela que o projeto inteiro existe para entregar: sem ela o backend tem contrato e
 * ninguém usa. Este teste prende o que a rota decide antes de desenhar — a sessão, a leitura da
 * URL que vira consulta — e o que ela acrescenta ao desenho do DS: a lista de convites pendentes,
 * sem a qual um convite para fora do período na tela não aparece em lugar nenhum.
 */

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  conflicts: vi.fn(),
  pendingInvitations: vi.fn(),
  respond: vi.fn(),
  create: vi.fn(),
  startSeries: vi.fn(),
  stopSeries: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    options,
    useSearch: () => ({}),
    useNavigate: () => () => undefined,
  }),
  redirect: () => undefined,
  Link: (props: Record<string, unknown>) => <a {...props} />,
}));
vi.mock("@/lib/api", () => ({
  calendarApi: {
    list: mocks.list,
    conflicts: mocks.conflicts,
    pendingInvitations: mocks.pendingInvitations,
    respond: mocks.respond,
    create: mocks.create,
    startSeries: mocks.startSeries,
    stopSeries: mocks.stopSeries,
    exportUrl: () => "http://api.test/calendar/entries/export.ics",
  },
}));
vi.mock("@/lib/calendar-export", () => ({
  downloadCalendarExport: vi.fn(),
}));
vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const { Route } = await import("./agenda");
const options = (Route as unknown as { options: Record<string, unknown> }).options;
const AgendaPage = (options as { component: () => React.JSX.Element }).component;

const validate = options.validateSearch as (
  search: Record<string, unknown>,
) => Record<string, string | undefined>;

const entry = {
  id: "cal_1",
  scope: "SOCIAL" as const,
  kind: "PERSONAL" as const,
  title: "Almoço",
  description: null,
  startsAt: "2026-11-10T15:00:00Z",
  endsAt: "2026-11-10T16:00:00Z",
  timeZoneId: "America/Sao_Paulo",
  allDay: false,
  state: "ACTIVE" as const,
  sourceType: null,
  sourceId: null,
  createdAt: "2026-11-08T12:00:00Z",
  updatedAt: "2026-11-08T12:00:00Z",
  cancelledAt: null,
};

// O diálogo do DS se posiciona com radix, que pede um ResizeObserver no jsdom.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const setValue = (
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  value: string,
) =>
  act(() => {
    const proto =
      element instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : element instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(element, value);
    element.dispatchEvent(
      new Event(element instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }),
    );
  });

const clickButton = (label: string) => {
  const button = [...document.body.querySelectorAll("button")].find(
    (node) => node.textContent === label,
  );
  expect(button, `botão "${label}"`).toBeDefined();
  return act(async () => {
    button!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
};

describe("rota /agenda", () => {
  beforeAll(() => {
    globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
  });

  it("pede sessão antes de desenhar qualquer coisa", () => {
    expect(options.beforeLoad).toBe(requireAuth);
  });

  it("guarda visão, período e agenda na URL", () => {
    expect(validate({ view: "week", period: "2026-11", scope: "SOCIAL" })).toEqual({
      view: "week",
      period: "2026-11",
      scope: "SOCIAL",
    });
    expect(validate({ period: "2026-11-09", view: "day" })).toEqual({
      view: "day",
      period: "2026-11-09",
    });
  });

  it("não transforma lixo da URL em consulta", () => {
    // A janela é obrigatória na API; um valor que o calendário não desenha cairia num 400.
    expect(validate({ view: "semana", period: "amanhã", scope: "PESSOAL" })).toEqual({});
    expect(validate({ period: "2026-13" })).toEqual({});
    expect(validate({})).toEqual({});
  });

  describe("convites pendentes", () => {
    let root: Root;
    let host: HTMLDivElement;
    let client: QueryClient;

    const settle = () => act(() => new Promise<void>((done) => setTimeout(done, 0)));

    const render = async () => {
      await act(async () =>
        root.render(
          <QueryClientProvider client={client}>
            <AgendaPage />
          </QueryClientProvider>,
        ),
      );
      await settle();
    };

    beforeEach(() => {
      vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
      mocks.list.mockReset();
      mocks.conflicts.mockReset();
      mocks.pendingInvitations.mockReset();
      mocks.respond.mockReset();
      mocks.create.mockReset();
      mocks.startSeries.mockReset();
      mocks.stopSeries.mockReset();
      host = document.createElement("div");
      document.body.append(host);
      root = createRoot(host);
      client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    });

    afterEach(async () => {
      await act(async () => root.unmount());
      host.remove();
      client.clear();
      vi.unstubAllGlobals();
    });

    it("mostra o convite mesmo fora do período na tela", async () => {
      // A agenda de novembro não desenha dezembro; é a lista do servidor que traz o convite.
      mocks.list.mockResolvedValue([]);
      mocks.conflicts.mockResolvedValue([]);
      mocks.pendingInvitations.mockResolvedValue([
        { ...entry, id: "cal_dez", title: "Roda de dezembro", startsAt: "2026-12-05T15:00:00Z" },
      ]);
      await render();

      expect(host.textContent).toContain("Roda de dezembro");
      expect(host.textContent).toContain("Convites esperando você");
    });

    it("sem convite pendente não desenha bloco vazio", async () => {
      mocks.list.mockResolvedValue([]);
      mocks.conflicts.mockResolvedValue([]);
      mocks.pendingInvitations.mockResolvedValue([]);
      await render();

      expect(host.textContent).not.toContain("Convites esperando você");
    });

    it("a falha da lista de convites não esconde a agenda", async () => {
      mocks.list.mockResolvedValue([{ entry, owner: true, participation: "GOING" }]);
      mocks.conflicts.mockResolvedValue([]);
      mocks.pendingInvitations.mockRejectedValue(new Error("offline"));
      await render();

      expect(host.textContent).toContain("Almoço");
    });

    it("responder aceita o convite e recarrega a lista", async () => {
      mocks.list.mockResolvedValue([]);
      mocks.conflicts.mockResolvedValue([]);
      mocks.pendingInvitations.mockResolvedValue([{ ...entry, id: "cal_dez" }]);
      mocks.respond.mockResolvedValue({});
      await render();

      const accept = [...host.querySelectorAll("button")].find(
        (button) => button.textContent === "Aceitar",
      );
      expect(accept).toBeDefined();

      // A invalidação da chave "agenda" refetch a lista de convites; com o mock vazio, o bloco sai.
      await act(async () => {
        mocks.pendingInvitations.mockResolvedValue([]);
        await accept!.click();
      });
      await settle();

      expect(mocks.respond).toHaveBeenCalledWith("cal_dez", "ACCEPTED");
      expect(host.textContent).not.toContain("Roda de dezembro");
    });
  });

  describe("cadência", () => {
    let root: Root;
    let host: HTMLDivElement;
    let client: QueryClient;

    const settle = () => act(() => new Promise<void>((done) => setTimeout(done, 0)));

    const render = async () => {
      await act(async () =>
        root.render(
          <QueryClientProvider client={client}>
            <AgendaPage />
          </QueryClientProvider>,
        ),
      );
      await settle();
    };

    beforeEach(() => {
      vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
      mocks.list.mockReset();
      mocks.conflicts.mockReset();
      mocks.pendingInvitations.mockReset();
      mocks.respond.mockReset();
      mocks.create.mockReset();
      mocks.startSeries.mockReset();
      mocks.stopSeries.mockReset();
      mocks.list.mockResolvedValue([]);
      mocks.conflicts.mockResolvedValue([]);
      mocks.pendingInvitations.mockResolvedValue([]);
      host = document.createElement("div");
      document.body.append(host);
      root = createRoot(host);
      client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    });

    afterEach(async () => {
      await act(async () => root.unmount());
      host.remove();
      client.clear();
      vi.unstubAllGlobals();
    });

    it("salvar com cadência cria o compromisso e começa a série sobre o id devolvido", async () => {
      mocks.create.mockResolvedValue({ ...entry, id: "cal_novo" });
      mocks.startSeries.mockResolvedValue({
        ...entry,
        id: "cal_novo",
        seriesId: "ser_1",
        recurrence: "WEEKLY",
      });
      await render();

      await clickButton("Novo compromisso");
      setValue(document.body.querySelector('[id$="-title"]')!, "Alongamento");
      setValue(document.body.querySelector('[id$="-day"]') as HTMLInputElement, "10/11/2026");
      setValue(document.body.querySelector('[id$="-start"]') as HTMLInputElement, "12:00");
      setValue(document.body.querySelector('[id$="-end"]') as HTMLInputElement, "13:00");
      setValue(document.body.querySelector('[id$="-recurrence"]') as HTMLSelectElement, "WEEKLY");
      await clickButton("Salvar");
      await settle();

      // A cadência não vai na criação: vira a segunda chamada, com o id que a primeira devolveu.
      expect(mocks.create).toHaveBeenCalledTimes(1);
      expect(mocks.startSeries).toHaveBeenCalledWith("cal_novo", "WEEKLY");
    });

    it("sem cadência não há segunda chamada: um compromisso avulso é uma só criação", async () => {
      mocks.create.mockResolvedValue({ ...entry, id: "cal_novo" });
      await render();

      await clickButton("Novo compromisso");
      setValue(document.body.querySelector('[id$="-title"]')!, "Aviso único");
      setValue(document.body.querySelector('[id$="-day"]') as HTMLInputElement, "10/11/2026");
      setValue(document.body.querySelector('[id$="-start"]') as HTMLInputElement, "12:00");
      setValue(document.body.querySelector('[id$="-end"]') as HTMLInputElement, "13:00");
      await clickButton("Salvar");
      await settle();

      expect(mocks.create).toHaveBeenCalledTimes(1);
      expect(mocks.startSeries).not.toHaveBeenCalled();
    });

    it("se a série falha, o compromisso já criado não some nem vira erro de criação", async () => {
      mocks.create.mockResolvedValue({ ...entry, id: "cal_novo" });
      mocks.startSeries.mockRejectedValue(new Error("offline"));
      await render();

      await clickButton("Novo compromisso");
      setValue(document.body.querySelector('[id$="-title"]')!, "Alongamento");
      setValue(document.body.querySelector('[id$="-day"]') as HTMLInputElement, "10/11/2026");
      setValue(document.body.querySelector('[id$="-start"]') as HTMLInputElement, "12:00");
      setValue(document.body.querySelector('[id$="-end"]') as HTMLInputElement, "13:00");
      setValue(document.body.querySelector('[id$="-recurrence"]') as HTMLSelectElement, "MONTHLY");
      await clickButton("Salvar");
      await settle();

      expect(mocks.create).toHaveBeenCalledTimes(1);
      expect(mocks.startSeries).toHaveBeenCalledWith("cal_novo", "MONTHLY");
      // A frase do erro é a da série, não a da gravação: o compromisso existe, a repetição não.
      expect(document.body.textContent).toContain("Não foi possível repetir o compromisso");
    });
  });
});
