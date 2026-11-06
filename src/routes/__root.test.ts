import { describe, expect, it } from "vitest";

import { Route } from "./__root";

/**
 * O head do app é a única fonte dos ícones da aba: se uma declaração de `icon` apontar para um
 * arquivo que não existe em `public/`, o navegador troca o joinha pelo ícone padrão sem nenhum
 * erro visível. Estes testes fixam o contrato que o HTML servido já cumpre.
 */
async function icones() {
  const head = await Route.options.head?.({} as never);
  const links = (head?.links ?? []).filter((link) => link?.rel === "icon");
  return links.filter((link) => link !== undefined);
}

describe("head do app — ícones da aba", () => {
  it("declara só o vetor com o ladrilho e o .ico", async () => {
    expect((await icones()).map((link) => link.href)).toEqual(["/favicon.svg", "/favicon.ico"]);
  });

  /**
   * `sizes="any"` diz "escalável, sem tamanho fixo" e é falso para um contêiner .ico: o navegador
   * passa a baixá-lo para qualquer slot ou descarta a declaração.
   */
  it("declara todos os tamanhos que o contêiner .ico tem de verdade", async () => {
    const ico = (await icones()).find((link) => link.href === "/favicon.ico");
    expect(ico?.sizes).toBe("16x16 32x32 48x48 64x64");
    expect(ico?.type).toBe("image/x-icon");
  });
});
