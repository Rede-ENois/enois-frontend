// @vitest-environment jsdom
import { useReacoesFavoritasStore } from "@/stores/reacoes-favoritas.store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FAVORITAS_PADRAO } from "./favoritas";
import { attachReactionFavorites } from "./reaction-picker-favorites";

const TIPOS = ["LIKE", "HEART_PURPLE", "LOVE", "LAUGH", "ROFL", "SKULL", "WOW", "SAD"];

function montarSeletor(expandido: boolean): { popover: HTMLElement; grade: HTMLElement } {
  const wrapper = document.createElement("div");
  wrapper.setAttribute("data-radix-popper-content-wrapper", "");
  const popover = document.createElement("div");
  const grade = document.createElement("div");
  grade.className = "grid grid-cols-6";
  for (const tipo of TIPOS) {
    const botao = document.createElement("button");
    const emoji = document.createElement("span");
    emoji.setAttribute("data-reaction-emoji", tipo);
    emoji.textContent = `emoji-${tipo}`;
    botao.append(emoji);
    botao.title = tipo;
    grade.append(botao);
  }
  if (!expandido) {
    const mais = document.createElement("button");
    mais.title = "+";
    grade.append(mais);
  }
  popover.append(grade);
  wrapper.append(popover);
  document.body.append(wrapper);
  return { popover, grade };
}

function marcadas(grade: HTMLElement): string[] {
  return [...grade.querySelectorAll<HTMLElement>('[data-filled="sim"]')].map(
    (el) => el.getAttribute("data-reaction-emoji") ?? "",
  );
}

function fileiraDoModal(popover: HTMLElement): string[] {
  return [...popover.querySelectorAll<HTMLElement>("[data-reaction-favorita]")].map(
    (el) => el.getAttribute("data-reaction-favorita") ?? "",
  );
}

describe("attachReactionFavorites", () => {
  beforeEach(() => {
    useReacoesFavoritasStore.setState({ favoritas: [...FAVORITAS_PADRAO], escolheu: false });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("sem escolha, deixa o compacto do design system como está", () => {
    const { popover, grade } = montarSeletor(false);
    attachReactionFavorites(document);
    expect(marcadas(grade)).toEqual([]);
    expect(popover.hasAttribute("data-reaction-favoritas-fileira")).toBe(false);
  });

  it("no compacto, põe só as favoritas nas primeiras casas, na ordem da escolha", () => {
    useReacoesFavoritasStore.setState({ favoritas: ["LAUGH", "LIKE"], escolheu: true });
    const { popover, grade } = montarSeletor(false);
    attachReactionFavorites(document);
    expect(popover.getAttribute("data-reaction-favoritas-fileira")).toBe("sim");
    expect(marcadas(grade)).toEqual(["LIKE", "LAUGH"]);
    const risos = grade.querySelector<HTMLElement>('[data-reaction-emoji="LAUGH"]');
    expect(risos?.style.getPropertyValue("order")).toBe("0");
  });

  it('fileira vazia esconde todas as reações do compacto e deixa o "+" — que reabre a lista', () => {
    useReacoesFavoritasStore.setState({ favoritas: [], escolheu: true });
    const { popover, grade } = montarSeletor(false);
    attachReactionFavorites(document);
    expect(popover.getAttribute("data-reaction-favoritas-fileira")).toBe("sim");
    expect(marcadas(grade)).toEqual([]);
    expect(grade.querySelector('button[title="+"]')).not.toBeNull();
  });

  it("no modal, monta a barra da fileira com estrela e setas", () => {
    useReacoesFavoritasStore.setState({ favoritas: ["LIKE", "LAUGH", "LOVE"], escolheu: true });
    const { popover } = montarSeletor(true);
    attachReactionFavorites(document);
    const barra = popover.querySelector("[data-reaction-favoritas]");
    expect(barra).not.toBeNull();
    expect(fileiraDoModal(popover)).toEqual(["LIKE", "LAUGH", "LOVE"]);
    expect(barra?.querySelector("[data-reaction-favoritas-contagem]")?.textContent).toBe("3/5");
    const primeira = barra?.querySelector<HTMLElement>('[data-reaction-favorita="LIKE"]');
    expect(
      primeira?.querySelector<HTMLButtonElement>('button[aria-label="Mover para a esquerda"]')
        ?.disabled,
    ).toBe(true);
    expect(barra?.querySelector("[data-reaction-favoritas-vazio]")?.hasAttribute("hidden")).toBe(
      true,
    );
  });

  it("a estrela tira da fileira e a seta troca a ordem", () => {
    useReacoesFavoritasStore.setState({ favoritas: ["LIKE", "LAUGH"], escolheu: true });
    const { popover } = montarSeletor(true);
    attachReactionFavorites(document);
    popover
      .querySelector<HTMLElement>(
        '[data-reaction-favorita="LAUGH"] button[aria-label="Mover para a esquerda"]',
      )
      ?.click();
    expect(useReacoesFavoritasStore.getState().favoritas).toEqual(["LAUGH", "LIKE"]);
    attachReactionFavorites(document);
    popover
      .querySelector<HTMLElement>(
        '[data-reaction-favorita="LAUGH"] button[aria-label="Tirar dos favoritos"]',
      )
      ?.click();
    expect(useReacoesFavoritasStore.getState().favoritas).toEqual(["LIKE"]);
    attachReactionFavorites(document);
    expect(fileiraDoModal(popover)).toEqual(["LIKE"]);
  });

  it("no modal, marca a grade com quem é favorita", () => {
    useReacoesFavoritasStore.setState({ favoritas: ["LIKE"], escolheu: true });
    const { grade } = montarSeletor(true);
    attachReactionFavorites(document);
    expect(grade.querySelector('[data-reaction-emoji="LIKE"]')?.getAttribute("data-favorita")).toBe(
      "sim",
    );
    expect(grade.querySelector('[data-reaction-emoji="LOVE"]')?.getAttribute("data-favorita")).toBe(
      "nao",
    );
  });
});
