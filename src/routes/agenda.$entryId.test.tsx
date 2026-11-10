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

const { Route, detailOf } = await import("./agenda.$entryId");
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
});
