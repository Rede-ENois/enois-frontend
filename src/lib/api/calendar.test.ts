import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../api-client";
import { calendarApi } from "./calendar";

vi.mock("../api-client", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
  // O cliente real monta a query; aqui só interessa o caminho que sai.
  buildQuery: (params: Record<string, unknown>) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined && value !== "") search.append(key, String(value));
    }
    const str = search.toString();
    return str ? `?${str}` : "";
  },
}));

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

describe("calendarApi", () => {
  beforeEach(() => vi.resetAllMocks());

  it("pede a janela e devolve os itens como o servidor mandou", async () => {
    const items = [{ entry, owner: true, participation: null }];
    vi.mocked(api.get).mockResolvedValue(items);

    expect(
      await calendarApi.list({ from: "2026-11-01T03:00:00Z", to: "2026-12-01T03:00:00Z" }),
    ).toEqual(items);

    expect(api.get).toHaveBeenCalledWith(
      "/calendar/entries?from=2026-11-01T03%3A00%3A00Z&to=2026-12-01T03%3A00%3A00Z",
    );
  });

  it("omite o scope em branco em vez de mandar vazio, que o servidor recusaria", async () => {
    vi.mocked(api.get).mockResolvedValue([]);

    await calendarApi.list({
      from: "2026-11-01T03:00:00Z",
      to: "2026-12-01T03:00:00Z",
      scope: null,
    });

    const path = vi.mocked(api.get).mock.calls[0][0] as string;
    expect(path).not.toContain("scope");
  });

  it("manda o scope quando a tela está em uma agenda só", async () => {
    vi.mocked(api.get).mockResolvedValue([]);

    await calendarApi.list({
      from: "2026-11-01T03:00:00Z",
      to: "2026-12-01T03:00:00Z",
      scope: "PROFESSIONAL",
    });

    expect(vi.mocked(api.get).mock.calls[0][0]).toContain("scope=PROFESSIONAL");
  });

  it("não manda janela vazia: quem não tem data pede a rota sem query nenhuma", async () => {
    // A tela nunca chama assim; o teste trava a garantia de que a data não vira "undefined" na URL,
    // que é o que o servidor devolveria como 400 confuso em vez de erro de tela.
    vi.mocked(api.get).mockResolvedValue([]);

    await calendarApi.list({ from: "", to: "" });

    expect(api.get).toHaveBeenCalledWith("/calendar/entries");
  });

  it("cria pelo POST, que já viaja com Idempotency-Key", async () => {
    vi.mocked(api.post).mockResolvedValue(entry);

    const values = {
      title: "Almoço",
      startsAt: "2026-11-10T15:00:00Z",
      endsAt: "2026-11-10T16:00:00Z",
      timeZoneId: "America/Sao_Paulo",
    };
    expect(await calendarApi.create(values)).toEqual(entry);

    expect(api.post).toHaveBeenCalledWith("/calendar/entries", values);
  });

  it("edita pelo PATCH com só os campos que mudaram", async () => {
    vi.mocked(api.patch).mockResolvedValue(entry);

    await calendarApi.update("cal_1", { title: "Almoço com a equipe" });

    expect(api.patch).toHaveBeenCalledWith("/calendar/entries/cal_1", {
      title: "Almoço com a equipe",
    });
  });

  it("cancela pelo DELETE e recebe a entrada já marcada, não uma página vazia", async () => {
    vi.mocked(api.delete).mockResolvedValue({ ...entry, state: "CANCELLED" });

    expect(await calendarApi.cancel("cal_1")).toMatchObject({ id: "cal_1", state: "CANCELLED" });
    expect(api.delete).toHaveBeenCalledWith("/calendar/entries/cal_1");
  });

  it("não deixa responder convite com INVITED, que é o estado de quem ainda não respondeu", () => {
    // A trava é de tipo, não de execução: mandar `INVITED` ao servidor devolveria 400 e a tela
    // mostraria erro por uma resposta que a pessoa não escolheu.
    // @ts-expect-error — só ACCEPTED, DECLINED e TENTATIVE são respostas
    void (() => calendarApi.respond("cal_1", "INVITED"));
  });

  it("convida pelo @ e lê os convites pendentes em rota própria", async () => {
    vi.mocked(api.post).mockResolvedValue({ id: "p1", username: "ana" });
    vi.mocked(api.get).mockResolvedValue([entry]);

    await calendarApi.invite("cal_1", "ana");
    expect(api.post).toHaveBeenCalledWith("/calendar/entries/cal_1/participants", {
      username: "ana",
    });

    expect(await calendarApi.pendingInvitations()).toEqual([entry]);
    expect(api.get).toHaveBeenCalledWith("/calendar/invitations");
  });

  it("lê os lembretes pendentes na rota do compromisso", async () => {
    const reminders = [
      {
        id: "rem_1",
        entryId: "cal_1",
        minutesBefore: 15,
        dueAt: "2026-11-10T14:45:00Z",
        sent: false,
      },
    ];
    vi.mocked(api.get).mockResolvedValue(reminders);

    expect(await calendarApi.listReminders("cal_1")).toEqual(reminders);
    expect(api.get).toHaveBeenCalledWith("/calendar/entries/cal_1/reminders");
  });

  it("põe o lembrete com a antecedência na query, como o PUT do backend espera", async () => {
    const reminder = {
      id: "rem_2",
      entryId: "cal_1",
      minutesBefore: 1440,
      dueAt: "2026-11-09T15:00:00Z",
      sent: false,
    };
    vi.mocked(api.put).mockResolvedValue(reminder);

    expect(await calendarApi.setReminder("cal_1", 1440)).toEqual(reminder);
    expect(api.put).toHaveBeenCalledWith("/calendar/entries/cal_1/reminders?minutesBefore=1440");
  });

  it("tira o lembrete com a mesma query do PUT; repetir não é erro no servidor", async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);

    await calendarApi.clearReminder("cal_1", 30);
    expect(api.delete).toHaveBeenCalledWith("/calendar/entries/cal_1/reminders?minutesBefore=30");
  });
});
