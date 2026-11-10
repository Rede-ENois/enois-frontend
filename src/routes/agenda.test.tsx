import { describe, expect, it, vi } from "vitest";

import { requireAuth } from "@/lib/require-auth";

/**
 * A agenda é a tela que o projeto inteiro existe para entregar: sem ela o backend tem contrato e
 * ninguém usa. Este teste prende o que a rota decide antes de desenhar — a sessão, e a leitura da
 * URL que vira consulta. O desenho em si é do Design System, testado lá.
 */

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: Record<string, unknown>) => ({ options }),
  redirect: () => undefined,
}));

const { Route } = await import("./agenda");
const options = (Route as unknown as { options: Record<string, unknown> }).options;

const validate = options.validateSearch as (
  search: Record<string, unknown>,
) => Record<string, string | undefined>;

describe("rota /agenda", () => {
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
});
