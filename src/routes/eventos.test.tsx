// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { Event } from "@/types/application/event/event";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  search: {} as { evento?: string },
  list: vi.fn(),
  setRecurrence: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  conflicts: vi.fn(),
  attend: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({
    options,
    useSearch: () => mocks.search,
  }),
}));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    eventsApi: {
      list: mocks.list,
      setRecurrence: mocks.setRecurrence,
      create: mocks.create,
      attend: mocks.attend,
      cancelAttendance: vi.fn(),
      update: mocks.update,
      remove: mocks.remove,
    },
    calendarApi: { conflicts: mocks.conflicts },
  };
});
vi.mock("@/lib/require-auth", () => ({ requireAuth: () => undefined }));
vi.mock("@/components/app-container", () => ({
  AppContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
// A barra tem teste próprio; aqui interessa só QUANDO o card a mostra.
vi.mock("@/components/calls/tamo-junto-bar", () => ({
  TamoJuntoBar: ({ eventId }: { eventId?: string }) => <span data-tamo-junto={eventId ?? ""} />,
}));

const { Route } = await import("./eventos");
const Eventos = (Route as unknown as { options: { component: () => React.JSX.Element } }).options
  .component;

const event = (overrides: Partial<Event>): Event => ({
  id: "ev-1",
  title: "Encontro de estudo",
  date: "2026-11-06",
  time: "19:00",
  format: "HYBRID",
  host: "Comunidade",
  attendees: 3,
  cover: null,
  streamUrl: "https://example.com/live",
  location: "Praça da Liberdade",
  expired: false,
  attending: false,
  ...overrides,
});

describe("/eventos", () => {
  let root: Root;
  let host: HTMLDivElement;
  let client: QueryClient;

  /** React Query notifies on a 0 ms timer; the fake-timer test advances it itself. */
  const settle = () => act(() => new Promise<void>((done) => setTimeout(done, 0)));

  const render = async (wait = true) => {
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Eventos />
        </QueryClientProvider>,
      ),
    );
    if (wait) await settle();
  };

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    Object.values(mocks).forEach((mock) => typeof mock === "function" && mock.mockReset());
    mocks.search = {};
    host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    host.remove();
    client.clear();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("renders a hybrid event with both place and stream, and the series cadence", async () => {
    mocks.list.mockResolvedValue({
      items: [
        event({
          recurrence: "WEEKLY",
          nextOccurrenceDate: "2026-11-13",
          city: "Belo Horizonte",
          state: "MG",
        }),
      ],
      nextCursor: null,
    });
    await render();

    const card = host.querySelector("#evento-ev-1");
    expect(card?.textContent).toContain("Praça da Liberdade · Belo Horizonte, MG");
    expect(card?.textContent).toContain("Toda semana");
    expect(card?.textContent).toContain("13/11");
    // Not the creator: no series control.
    expect(host.textContent).not.toContain("Repetição da série");
  });

  it("asks only for rituals when the filter is on", async () => {
    mocks.list.mockResolvedValue({ items: [], nextCursor: null });
    await render();
    expect(mocks.list).toHaveBeenLastCalledWith(undefined, null, 20, false);

    const rituals = [...host.querySelectorAll("button")].find((b) => b.textContent === "Rituais");
    await act(async () => rituals!.click());
    await settle();

    expect(mocks.list).toHaveBeenLastCalledWith(undefined, null, 20, true);
    expect(host.textContent).toContain("Nenhum ritual por aqui ainda.");
  });

  it("shows the Tamo junto bar only for an event that opted in", async () => {
    mocks.list.mockResolvedValue({
      items: [event({ id: "ev-1", tamoJunto: false }), event({ id: "ev-2", tamoJunto: true })],
      nextCursor: null,
    });
    await render();

    // A barra é irmã do card no grid: existe só para o evento que optou.
    expect(host.querySelector('[data-tamo-junto="ev-1"]')).toBeNull();
    expect(host.querySelector('[data-tamo-junto="ev-2"]')).not.toBeNull();
  });

  it("keeps the Tamo junto bar away from an event already over", async () => {
    mocks.list.mockResolvedValue({
      items: [event({ tamoJunto: true, expired: true })],
      nextCursor: null,
    });
    await render();

    expect(host.querySelector("[data-tamo-junto]")).toBeNull();
  });

  it("lets the creator stop the series and shows the API refusal inline", async () => {
    mocks.list.mockResolvedValue({
      items: [event({ recurrence: "WEEKLY", canManageRecurrence: true })],
      nextCursor: null,
    });
    mocks.setRecurrence.mockRejectedValue(new Error("boom"));
    await render();

    const stop = [...host.querySelectorAll("button")].find(
      (b) => b.textContent === "Parar a série",
    );
    await act(async () => stop!.click());
    await settle();

    expect(mocks.setRecurrence).toHaveBeenCalledWith("ev-1", "NONE");
    expect(host.querySelector('[role="alert"]')?.textContent).toBe(
      "Não foi possível mudar a repetição. Tente de novo.",
    );
  });

  it("highlights the deep-linked event, scrolls to it and clears the ring later", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    mocks.search = { evento: "ev-2" };
    mocks.list.mockResolvedValue({
      items: [event({ id: "ev-1" }), event({ id: "ev-2" })],
      nextCursor: null,
    });
    await render(false);
    await act(async () => vi.advanceTimersByTimeAsync(300));

    const card = host.querySelector("#evento-ev-2");
    expect(card?.getAttribute("data-highlighted")).toBe("true");
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(host.querySelector("#evento-ev-1")?.hasAttribute("data-highlighted")).toBe(false);

    await act(async () => vi.advanceTimersByTimeAsync(4000));
    expect(card?.hasAttribute("data-highlighted")).toBe(false);
  });

  it("lets the creator edit the content without carrying the series", async () => {
    mocks.list.mockResolvedValue({
      items: [event({ recurrence: "WEEKLY", canManageRecurrence: true })],
      nextCursor: null,
    });
    mocks.update.mockResolvedValue({ ...event({}), title: "Encontro renomeado" });
    await render();

    const edit = [...host.querySelectorAll("button")].find(
      (b) => b.textContent === "Editar evento",
    );
    await act(async () => edit!.click());

    const dialog = document.querySelector('[role="dialog"]')!;
    // O formulário abre preenchido com o evento — e sem o campo de repetição (a série tem controle
    // próprio no card).
    expect(dialog.querySelector("input")?.value).toBe("Encontro de estudo");
    expect(dialog.textContent).not.toContain("Repetição da série");

    const fill = (element: HTMLInputElement, value: string) => {
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element) as object, "value")!.set!.call(
        element,
        value,
      );
      element.dispatchEvent(new Event("input", { bubbles: true }));
    };
    await act(async () => fill(dialog.querySelector("input")!, "Encontro renomeado"));

    const submit = [...dialog.querySelectorAll("button")].find(
      (b) => b.textContent === "Salvar alterações",
    );
    await act(async () => submit!.click());
    await settle();

    expect(mocks.update).toHaveBeenCalledTimes(1);
    const [eventId, payload] = mocks.update.mock.calls[0];
    expect(eventId).toBe("ev-1");
    expect(payload).toMatchObject({ title: "Encontro renomeado", date: "2026-11-06" });
    expect(payload).not.toHaveProperty("recurrence");
    // Fechou o formulário: a edição foi aceita.
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it("deletes an event the creator confirmed, and keeps it on a refusal", async () => {
    mocks.list.mockResolvedValue({
      items: [event({ canManageRecurrence: true })],
      nextCursor: null,
    });
    mocks.remove.mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce({ status: "OK" });
    await render();

    const open = async () => {
      const remove = [...host.querySelectorAll("button")].find((b) => b.textContent === "Excluir");
      await act(async () => remove!.click());
      const dialog = document.querySelector('[role="dialog"]')!;
      expect(dialog.textContent).toContain("Excluir este evento?");
      const confirm = [...dialog.querySelectorAll("button")].find(
        (b) => b.textContent === "Excluir",
      )!;
      await act(async () => confirm.click());
      await settle();
    };

    // Recusa do servidor: a pergunta continua aberta, nada some da lista por engano.
    await open();
    expect(mocks.remove).toHaveBeenCalledWith("ev-1");
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();

    // Aceito: o diálogo fecha.
    await open();
    expect(mocks.remove).toHaveBeenCalledTimes(2);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  describe("alerta de conflito antes de confirmar presença", () => {
    // O mesmo evento que o calendário guarda quando a presença é confirmada: título, começo e fim.
    const entry = (title: string, cancelledAt: string | null = null) => ({
      entry: {
        id: `cal-${title}`,
        scope: "SOCIAL" as const,
        kind: "EVENT" as const,
        title,
        description: null,
        startsAt: "2026-11-06T22:00:00Z",
        endsAt: "2026-11-06T23:00:00Z",
        timeZoneId: "America/Sao_Paulo",
        allDay: false,
        cancelledAt,
      },
      owner: true,
      participation: null,
    });

    const attendButton = () =>
      [...host.querySelectorAll("button")].find((b) => b.textContent === "Confirmar presença")!;

    const open = async () => {
      await act(async () => attendButton().click());
      await settle();
      await settle();
    };

    beforeEach(() => {
      mocks.list.mockResolvedValue({ items: [event({})], nextCursor: null });
      mocks.attend.mockResolvedValue({ status: "OK" });
    });

    it("avisa e só confirma depois do 'vou mesmo assim'", async () => {
      mocks.conflicts.mockResolvedValue([entry("Reunião do núcleo")]);
      await render();

      await open();

      expect(mocks.conflicts).toHaveBeenCalledWith({
        from: "2026-11-06T22:00:00.000Z",
        to: "2026-11-06T23:00:00.000Z",
      });
      const dialog = document.querySelector('[role="dialog"]')!;
      expect(dialog.textContent).toContain("Outro compromisso nesse horário");
      expect(dialog.textContent).toContain("Reunião do núcleo");
      // O aviso não confirma sozinho: nada foi para o servidor enquanto o diálogo está aberto.
      expect(mocks.attend).not.toHaveBeenCalled();

      const cancel = [...dialog.querySelectorAll("button")].find(
        (b) => b.textContent === "Deixa para depois",
      )!;
      await act(async () => cancel.click());
      await settle();
      expect(mocks.attend).not.toHaveBeenCalled();
      expect(document.querySelector('[role="dialog"]')).toBeNull();

      // Na segunda tentativa a pessoa decide seguir mesmo assim.
      mocks.conflicts.mockResolvedValue([entry("Reunião do núcleo")]);
      await open();
      const confirm = [
        ...document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button'),
      ].find((b) => b.textContent === "Vou mesmo assim")!;
      await act(async () => confirm.click());
      await settle();
      expect(mocks.attend).toHaveBeenCalledWith("ev-1");
    });

    it("confirma direto quando a agenda está livre", async () => {
      mocks.conflicts.mockResolvedValue([]);
      await render();

      await open();

      expect(mocks.attend).toHaveBeenCalledWith("ev-1");
      expect(document.querySelector('[role="dialog"]')).toBeNull();
    });

    it("compromisso cancelado não conta como conflito", async () => {
      mocks.conflicts.mockResolvedValue([entry("Reunião cancelada", "2026-11-01T12:00:00Z")]);
      await render();

      await open();

      expect(mocks.attend).toHaveBeenCalledWith("ev-1");
    });

    it("agenda fora do ar não impede a presença", async () => {
      mocks.conflicts.mockRejectedValue(new Error("boom"));
      await render();

      await open();

      expect(mocks.attend).toHaveBeenCalledWith("ev-1");
      expect(document.querySelector('[role="dialog"]')).toBeNull();
    });
  });

  it("does not create a recurring event without a time", async () => {
    mocks.list.mockResolvedValue({ items: [], nextCursor: null });
    await render();

    const openForm = [...host.querySelectorAll("button")].find(
      (b) => b.textContent === "Criar evento",
    );
    await act(async () => openForm!.click());

    const dialog = document.querySelector('[role="dialog"]')!;
    const fill = (element: HTMLInputElement | HTMLSelectElement, value: string) => {
      const proto = Object.getPrototypeOf(element) as object;
      Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(element, value);
      element.dispatchEvent(
        new Event(element.tagName === "SELECT" ? "change" : "input", { bubbles: true }),
      );
    };
    const inputs = dialog.querySelectorAll("input:not([type=file])");
    await act(async () => {
      fill(inputs[0] as HTMLInputElement, "Ritual de estudo");
      fill(inputs[1] as HTMLInputElement, "2026-11-06");
      fill(inputs[3] as HTMLInputElement, "Comunidade");
      fill(dialog.querySelector("select")!, "WEEKLY");
    });

    const submit = [...dialog.querySelectorAll("button")].find(
      (b) => b.textContent === "Criar evento",
    );
    await act(async () => submit!.click());

    expect(mocks.create).not.toHaveBeenCalled();
    expect(dialog.querySelector('[role="alert"]')?.textContent).toBe(
      "Eventos que se repetem precisam de horário.",
    );
  });

  it("creates an event carrying the Tamo junto opt-in", async () => {
    mocks.list.mockResolvedValue({ items: [], nextCursor: null });
    mocks.create.mockResolvedValue(event({}));
    await render();

    const openForm = [...host.querySelectorAll("button")].find(
      (b) => b.textContent === "Criar evento",
    );
    await act(async () => openForm!.click());

    const dialog = document.querySelector('[role="dialog"]')!;
    const fill = (element: HTMLInputElement, value: string) => {
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element) as object, "value")!.set!.call(
        element,
        value,
      );
      element.dispatchEvent(new Event("input", { bubbles: true }));
    };
    const inputs = dialog.querySelectorAll("input:not([type=file])");
    await act(async () => {
      fill(inputs[0] as HTMLInputElement, "Ritual de estudo");
      fill(inputs[1] as HTMLInputElement, "2026-11-06");
      fill(inputs[3] as HTMLInputElement, "Comunidade");
    });

    // A caixinha nasce desligada: quem cria escolhe a sala.
    const toggle = dialog.querySelector('button[role="switch"][aria-checked="false"]');
    expect(toggle).not.toBeNull();
    await act(async () => (toggle as HTMLButtonElement).click());

    const submit = [...dialog.querySelectorAll("button")].find(
      (b) => b.textContent === "Criar evento",
    );
    await act(async () => submit!.click());
    await settle();

    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(mocks.create.mock.calls[0][0]).toMatchObject({ tamoJunto: true });
  });
});
