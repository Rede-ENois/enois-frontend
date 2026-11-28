import { useEffect } from "react";

const NAV_ATTR = "data-reaction-nav-bar";

/** A coluna de cada casa do painel: é ela que faz a grade rolar de lado, sem furo na fileira de cima. */
export const COLUNA_ATTR = "data-reaction-coluna";

export const LINHAS_POR_PAGINA = 3;

/** A casa de uma favorita no painel do "+": o CSS a destaca e a tira de dentro da coluna dela. */
export const FAVORITA_ATTR = "data-reaction-favorita-grade";

/**
 * A grade do "+" com as casas nas colunas delas, três por coluna, e o `order` que a fileira de
 * favoritas pede.
 *
 * A grade rola de lado (`grid-auto-flow: column`) e quebra as casas em três por coluna pela ordem
 * do DOM: sem a coluna, uma favorita levada para o começo — com `order` menor — empurrava a casa
 * de baixo dela para um vão de linha vazio e deixava furos na fileira de cima. Com a coluna, o
 * `order` só reordena as colunas, e cada coluna mostra as suas três casas.
 */
export function posicionarColunas(grade: HTMLElement, fileira: readonly string[] = []): void {
  const posicao = new Map(fileira.map((tipo, i) => [tipo, i]));
  // No markup do app a marca está no `<span>` dentro do botão; no do design system, no botão.
  const marca = (el: Element | null): Element | null =>
    el?.matches("[data-reaction-emoji]")
      ? el
      : (el?.querySelector("[data-reaction-emoji]") ?? null);
  const tipoDaCasa = (casa: Element) => marca(casa)?.getAttribute("data-reaction-emoji") ?? "";
  const colunas = new Map<HTMLElement, number>();
  let n = 0;
  for (const casa of grade.children) {
    if (!marca(casa)) continue;
    colunas.set(casa as HTMLElement, Math.floor(n / LINHAS_POR_PAGINA));
    n += 1;
  }
  // As colunas com favorita abrem a grade, cada uma na ordem da favorita mais alta dela; as outras
  // ficam depois, na ordem do DOM. A favorita que não é uma das três primeiras casas da coluna é
  // levada para a fileira de cima pelo CSS (ela sai da coluna e as seguintes se fecham).
  const ordemPorColuna = new Map<number, number>();
  for (const [casa, coluna] of colunas) {
    const indice = posicao.get(tipoDaCasa(casa));
    if (indice === undefined) continue;
    const daColuna = ordemPorColuna.get(coluna) ?? Infinity;
    if (indice < daColuna) ordemPorColuna.set(coluna, indice);
  }
  let depois = fileira.length;
  for (const coluna of [...new Set(colunas.values())].sort((a, b) => a - b)) {
    if (!ordemPorColuna.has(coluna)) ordemPorColuna.set(coluna, depois++);
  }
  for (const [casa, coluna] of colunas) {
    const ordem = ordemPorColuna.get(coluna);
    casa.setAttribute(COLUNA_ATTR, String(coluna));
    if (ordem === undefined) casa.style.removeProperty("order");
    else casa.style.setProperty("order", String(ordem));
    const destaque = posicao.has(tipoDaCasa(casa));
    if (destaque) casa.setAttribute(FAVORITA_ATTR, "sim");
    else casa.removeAttribute(FAVORITA_ATTR);
  }
}

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

    const hint = document.createElement("span");
    hint.setAttribute("data-reaction-nav-hint", "true");
    hint.setAttribute("aria-hidden", "true");
    hint.textContent = "Mais reações";

    const actions = document.createElement("div");
    actions.setAttribute("data-reaction-nav-actions", "true");

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

    actions.append(prev, next);
    bar.append(hint, actions);
    popover.append(bar);
    updateNavButtons(grid, prev, next);
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => updateNavButtons(grid, prev, next));
    }
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
