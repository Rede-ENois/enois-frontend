import { describe, expect, it } from "vitest";

import {
  FAGULHAS_POR_FAISCA,
  FAIS_SCALE,
  faiscaToBrlMicros,
  formatBrlMicros,
  formatFaisca,
  parseBrlInput,
  parseFaiscaInput,
  partesFaisca,
} from "./faisca";

describe("faísca fracionada", () => {
  it("50 faíscas inteiras aparecem como 50 (sem fagulhas desnecessárias)", () => {
    expect(formatFaisca(50 * FAIS_SCALE)).toBe("50 faíscas");
  });

  it("quebra o decimal em faíscas e fagulhas, com a unidade de cada parte", () => {
    expect(formatFaisca(101_830)).toBe("101 faíscas 830 fagulhas");
    expect(formatFaisca(1_500)).toBe("1 faísca 500 fagulhas");
  });

  it("usa separador de milhar pt-BR em cada parte", () => {
    expect(formatFaisca(1_234_500)).toBe("1.234 faíscas 500 fagulhas");
    expect(formatFaisca(999_000)).toBe("999 faíscas");
  });

  it("mostra só fagulhas quando não chega a uma faísca inteira", () => {
    expect(formatFaisca(1)).toBe("1 fagulha");
    expect(formatFaisca(830)).toBe("830 fagulhas");
  });

  it("mantém o sinal do extrato só na parte inteira", () => {
    expect(formatFaisca(-101_830)).toBe("-101 faíscas 830 fagulhas");
    expect(formatFaisca(-2 * FAIS_SCALE)).toBe("-2 faíscas");
  });

  it("separa as duas partes sem perder o resto", () => {
    expect(partesFaisca(101_830)).toEqual({ faiscas: 101, fagulhas: 830 });
    expect(partesFaisca(2 * FAIS_SCALE)).toEqual({ faiscas: 2, fagulhas: 0 });
    expect(partesFaisca(-1_001)).toEqual({ faiscas: -1, fagulhas: 1 });
  });

  it("mil fagulhas formam uma faísca", () => {
    expect(FAGULHAS_POR_FAISCA).toBe(FAIS_SCALE);
    expect(formatFaisca(FAGULHAS_POR_FAISCA)).toBe("1 faísca");
  });

  it("não quebra com valor que não é número", () => {
    expect(formatFaisca(Number.NaN)).toBe("0 faíscas");
  });

  it("converte pela cotação precisa em micro-reais", () => {
    // 100 faíscas a 1 centavo (10.000 µ) = R$ 1,00
    expect(formatBrlMicros(faiscaToBrlMicros(100 * FAIS_SCALE, 10_000))).toBe("R$\u00A01,00");
    // 100 faíscas a 1,02 centavo (10.200 µ) = R$ 1,02
    expect(formatBrlMicros(faiscaToBrlMicros(100 * FAIS_SCALE, 10_200))).toBe("R$\u00A01,02");
    // 50 faíscas a 0,5 centavo (5.000 µ) = R$ 0,25
    expect(formatBrlMicros(faiscaToBrlMicros(50 * FAIS_SCALE, 5_000))).toBe("R$\u00A00,25");
  });

  it("lê o que a pessoa digita como faísca inteira e fagulhas", () => {
    expect(parseFaiscaInput("50")).toBe(50_000);
    expect(parseFaiscaInput("50,5")).toBe(50_500);
    expect(parseFaiscaInput("1.234,56")).toBe(1_234_560);
    expect(parseFaiscaInput("50.5")).toBe(50_500);
  });

  it("lê dinheiro em reais inteiros, sem confundir com milésimos de faísca", () => {
    // O freela em dinheiro guarda R$ inteiro; a faísca guarda milésimo. Mesmo texto, números
    // diferentes — trocar os dois inflava o valor em 1.000×.
    expect(parseFaiscaInput("1500")).toBe(1_500_000);
    expect(parseBrlInput("1500")).toBe(1_500);
    expect(parseBrlInput("R$ 1.500")).toBe(1_500);
    expect(parseBrlInput("2.000,50")).toBe(2_001);
    expect(parseBrlInput("  ")).toBeNull();
    expect(parseBrlInput("0")).toBeNull();
    expect(parseBrlInput("abc")).toBeNull();
  });
});
