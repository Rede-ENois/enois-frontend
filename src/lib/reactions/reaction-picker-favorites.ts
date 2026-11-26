import { useEffect } from "react";

import { REACTION_PICKER_ORDER } from "@/constants/reaction-emojis";
import {
  hidratarReacoesFavoritas,
  useReacoesFavoritasStore,
} from "@/stores/reacoes-favoritas.store";

import { FAVORITAS_MAX, FAVORITAS_PADRAO, fileiraDaEscolha } from "@/lib/reactions/favoritas";

/**
 * Põe a fileira de reações favoritas da pessoa no seletor.
 *
 * O seletor é do design system e desenha todas as reações: o compacto mostra as seis primeiras e um
 * "+", e o modal aberto pelo "+" mostra todas. Aqui, no DOM:
 *
 * - no compacto, cada reação ganha `data-filled="sim"` se está na fileira; o CSS põe as favoritas
 *   nas primeiras casas e troca pelo `order` (a posição no DOM é do React e não se mexe). Quem
 *   nunca escolheu vê o padrão (joinha e coração roxo); com a fileira vazia fica só o "+", que abre
 *   a lista inteira;
 * - no modal, a lista ganha uma barra no topo: a fileira de agora, com a estrela para tirar e setas
 *   para mudar a ordem; o toque na grade põe (e tira) da fileira.
 */

const ESCOLHA_ATTR = "data-reaction-favoritas";
const TOAST_ATTR = "data-reaction-favoritas-toast";

const ICONE_TRACO =
  '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';

const ICONE = {
  esquerda: `${ICONE_TRACO}<path d="m15 18-6-6 6-6"/></svg>`,
  direita: `${ICONE_TRACO}<path d="m9 18 6-6-6-6"/></svg>`,
  estrelaCheia:
    '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.2l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.4l5.9-.9z"/></svg>',
};

const LABELS = {
  titulo: "Suas reações favoritas",
  vazio: `Toque nas reações da lista para escolher até ${FAVORITAS_MAX} favoritas.`,
  desfavoritar: "Tirar dos favoritos",
  esquerda: "Mover para a esquerda",
  direita: "Mover para a direita",
  salvo: "Reações favoritas salvas",
};

/** A fileira do compacto, ou `null` para deixar o desenho do design system como está. */
function fileiraDoCompacto(favoritas: string[], escolheu: boolean): string[] | null {
  if (escolheu) return favoritas;
  const mesmoPadrao =
    FAVORITAS_PADRAO[0] === REACTION_PICKER_ORDER[0] &&
    FAVORITAS_PADRAO[1] === REACTION_PICKER_ORDER[1];
  return mesmoPadrao ? null : [...FAVORITAS_PADRAO];
}

function marcarCompacto(grade: HTMLElement): void {
  const { favoritas, escolheu } = useReacoesFavoritasStore.getState();
  const fileira = fileiraDoCompacto(favoritas, escolheu);
  const popover = grade.closest<HTMLElement>("[data-radix-popper-content-wrapper] > div");
  const posicao = new Map<string, number>();
  fileira?.forEach((tipo, i) => posicao.set(tipo, i));
  for (const el of grade.querySelectorAll<HTMLElement>("[data-reaction-emoji]")) {
    const tipo = el.getAttribute("data-reaction-emoji") ?? "";
    const ordem = posicao.get(tipo);
    if (ordem === undefined) {
      el.removeAttribute("data-filled");
      el.style.removeProperty("order");
    } else {
      el.setAttribute("data-filled", "sim");
      el.style.setProperty("order", String(ordem));
    }
  }
  if (fileira && popover) popover.setAttribute("data-reaction-favoritas-fileira", "sim");
  else popover?.removeAttribute("data-reaction-favoritas-fileira");
}

function mover(tipo: string, direcao: -1 | 1, fileira: readonly string[]): void {
  const i = fileira.indexOf(tipo);
  const j = i + direcao;
  if (i < 0 || j < 0 || j >= fileira.length) return;
  const proxima = [...fileira];
  [proxima[i], proxima[j]] = [proxima[j], proxima[i]];
  useReacoesFavoritasStore.setState({ favoritas: proxima, escolheu: true });
}

