import { describe, expect, it } from "vitest";

import { ADULT_AGE, MIN_AGE, ageFromBirthDate, hasMinAge, isMinorAge } from "./min-age";

/** Data ISO com exatamente `years` anos completos na data de `hoje`. */
function anosAtras(years: number, hoje = new Date()): string {
  const d = new Date(hoje.getFullYear() - years, hoje.getMonth(), hoje.getDate());
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

describe("régua de idade da plataforma", () => {
  it("16 é a idade mínima; 18 é quando a supervisão termina", () => {
    expect(MIN_AGE).toBe(16);
    expect(ADULT_AGE).toBe(18);
  });

  it("aceita 16 e 17 anos e recusa 15", () => {
    expect(hasMinAge(anosAtras(16))).toBe(true);
    expect(hasMinAge(anosAtras(17))).toBe(true);
    expect(hasMinAge(anosAtras(15))).toBe(false);
  });

  it("quem tem 16 ou 17 ainda é menor para efeito de supervisão", () => {
    expect(isMinorAge(anosAtras(16))).toBe(true);
    expect(isMinorAge(anosAtras(17))).toBe(true);
    expect(isMinorAge(anosAtras(18))).toBe(false);
  });

  it("faz o corte pelo dia, não só pelo ano", () => {
    // Nasceu hoje, 16 anos atrás: a idade completa no dia, então passa.
    expect(ageFromBirthDate(anosAtras(16))).toBe(16);
    // Amanhã ele teria 16 e hoje ainda tem 15: recusado.
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    expect(hasMinAge(anosAtras(16, amanha))).toBe(false);
  });

  it("recusa formato inválido e idade implausível", () => {
    expect(hasMinAge("16/05/2009")).toBe(false);
    expect(hasMinAge("")).toBe(false);
    expect(hasMinAge("1800-01-01")).toBe(false);
  });
});
