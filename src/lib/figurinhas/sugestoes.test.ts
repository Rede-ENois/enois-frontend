import { describe, expect, it, vi } from "vitest";

import { teclasDoMenuDeFigurinhas } from "./sugestoes";

/** As teclas do menu do `:`: o campo do DS só sabe se a tecla foi usada, não o que ela faz. */
describe("teclasDoMenuDeFigurinhas", () => {
  const teclas = (destaque: number) => {
    const onDestacar = vi.fn();
    const onEscolher = vi.fn();
    const onFechar = vi.fn();
    const responder = teclasDoMenuDeFigurinhas({
      opcoes: [{ code: "a" }, { code: "b" }, { code: "c" }],
      destaque,
      onDestacar,
      onEscolher,
      onFechar,
    });
    return { responder, onDestacar, onEscolher, onFechar };
  };

  it("anda para baixo e volta do fim para o começo", () => {
    const baixo = teclas(0);
    expect(baixo.responder({ key: "ArrowDown" } as KeyboardEvent)).toBe(true);
    expect(baixo.onDestacar).toHaveBeenCalledWith(1);

    const cima = teclas(2);
    expect(cima.responder({ key: "ArrowDown" } as KeyboardEvent)).toBe(true);
    expect(cima.onDestacar).toHaveBeenCalledWith(0);

    const volta = teclas(0);
    expect(volta.responder({ key: "ArrowUp" } as KeyboardEvent)).toBe(true);
    expect(volta.onDestacar).toHaveBeenCalledWith(2);
  });

  it("Enter e Tab escolhem o destacado; Esc fecha", () => {
    const enter = teclas(1);
    enter.responder({ key: "Enter" } as KeyboardEvent);
    expect(enter.onEscolher).toHaveBeenCalledWith("b");
    expect(enter.onDestacar).not.toHaveBeenCalled();

    const tab = teclas(0);
    tab.responder({ key: "Tab" } as KeyboardEvent);
    expect(tab.onEscolher).toHaveBeenCalledWith("a");

    const esc = teclas(0);
    esc.responder({ key: "Escape" } as KeyboardEvent);
    expect(esc.onFechar).toHaveBeenCalled();
  });

  it("deixa passar tecla que não é do menu e não age sem opções", () => {
    const digitando = teclas(0);
    expect(digitando.responder({ key: "a" } as KeyboardEvent)).toBe(false);
    expect(digitando.onEscolher).not.toHaveBeenCalled();

    const vazio = teclasDoMenuDeFigurinhas({
      opcoes: [],
      destaque: 0,
      onDestacar: vi.fn(),
      onEscolher: vi.fn(),
      onFechar: vi.fn(),
    });
    expect(vazio({ key: "Enter" } as KeyboardEvent)).toBe(false);
  });
});