function botaoDeIcone(
  icone: string,
  rotulo: string,
  desabilitado: boolean,
  acao?: () => void,
): HTMLButtonElement {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.innerHTML = icone;
  botao.setAttribute("aria-label", rotulo);
  botao.title = rotulo;
  botao.disabled = desabilitado;
  botao.addEventListener("click", (evento) => {
    evento.stopPropagation();
    acao?.();
  });
  return botao;
}

/** A figurinha da reação como o seletor a desenha: o CSS pinta `[data-reaction-emoji]`. */
function criarIcone(tipo: string, emoji: string): HTMLElement {
  const icone = document.createElement("span");
  icone.className = "h-4";
  icone.setAttribute("data-reaction-emoji", tipo);
  icone.append(emoji);
  return icone;
}

function itemDaFileira(tipo: string, fileira: readonly string[], emoji: string): HTMLElement {
  const item = document.createElement("div");
  item.setAttribute("data-reaction-favorita", tipo);
  const i = fileira.indexOf(tipo);
  item.append(
    botaoDeIcone(ICONE.estrelaCheia, LABELS.desfavoritar, false, () =>
      useReacoesFavoritasStore.getState().alternar(tipo),
    ),
    criarIcone(tipo, emoji),
    botaoDeIcone(ICONE.esquerda, LABELS.esquerda, i <= 0, () => mover(tipo, -1, fileira)),
    botaoDeIcone(ICONE.direita, LABELS.direita, i < 0 || i >= fileira.length - 1, () =>
      mover(tipo, 1, fileira),
    ),
  );
  return item;
}

function montarBarra(grade: HTMLElement): HTMLElement {
  const barra = document.createElement("div");
  barra.setAttribute(ESCOLHA_ATTR, "true");
  const cabecalho = document.createElement("div");
  cabecalho.setAttribute("data-reaction-favoritas-cabecalho", "true");
  const titulo = document.createElement("strong");
  titulo.textContent = LABELS.titulo;
  const contagem = document.createElement("span");
  contagem.setAttribute("data-reaction-favoritas-contagem", "true");
  cabecalho.append(titulo, contagem);
  const fileira = document.createElement("div");
  fileira.setAttribute("data-reaction-favoritas-barra", "true");
  const vazio = document.createElement("p");
  vazio.setAttribute("data-reaction-favoritas-vazio", "true");
  vazio.textContent = LABELS.vazio;
  barra.append(cabecalho, fileira, vazio);
  // Antes da grade: quem escolhe vê a fileira antes de rolar a lista inteira.
  grade.insertAdjacentElement("beforebegin", barra);
  return barra;
}

function marcarExpandido(grade: HTMLElement): void {
  const { favoritas, escolheu } = useReacoesFavoritasStore.getState();
  const elegiveis = [...grade.querySelectorAll<HTMLElement>("[data-reaction-emoji]")].map(
    (el) => el.getAttribute("data-reaction-emoji") ?? "",
  );
  const fileira = fileiraDaEscolha(escolheu ? favoritas : FAVORITAS_PADRAO, elegiveis);

  let barra = grade.parentElement?.querySelector<HTMLElement>(`:scope > [${ESCOLHA_ATTR}]`);
  if (!barra) barra = montarBarra(grade);
  const assinatura = JSON.stringify([fileira, elegiveis.length]);
  if (barra.dataset.assinatura !== assinatura) {
    barra.dataset.assinatura = assinatura;
    const lista = barra.querySelector<HTMLElement>("[data-reaction-favoritas-barra]");
    const vazio = barra.querySelector<HTMLElement>("[data-reaction-favoritas-vazio]");
    const contagem = barra.querySelector<HTMLElement>("[data-reaction-favoritas-contagem]");
    if (contagem) contagem.textContent = `${fileira.length}/${FAVORITAS_MAX}`;
    const novos = fileira.map((tipo) => {
      const emoji = grade.querySelector(`[data-reaction-emoji="${tipo}"]`)?.textContent?.trim();
      return itemDaFileira(tipo, fileira, emoji || tipo);
    });
    // Troca o conteúdo só quando outra coisa o pôs lá (nó novo do React): a barra em si não muda
    // posição no DOM, e trocá-la a cada clique tirava o foco do botão tocado.
    if (!lista || lista.dataset.assinatura !== assinatura) {
      lista?.replaceChildren(...novos);
      if (lista) lista.dataset.assinatura = assinatura;
    }
    if (vazio) vazio.hidden = fileira.length > 0;
  }

  // A grade mostra quais são as favoritas: o CSS põe a estrela no canto de quem não é.
  for (const el of grade.querySelectorAll<HTMLElement>("[data-reaction-emoji]")) {
    const tipo = el.getAttribute("data-reaction-emoji") ?? "";
    el.setAttribute("data-favorita", fileira.includes(tipo) ? "sim" : "nao");
  }
}

