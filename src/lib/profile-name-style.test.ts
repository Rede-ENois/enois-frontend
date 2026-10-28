import { describe, expect, it } from "vitest";

import { authorNameStyle } from "./profile-name-style";

describe("estilo do nome a partir do perfil", () => {
  it("leva a plaquinha equipada junto com tema, fonte e cor", () => {
    expect(authorNameStyle({ nameTheme: "NEON", nameplate: "placa-mata" })).toEqual({
      theme: "NEON",
      font: undefined,
      color: undefined,
      nameplate: "placa-mata",
    });
  });

  it("só a plaquinha já é personalização; perfil sem nada não manda estilo", () => {
    expect(authorNameStyle({ nameplate: "placa-mata" })?.nameplate).toBe("placa-mata");
    expect(authorNameStyle({})).toBeNull();
    expect(authorNameStyle(null)).toBeNull();
  });
});
