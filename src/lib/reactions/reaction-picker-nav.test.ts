// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { attachReactionPickerNav } from "./reaction-picker-nav";

describe("attachReactionPickerNav", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("adiciona setas de paginação apenas quando o seletor de reações está expandido", () => {
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

    // Expandido (+ removido): deve adicionar setas acessíveis e rolar ao clicar.
    plusBtn.remove();
    Object.defineProperty(grid, "clientWidth", { value: 240, configurable: true });
    Object.defineProperty(grid, "scrollWidth", { value: 720, configurable: true });
    const scrollBy = vi.fn();
    grid.scrollBy = scrollBy;

    attachReactionPickerNav(document);
    const prev = popover.querySelector<HTMLButtonElement>('[data-reaction-nav="prev"]');
    const next = popover.querySelector<HTMLButtonElement>('[data-reaction-nav="next"]');
    expect(prev).not.toBeNull();
    expect(next).not.toBeNull();
    expect(prev?.disabled).toBe(true);
    expect(next?.disabled).toBe(false);

    next?.click();
    expect(scrollBy).toHaveBeenCalledWith({ left: 204, behavior: "smooth" });
  });
});
