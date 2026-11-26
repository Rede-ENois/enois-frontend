import { describe, expect, it } from "vitest";

import { imagemDoIndice, origemDoCodigo, origemReservada } from "./figurinha-origem";

/** A origem de um código decide qual catálogo responde — as duas nunca se cruzam. */
describe("origemDoCodigo", () => {
  it("separa o pacote oficial do que é da comunidade", () => {
    expect(origemDoCodigo("enois_like")).toBe("ENOIS");
    expect(origemDoCodigo("bttv_alanzoka")).toBe("BTTV");
    expect(origemDoCodigo("ffz_forsen")).toBe("FFZ");
    expect(origemDoCodigo("valeu")).toBe("COMUNIDADE");
    expect(origemDoCodigo("enois")).toBe("COMUNIDADE");
  });

  it("lista os prefixos reservados", () => {
    expect(origemReservada("ffz_x")).toBe("ffz_");
    expect(origemReservada("x")).toBeNull();
  });

  it("passa o endereço público do índice intacto", () => {
    expect(imagemDoIndice("/emojis/enois/like.png")).toBe("/emojis/enois/like.png");
    expect(imagemDoIndice("https://cdn.example/fig.png")).toBe("https://cdn.example/fig.png");
  });
});
