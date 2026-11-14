import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../api-client";
import { calendarApi } from "./calendar";

vi.mock("../api-client", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
  apiUrl: (path: string) => `http://api.test${path}`,
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

  it("consulta o conflito com a janela e o scope, sem entryId na criação", async () => {
    vi.mocked(api.get).mockResolvedValue([]);

    await calendarApi.conflicts({
      from: "2026-11-10T15:00:00Z",
      to: "2026-11-10T16:00:00Z",
      scope: "PROFESSIONAL",
    });

    expect(api.get).toHaveBeenCalledWith(
      "/calendar/entries/conflicts?from=2026-11-10T15%3A00%3A00Z&to=2026-11-10T16%3A00%3A00Z&scope=PROFESSIONAL",
    );
  });

  it("manda o entryId na edição para o compromisso não conflitar com ele mesmo", async () => {
    vi.mocked(api.get).mockResolvedValue([]);

    await calendarApi.conflicts({
      from: "2026-11-10T15:00:00Z",
      to: "2026-11-10T16:00:00Z",
      entryId: "cal_1",
    });

    expect(api.get).toHaveBeenCalledWith(
      "/calendar/entries/conflicts?from=2026-11-10T15%3A00%3A00Z&to=2026-11-10T16%3A00%3A00Z&entryId=cal_1",
    );
  });

  it("lê a semana de disponibilidade da própria pessoa", async () => {
    vi.mocked(api.get).mockResolvedValue([]);

    await calendarApi.availability();

    expect(api.get).toHaveBeenCalledWith("/calendar/availability");
  });

  it("manda a semana inteira na escrita, sem id: o servidor substitui o conjunto", async () => {
    vi.mocked(api.put).mockResolvedValue([]);
    const week = [
      { dayOfWeek: 1, startsAt: "09:00", endsAt: "12:00", timezone: "America/Sao_Paulo" },
      { dayOfWeek: 3, startsAt: "14:00", endsAt: "18:00", timezone: "America/Sao_Paulo" },
    ];

    await calendarApi.setAvailability(week);

    expect(api.put).toHaveBeenCalledWith("/calendar/availability", { windows: week });
  });

  it("manda a semana vazia quando a pessoa limpa a disponibilidade", async () => {
    vi.mocked(api.put).mockResolvedValue([]);

    await calendarApi.setAvailability([]);

    expect(api.put).toHaveBeenCalledWith("/calendar/availability", { windows: [] });
  });

  it("aponta o export para o .ics da janela, com o scope quando há agenda escolhida", () => {
    expect(
      calendarApi.exportUrl({
        from: "2026-11-01T03:00:00Z",
        to: "2026-12-01T03:00:00Z",
        scope: null,
      }),
    ).toBe(
      "http://api.test/calendar/entries/export.ics?from=2026-11-01T03%3A00%3A00Z&to=2026-12-01T03%3A00%3A00Z",
    );

    expect(
      calendarApi.exportUrl({
        from: "2026-11-01T03:00:00Z",
        to: "2026-12-01T03:00:00Z",
        scope: "SOCIAL",
      }),
    ).toContain("scope=SOCIAL");
  });

  it("trata o 204 da assinatura como 'ainda não existe', não como erro", async () => {
    vi.mocked(api.get).mockResolvedValue(undefined);

    expect(await calendarApi.subscription()).toBeNull();
    expect(api.get).toHaveBeenCalledWith("/calendar/subscription");
  });

  it("cria a assinatura com o scope escolhido e sem scope quando é a consolidada", async () => {
    vi.mocked(api.post).mockResolvedValue({
      scope: "SOCIAL",
      createdAt: "2026-11-10T12:00:00Z",
      revokedAt: null,
      token: "abc",
    });

    await calendarApi.createSubscription("SOCIAL");
    expect(api.post).toHaveBeenCalledWith("/calendar/subscription?scope=SOCIAL");

    await calendarApi.createSubscription(null);
    expect(api.post).toHaveBeenLastCalledWith("/calendar/subscription");
  });

  it("regenera e revoga pela rota de gestão", async () => {
    vi.mocked(api.post).mockResolvedValue({
      scope: null,
      createdAt: "2026-11-10T12:00:00Z",
      revokedAt: null,
      token: "novo",
    });
    vi.mocked(api.delete).mockResolvedValue(undefined);

    await calendarApi.regenerateSubscription();
    expect(api.post).toHaveBeenCalledWith("/calendar/subscription/regenerate");

    await calendarApi.revokeSubscription();
    expect(api.delete).toHaveBeenCalledWith("/calendar/subscription");
  });

  it("monta o endereço que a pessoa cola no calendário externo", () => {
    expect(calendarApi.subscriptionUrl("token-abc")).toBe(
      "http://api.test/calendar/subscribe/token-abc.ics",
    );
  });

  it("inicia a série numa segunda chamada, sobre o id que a criação devolveu", async () => {
    // A criação não aceita cadência: o compromisso nasce avulso e vira fundador da série aqui.
    vi.mocked(api.post).mockResolvedValue({ ...entry, seriesId: "ser_1", recurrence: "WEEKLY" });

    const started = await calendarApi.startSeries("cal_1", "WEEKLY");

    expect(api.post).toHaveBeenCalledWith("/calendar/entries/cal_1/series", {
      recurrence: "WEEKLY",
    });
    expect(started.seriesId).toBe("ser_1");
  });

  it("encerra a série pela rota de gestão do próprio compromisso", async () => {
    vi.mocked(api.delete).mockResolvedValue({ ...entry, seriesId: null, recurrence: null });

    await calendarApi.stopSeries("cal_1");

    expect(api.delete).toHaveBeenCalledWith("/calendar/entries/cal_1/series");
  });
});
