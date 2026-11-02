// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";

import {
  LITE_PAGE_MAX,
  liteInterval,
  litePageSize,
  prefersReducedMotion,
  readCardTilt,
  readForceMotion,
  readLiteMode,
  subscribeLiteFlags,
  writeCardTilt,
  writeForceMotion,
  writeLiteMode,
} from "./lite-mode";

describe("modo lite", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("páginas maiores (com teto) e recargas mais espaçadas só em modo lite", () => {
    expect(litePageSize(20, false)).toBe(20);
    expect(litePageSize(20, true)).toBe(60);
    // O teto protege o backend das listas já grandes (mensagens pedem 50 por página).
    expect(litePageSize(50, true)).toBe(LITE_PAGE_MAX);
    expect(litePageSize(80, true)).toBe(LITE_PAGE_MAX);

    expect(liteInterval(15_000, false)).toBe(15_000);
    expect(liteInterval(15_000, true)).toBe(60_000);
  });

  it("a escolha fica no aparelho e avisa quem está ouvindo", () => {
    let avisos = 0;
    const stop = subscribeLiteFlags(() => {
      avisos += 1;
    });

    expect(readLiteMode()).toBe(false);
    writeLiteMode(true);
    expect(readLiteMode()).toBe(true);
    expect(avisos).toBe(1);

    writeForceMotion(true);
    expect(readForceMotion()).toBe(true);
    expect(avisos).toBe(2);

    stop();
    writeLiteMode(false);
    expect(avisos).toBe(2);
  });

  it("o efeito 3D do cartão vem ligado e só desliga por escolha do aparelho", () => {
    let avisos = 0;
    const stop = subscribeLiteFlags(() => {
      avisos += 1;
    });

    expect(readCardTilt()).toBe(true);
    writeCardTilt(false);
    expect(readCardTilt()).toBe(false);
    expect(avisos).toBe(1);

    writeCardTilt(true);
    expect(readCardTilt()).toBe(true);
    stop();
  });

  it("sem suporte a matchMedia o aparelho não pede menos movimento", () => {
    // O jsdom não implementa matchMedia: o caso é justamente o fallback.
    expect(prefersReducedMotion()).toBe(false);
  });
});
