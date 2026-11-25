import { describe, expect, it } from "vitest";

import { isProtectedPath, shouldLeaveLanding } from "./require-auth";

describe("shouldLeaveLanding", () => {
  it("manda quem tem sessão da landing para o feed", () => {
    expect(shouldLeaveLanding("/", true, false)).toBe(true);
  });

  it("deixa a landing para o visitante", () => {
    expect(shouldLeaveLanding("/", false, false)).toBe(false);
  });

  it("não desvia quando há um destino de push pendente na query", () => {
    expect(shouldLeaveLanding("/", true, true)).toBe(false);
  });

  it("não mexe em nenhuma outra rota", () => {
    expect(shouldLeaveLanding("/feed", true, false)).toBe(false);
    expect(shouldLeaveLanding("/perfil/enois", true, false)).toBe(false);
  });
});

describe("isProtectedPath", () => {
  it("leva o catálogo de figurinhas ao login, porque a API exige sessão para listar", () => {
    expect(isProtectedPath("/figurinhas")).toBe(true);
  });

  it("não confunde o catálogo com outro caminho que começa igual", () => {
    expect(isProtectedPath("/figurinhas-antigas")).toBe(false);
  });
});
