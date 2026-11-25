import { describe, expect, it } from "vitest";

import { codigosNoTexto, consultaDeFigurinha, inserirFigurinha } from "./autocomplete";

/**
 * O `:palavra` do compositor. O que importa é o recorte: o campo do DS devolve onde o termo começa e
 * acaba, e o texto só é trocado se o trecho continuar igual ao escolhido.
 */
describe("consultaDeFigurinha", () => {
  it("abre no `:` no começo de uma palavra", () => {
    expect(consultaDeFigurinha("oi :kek", 7)).toEqual({ start: 3, end: 7, query: "kek" });
    expect(consultaDeFigurinha(":", 1)).toEqual({ start: 0, end: 1, query: "" });
    expect(consultaDeFigurinha("(vê :eno", 8)).toEqual({ start: 4, end: 8, query: "eno" });
  });

  it("não abre depois de letra, no meio de horário nem em `:Código:` fechado", () => {
    expect(consultaDeFigurinha("12:30", 5)).toBeNull();
    expect(consultaDeFigurinha("link:http", 10)).toBeNull();
    expect(consultaDeFigurinha(":kekw:", 6)).toBeNull();
  });

  it("devolve o termo em minúsculas", () => {
    expect(consultaDeFigurinha(":KEK", 4)?.query).toBe("kek");
  });
});

describe("inserirFigurinha", () => {
  it("troca `:termo` por `:codigo:` e deixa o cursor depois", () => {
    const consulta = consultaDeFigurinha("oi :kek tudo", 7);
    expect(consulta).not.toBeNull();
    const trocado = inserirFigurinha("oi :kek tudo", consulta!, "kekw");
    expect(trocado.texto).toBe("oi :kekw: tudo");
    expect(trocado.cursor).toBe("oi :kekw:".length);
  });

  it("não come dois-pontos sobrando do código", () => {
    const consulta = consultaDeFigurinha(":ke", 3)!;
    expect(inserirFigurinha(":ke", consulta, ":kekw:").texto).toBe(":kekw:");
  });
});

describe("codigosNoTexto", () => {
  it("lista sem repetir, em ordem, e ignora o que não é código", () => {
    expect(codigosNoTexto(":valeu: :valeu: 12:30 `:fora:` :neymar_jr:")).toEqual([
      "valeu",
      "neymar_jr",
    ]);
  });
});