function avisar(texto: string): void {
  document.querySelector(`[${TOAST_ATTR}]`)?.remove();
  const aviso = document.createElement("div");
  aviso.setAttribute(TOAST_ATTR, "true");
  aviso.setAttribute("role", "status");
  aviso.textContent = texto;
  document.body.append(aviso);
  setTimeout(() => aviso.remove(), 2200);
}

export function attachReactionFavorites(root: ParentNode = document): void {
  for (const popover of root.querySelectorAll<HTMLElement>(
    "[data-radix-popper-content-wrapper] > div",
  )) {
    const grade = popover.querySelector<HTMLElement>("div.grid.grid-cols-6");
    if (!grade) continue;
    const expandido =
      grade.querySelector("[data-reaction-emoji]") !== null &&
      grade.querySelector('button[title="+"]') === null;
    if (expandido) marcarExpandido(grade);
    else marcarCompacto(grade);
  }
}

const INSTALADO = "data-reaction-favoritas-toque";

/**
 * A grade do modal não tem gancho do React: um `capture` no documento, uma vez, cuida do toque.
 *
 * Reagir e escolher são o mesmo toque — a reação que não está na fileira entra nela (se couber) e a
 * que está volta ao padrão nela, com o próprio seletor fechando em seguida.
 */
function instalarToque(): void {
  if (document.documentElement.hasAttribute(INSTALADO)) return;
  document.documentElement.setAttribute(INSTALADO, "sim");
  document.addEventListener(
    "click",
    (evento) => {
      const alvo = evento.target instanceof Element ? evento.target : null;
      if (!alvo || alvo.closest(`[${ESCOLHA_ATTR}]`)) return;
      const tipo = alvo
        .closest<HTMLElement>("[data-reaction-emoji]")
        ?.getAttribute("data-reaction-emoji");
      const grade = alvo.closest("div.grid.grid-cols-6");
      if (!tipo || !grade || grade.querySelector('button[title="+"]')) return;
      if (!grade.closest("[data-radix-popper-content-wrapper]")) return;
      const { favoritas, escolheu } = useReacoesFavoritasStore.getState();
      const atual = escolheu ? favoritas : [...FAVORITAS_PADRAO];
      if (!atual.includes(tipo) && atual.length >= FAVORITAS_MAX) return;
      useReacoesFavoritasStore.getState().alternar(tipo);
      avisar(LABELS.salvo);
    },
    true,
  );
}

/**
 * Mantém o seletor em dia com a fileira: a cada mudança do store (esta aba, outra aba ou escolha na
 * barra) e a cada nó novo do React no documento.
 */
export function useReactionPickerFavorites(): void {
  useEffect(() => {
    if (typeof document === "undefined") return;
    instalarToque();
    attachReactionFavorites(document);
    void hidratarReacoesFavoritas().then(() => attachReactionFavorites(document));
    const desinscrever = useReacoesFavoritasStore.subscribe((estado, anterior) => {
      if (estado.favoritas !== anterior.favoritas || estado.escolheu !== anterior.escolheu) {
        attachReactionFavorites(document);
      }
    });
    const observer = new MutationObserver(() => attachReactionFavorites(document));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      desinscrever();
      observer.disconnect();
    };
  }, []);
}
