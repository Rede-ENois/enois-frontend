import { describe, expect, it } from "vitest";

import {
  FAIS_SCALE,
  faiscaToBrlMicros,
  formatBrlMicros,
  formatFaisca,
  parseFaiscaInput,
} from "./faisca";

describe("faísca fracionada", () => {
  it("50 faíscas inteiras aparecem como 50 (sem vírgula desnecessária)", () => {
    expect(formatFaisca(50 * FAIS_SCALE)).toBe("50");
  });

  it("usa vírgula decimal no padrão pt-BR", () => {
    expect(formatFaisca(1_500)).toBe("1,5");
    expect(formatFaisca(1_234_500)).toBe("1.234,5");
  });

  it("converte pela cotação precisa em micro-reais", () => {
    // 100 faíscas a 1 centavo (10.000 µ) = R$ 1,00
    expect(formatBrlMicros(faiscaToBrlMicros(100 * FAIS_SCALE, 10_000))).toBe("R$\u00A01,00");
    // 100 faíscas a 1,02 centavo (10.200 µ) = R$ 1,02
    expect(formatBrlMicros(faiscaToBrlMicros(100 * FAIS_SCALE, 10_200))).toBe("R$\u00A01,02");
    // 50 faíscas a 0,5 centavo (5.000 µ) = R$ 0,25
    expect(formatBrlMicros(faiscaToBrlMicros(50 * FAIS_SCALE, 5_000))).toBe("R$\u00A00,25");
  });

  it("lê o que a pessoa digita como faísca inteira e decimal", () => {
    expect(parseFaiscaInput("50")).toBe(50_000);
    expect(parseFaiscaInput("50,5")).toBe(50_500);
    expect(parseFaiscaInput("1.234,56")).toBe(1_234_560);
    expect(parseFaiscaInput("50.5")).toBe(50_500);
  });
});
