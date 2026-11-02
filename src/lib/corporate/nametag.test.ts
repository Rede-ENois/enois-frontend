import { describe, expect, it } from "vitest";

import { isValidNametag, nametagPath, normalizeNametag } from "./nametag";

describe("nametag do perfil profissional", () => {
  it("normaliza para minúsculas e sem espaços nas pontas", () => {
    expect(normalizeNametag("  MelSantos ")).toBe("melsantos");
  });

  it("aceita letras, números, ponto, hífen e underline", () => {
    expect(isValidNametag("melsantos")).toBe(true);
    expect(isValidNametag("mel.santos")).toBe(true);
    expect(isValidNametag("mel-santos")).toBe(true);
    expect(isValidNametag("mel_santos")).toBe(true);
    expect(isValidNametag("MelSantos")).toBe(true);
  });

  it("recusa o que o backend recusaria", () => {
    expect(isValidNametag("ab")).toBe(false);
    expect(isValidNametag("mel santos")).toBe(false);
    expect(isValidNametag(".melsantos")).toBe(false);
    expect(isValidNametag("melsantos.")).toBe(false);
    expect(isValidNametag("melsantos!")).toBe(false);
    expect(isValidNametag("a".repeat(31))).toBe(false);
  });

  it("monta o caminho público", () => {
    expect(nametagPath(" MelSantos ")).toBe("/profissional/melsantos");
  });
});
