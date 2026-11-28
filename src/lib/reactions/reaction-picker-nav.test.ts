// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { attachReactionPickerNav, posicionarColunas } from "./reaction-picker-nav";

describe("attachReactionPickerNav", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("adiciona setas e indicação de mais reações apenas quando o seletor está expandido", () => {
    const wrapper = document.createElement("div");
    wrapper.setAttribute("data-radix-popper-content-wrapper", "");
    const popover = document.createElement("div");
    const grid = document.createElement("div");
    grid.className = "grid grid-cols-6";

    const emojiBtn = document.createElement("button");
    emojiBtn.setAttribute("data-reaction-emoji", "LIKE");
    const plusBtn = document.createElement("button");
    plusBtn.title = "+";
    grid.append(emojiBtn, plusBtn);
    popover.append(grid);
    wrapper.append(popover);
    document.body.append(wrapper);

    // Recolhido (+ presente): não deve adicionar setas.
    attachReactionPickerNav(document);
    expect(popover.querySelector("[data-reaction-nav-bar]")).toBeNull();

    // Expandido (+ removido): deve adicionar indicação + setas acessíveis e rolar ao clicar.
    plusBtn.remove();
    Object.defineProperty(grid, "clientWidth", { value: 240, configurable: true });
    Object.defineProperty(grid, "scrollWidth", { value: 720, configurable: true });
    const scrollBy = vi.fn();
    grid.scrollBy = scrollBy;

    attachReactionPickerNav(document);
    const hint = popover.querySelector<HTMLElement>("[data-reaction-nav-hint]");
    const prev = popover.querySelector<HTMLButtonElement>('[data-reaction-nav="prev"]');
    const next = popover.querySelector<HTMLButtonElement>('[data-reaction-nav="next"]');
    expect(hint?.textContent).toBe("Mais reações");
    expect(hint?.getAttribute("aria-hidden")).toBe("true");
    expect(prev).not.toBeNull();
    expect(next).not.toBeNull();
    expect(prev?.getAttribute("aria-label")).toBe("Reações anteriores");
    expect(next?.getAttribute("aria-label")).toBe("Próximas reações");
    expect(prev?.disabled).toBe(true);
    expect(next?.disabled).toBe(false);

    next?.click();
    expect(scrollBy).toHaveBeenCalledWith({ left: 204, behavior: "smooth" });

    // Ao rolar para o meio, ambas as setas ficam habilitadas; clicar em prev rola para trás.
    Object.defineProperty(grid, "scrollLeft", { value: 240, configurable: true });
    grid.dispatchEvent(new Event("scroll"));
    expect(prev?.disabled).toBe(false);
    expect(next?.disabled).toBe(false);

    prev?.click();
    expect(scrollBy).toHaveBeenCalledWith({ left: -204, behavior: "smooth" });

    // Ao chegar no fim, next desabilita e prev continua habilitado.
    Object.defineProperty(grid, "scrollLeft", { value: 480, configurable: true });
    grid.dispatchEvent(new Event("scroll"));
    expect(prev?.disabled).toBe(false);
    expect(next?.disabled).toBe(true);
  });

  it("mantém a barra visível, com foco e alvo tátil adequado no mobile", () => {
    const css = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");
    expect(css).toMatch(
      /\[data-reaction-nav-bar\]\s*\{[^}]*display:\s*flex[^}]*justify-content:\s*space-between/s,
    );
    expect(css).toMatch(/\[data-reaction-nav\]:focus-visible\s*\{[^}]*outline:/s);
    expect(css).toMatch(
      /@media\s*\(hover:\s*none\)\s*and\s*\(pointer:\s*coarse\)\s*\{[^}]*\[data-reaction-nav\]\s*\{[^}]*min-width:\s*2\.5rem;\s*min-height:\s*2\.5rem;/s,
    );
    expect(css).not.toMatch(
      /@media\s*\(hover:\s*none\)\s*and\s*\(pointer:\s*coarse\)\s*\{[^}]*\[data-reaction-nav-bar\]\s*\{\s*display:\s*none/s,
    );
  });

  it("põe cada casa na coluna dela, três por coluna, e a favorita puxa a coluna para a frente", () => {
    const grade = document.createElement("div");
    grade.className = "grid grid-cols-6";
    const tipos = ["LIKE", "HEART_PURPLE", "LOVE", "LAUGH", "ROFL", "SKULL", "WOW", "SAD"];
    for (const tipo of tipos) {
      // No markup do app a marca está no `<span>` dentro da casa, com a contagem.
      const casa = document.createElement("button");
      const figura = document.createElement("span");
      figura.setAttribute("data-reaction-emoji", tipo);
      casa.append(figura, document.createElement("span"));
      grade.append(casa);
    }
    document.body.append(grade);

    posicionarColunas(grade, ["LIKE", "HEART_PURPLE", "WOW"]);
    const coluna = (el: Element) => el.getAttribute("data-reaction-coluna");
    const ordem = (el: Element) => (el as HTMLElement).style.order;
    const casas = [...grade.children];
    expect(casas.map(coluna)).toEqual(["0", "0", "0", "1", "1", "1", "2", "2"]);
    // LIKE e HEART_PURPLE já estão na fileira de cima da coluna delas: só a coluna muda de lugar.
    expect(casas.map(ordem)).toEqual(["0", "0", "0", "3", "3", "3", "2", "2"]);
    expect(casas[6]?.getAttribute("data-reaction-favorita-grade")).toBe("sim");
    expect(casas[4]?.hasAttribute("data-reaction-favorita-grade")).toBe(false);
  });

  it("a favorita da fileira de baixo sobe para a fileira de cima no painel do +", () => {
    const css = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");
    // A coluna é do JS (`grid-auto-flow: column`); a favorita sai da coluna pela fileira.
    expect(css).toMatch(
      /grid-auto-flow:\s*column\s*!important;[^}]*grid-template-rows:\s*repeat\(3,/s,
    );
    expect(css).toMatch(
      />\s*\[data-reaction-favorita-grade="sim"\]\s*\{[^}]*grid-row:\s*1\s*!important;/s,
    );
  });
});
