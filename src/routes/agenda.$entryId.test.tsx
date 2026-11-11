import { describe, expect, it, vi } from "vitest";

import { requireAuth } from "@/lib/require-auth";

/**
 * A rota do detalhe é a metade que faltava para o compromisso ser clicável: a `/agenda` desenha a
 * grade e manda o `itemHref` para cá. O que este teste prende é o que a rota decide — a sessão e a
 * conversão da resposta da API no que o Design System desenha, com o horário no fuso do próprio
 * compromisso ("19h" continua 19h para quem abre de outro lugar).
 */

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({ options }),
  redirect: () => undefined,
}));

const { Route, detailOf, isSourceOwned, reminderChanges, updateInputOf } =
  await import("./agenda.$entryId");
const options = (Route as unknown as { options: Record<string, unknown> }).options;

const apiDetail = {
  entry: {
    id: "cal_1",
    scope: "PROFESSIONAL" as const,
    kind: "MEETING" as const,
    title: "Revisão",
    description: "Trazer números",
    // 10h de São Paulo é 13h em UTC: quem salva "10h" precisa ler "10h".
    startsAt: "2026-11-10T13:00:00Z",
    endsAt: "2026-11-10T14:00:00Z",
    timeZoneId: "America/Sao_Paulo",
    allDay: false,
    state: "ACTIVE" as const,
    sourceType: null,
    sourceId: null,
    createdAt: "2026-11-08T00:00:00Z",
    updatedAt: "2026-11-08T00:00:00Z",
    cancelledAt: null,
  },
  owner: false,
  participation: "ACCEPTED" as const,
  participants: null,
};

describe("rota /agenda/$entryId", () => {
  it("pede sessão antes de qualquer coisa", () => {
    expect(options.beforeLoad).toBe(requireAuth);
  });

  it("converte o instante para o relógio do fuso do compromisso", () => {
    const view = detailOf(apiDetail);

    expect(view.entry.day).toBe("2026-11-10");
    expect(view.entry.start).toBe("10:00");
    expect(view.entry.end).toBe("11:00");
  });

  it("dia inteiro não mostra horário", () => {
    const view = detailOf({
      ...apiDetail,
      entry: { ...apiDetail.entry, allDay: true },
    });

    expect(view.entry.allDay).toBe(true);
    expect(view.entry.start).toBeNull();
    expect(view.entry.end).toBeNull();
  });

  it("preserva o lugar de quem lê e esconde os participantes do convidado", () => {
    const view = detailOf(apiDetail);

    expect(view.owner).toBe(false);
    expect(view.participation).toBe("ACCEPTED");
    expect(view.participants).toBeNull();
  });

  it("mapeia os convidados quando quem lê organiza", () => {
    const view = detailOf({
      ...apiDetail,
      owner: true,
      participation: null,
      participants: [
        {
          id: "p1",
          entryId: "cal_1",
          username: "ana",
          state: "INVITED" as const,
          invitedAt: "2026-11-08T00:00:00Z",
          respondedAt: null,
        },
      ],
    });

    expect(view.owner).toBe(true);
    expect(view.participants).toEqual([{ id: "p1", username: "ana", state: "INVITED" }]);
  });

  it("escolher um lembrete apaga os outros e grava o novo", () => {
    expect(reminderChanges([{ minutesBefore: 15 }], 60)).toEqual([{ clear: 15 }, { set: 60 }]);
  });

  it("escolher o mesmo lembrete que já existe não mexe em nada", () => {
    expect(reminderChanges([{ minutesBefore: 15 }], 15)).toEqual([]);
  });

  it('"não avisar" apaga todos os lembretes', () => {
    expect(reminderChanges([{ minutesBefore: 15 }, { minutesBefore: 1440 }], null)).toEqual([
      { clear: 15 },
      { clear: 1440 },
    ]);
  });

  it("sem lembrete nenhum, escolher um só grava", () => {
    expect(reminderChanges([], 30)).toEqual([{ set: 30 }]);
  });

  it("compromisso avulso pode ser editado pela agenda", () => {
    expect(isSourceOwned(apiDetail.entry)).toBe(false);
  });

  it("compromisso de outro módulo é somente leitura na agenda", () => {
    const sourced = { ...apiDetail.entry, sourceType: "MENTORING", sourceId: "s1" };
    expect(isSourceOwned(sourced)).toBe(true);
  });

  it("a edição manda escopo, tipo e dia inteiro junto com o resto", () => {
    const input = updateInputOf({
      scope: "SOCIAL",
      kind: "PERSONAL",
      title: "Revisão",
      description: null,
      startsAt: "2026-11-10T13:00:00Z",
      endsAt: "2026-11-10T14:00:00Z",
      timeZoneId: "America/Sao_Paulo",
      allDay: true,
    });

    // O formulário mostra os três; omiti-los fazia o servidor descartar a mudança em silêncio.
    expect(input.scope).toBe("SOCIAL");
    expect(input.kind).toBe("PERSONAL");
    expect(input.allDay).toBe(true);
    expect(input.title).toBe("Revisão");
    expect(input.startsAt).toBe("2026-11-10T13:00:00Z");
  });
});
