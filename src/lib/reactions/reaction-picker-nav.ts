import { useEffect } from "react";

const NAV_ATTR = "data-reaction-nav-bar";

function createNavButton(direction: "prev" | "next", label: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("data-reaction-nav", direction);
  button.setAttribute("aria-label", label);
  button.title = label;
  button.textContent = direction === "prev" ? "‹" : "›";
  return button;
}

function updateNavButtons(grid: HTMLElement, prev: HTMLButtonElement, next: HTMLButtonElement) {
  const maxScroll = Math.max(0, grid.scrollWidth - grid.clientWidth);
  prev.disabled = grid.scrollLeft <= 2;
  next.disabled = maxScroll <= 2 || grid.scrollLeft >= maxScroll - 2;
}

export function attachReactionPickerNav(root: ParentNode = document): void {
  const popovers = root.querySelectorAll<HTMLElement>("[data-radix-popper-content-wrapper] > div");
  for (const popover of popovers) {
    const grid = popover.querySelector<HTMLElement>("div.grid.grid-cols-6");
    if (!grid) continue;
    const isExpanded =
      grid.querySelector("[data-reaction-emoji]") !== null &&
      grid.querySelector('button[title="+"]') === null;
    if (!isExpanded || popover.querySelector(`[${NAV_ATTR}]`)) continue;

    const bar = document.createElement("div");
    bar.setAttribute(NAV_ATTR, "true");

    const prev = createNavButton("prev", "Reações anteriores");
    const next = createNavButton("next", "Próximas reações");

    const step = () => Math.max(180, Math.floor(grid.clientWidth * 0.85));
    prev.addEventListener("click", () => {
      grid.scrollBy({ left: -step(), behavior: "smooth" });
    });
    next.addEventListener("click", () => {
      grid.scrollBy({ left: step(), behavior: "smooth" });
    });
    grid.addEventListener("scroll", () => updateNavButtons(grid, prev, next), { passive: true });

    bar.append(prev, next);
    popover.append(bar);
    updateNavButtons(grid, prev, next);
  }
}

export function useReactionPickerNav(): void {
  useEffect(() => {
    if (typeof document === "undefined" || typeof MutationObserver === "undefined") return;
    attachReactionPickerNav(document);
    const observer = new MutationObserver(() => attachReactionPickerNav(document));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
}
