import { describe, expect, it } from "vitest";

import { EMOTES_POR_PAGINA, emotePage } from "./pagination";

const lista = Array.from({ length: 78 }, (_, indice) => `emote-${indice}`);

describe("emotePage", () => {
  it("corta a coleção em páginas do tamanho configurado", () => {
    const primeira = emotePage(lista, 1);
    const segunda = emotePage(lista, 2);

    expect(primeira.items).toHaveLength(EMOTES_POR_PAGINA);
    expect(primeira.items[0]).toBe("emote-0");
    expect(segunda.items).toHaveLength(78 - EMOTES_POR_PAGINA);
    expect(segunda.totalPages).toBe(2);
  });

  it("prende a página pedida ao intervalo que existe", () => {
    expect(emotePage(lista, 0).page).toBe(1);
    expect(emotePage(lista, -3).page).toBe(1);
    expect(emotePage(lista, Number.NaN).page).toBe(1);
    expect(emotePage(lista, 99).page).toBe(2);
    expect(emotePage(lista, 99).items[0]).toBe(`emote-${EMOTES_POR_PAGINA}`);
  });

  it("coleção vazia continua com uma página vazia", () => {
    expect(emotePage([], 1)).toEqual({ items: [], page: 1, totalPages: 1 });
  });

  it("coleção que cabe em uma página não ganha paginação", () => {
    const poucos = lista.slice(0, 5);

    expect(emotePage(poucos, 2)).toEqual({ items: poucos, page: 1, totalPages: 1 });
  });
});
