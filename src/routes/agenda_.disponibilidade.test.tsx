import { describe, expect, it, vi } from "vitest";

import { requireAuth } from "@/lib/require-auth";

/**
 * A tela de disponibilidade desenha com o `CalendarAvailabilitySurface` do Design System; aqui
 * ficam as decisões da rota: sessão obrigatória e o título da página. O desenho e a validação da
 * semana são do DS, testados lá.
 */

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({ options }),
}));

const { Route } = await import("./agenda_.disponibilidade");
const options = (Route as unknown as { options: Record<string, unknown> }).options;

describe("rota /agenda/disponibilidade", () => {
  it("pede sessão antes de desenhar: a semana é do dono", () => {
    expect(options.beforeLoad).toBe(requireAuth);
  });

  it("nomeia a página para a aba do navegador", () => {
    const head = options.head as () => { meta: { title: string }[] };
    expect(head().meta[0].title).toBe("Disponibilidade · Énóis");
  });
});
