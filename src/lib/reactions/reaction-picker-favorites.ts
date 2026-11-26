import { useEffect } from "react";

import { REACTION_PICKER_ORDER } from "@/constants/reaction-emojis";
import {
  REACOES_FAVORITAS_STORAGE_KEY,
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
  arrastar: "Arraste para mudar a ordem",
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

const ARRASTO_MINIMO = 4;

/**
 * Arrastar a casa põe a favorita na posição em que ela é solta (mouse e toque).
 *
 * O `pointerdown` na casa — fora dos botões — a segura; o movimento para o lado a acompanha e o
 * `pointerup` destrava. A posição nova é a casa que mais ficou encoberta pela casa arrastada (a
 * comparação de retângulos já leva em conta o `transform`), e um arrasto pequeno não mexe em nada.
 * O deslize vertical fica com a rolagem do popover, que segue rolando a lista de reações.
 */
function instalarArrasto(lista: HTMLElement): void {
  if (lista.dataset.arrasto === "sim") return;
  lista.dataset.arrasto = "sim";
  let arrastada: HTMLElement | null = null;
  let inicioX = 0;
  let inicioY = 0;

  const limpar = () => {
    if (!arrastada) return;
    arrastada.removeAttribute("data-arrastando");
    arrastada.style.removeProperty("transform");
    arrastada = null;
  };

  lista.addEventListener("pointerdown", (evento) => {
    const alvo = evento.target instanceof Element ? evento.target : null;
    if (!alvo || !evento.isPrimary || alvo.closest("button")) return;
    const casa = alvo.closest<HTMLElement>("[data-reaction-favorita]");
    if (!casa || !lista.contains(casa)) return;
    arrastada = casa;
    inicioX = evento.clientX;
    inicioY = evento.clientY;
  });

  lista.addEventListener("pointermove", (evento) => {
    if (!arrastada) return;
    const dx = evento.clientX - inicioX;
    const dy = evento.clientY - inicioY;
    if (!arrastada.hasAttribute("data-arrastando")) {
      if (Math.abs(dx) < ARRASTO_MINIMO && Math.abs(dy) < ARRASTO_MINIMO) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        // Deslize vertical: a pessoa está rolando, não arrastando.
        arrastada = null;
        return;
      }
      arrastada.setAttribute("data-arrastando", "sim");
    }
    arrastada.style.transform = `translateX(${dx}px)`;
  });

  const soltar = (cancelou: boolean) => {
    const casa = arrastada;
    const saiu = casa?.hasAttribute("data-arrastando") ?? false;
    // A medida tem de ser com o `transform` ainda na casa: é ele que mostra onde ela foi solta.
    const caixa = casa?.getBoundingClientRect();
    limpar();
    if (!casa || cancelou || !saiu || !caixa) return;
    const tipo = casa.getAttribute("data-reaction-favorita") ?? "";
    let melhor: Element | null = null;
    let coberta = 0;
    for (const outra of lista.children) {
      if (outra === casa) continue;
      const r = outra.getBoundingClientRect();
      const sobreposta = Math.max(0, Math.min(caixa.right, r.right) - Math.max(caixa.left, r.left));
      if (sobreposta > coberta) {
        coberta = sobreposta;
        melhor = outra;
      }
    }
    if (!tipo || !melhor) return;
    const indice = [...lista.children].indexOf(melhor);
    if (indice >= 0) useReacoesFavoritasStore.getState().posicionar(tipo, indice);
  };
  lista.addEventListener("pointerup", () => soltar(false));
  lista.addEventListener("pointercancel", () => soltar(true));
}

/**
 * Põe as favoritas na fileira do seletor aberto pelo "+", antes da lista inteira.
 *
 * A grade expandida é do design system e mostra as reações na ordem dele; a fileira traz as
 * favoritas — que podem ser de qualquer parte da lista — para as primeiras casas, cada uma uma vez
 * só (a casa original fica com o mesmo `order`, então as seguintes se ajeitam sozinhas). Reagir
 * continua sendo pelo botão da reação: a fileira só muda onde a reação aparece.
 */
function marcarFileira(grade: HTMLElement, fileira: readonly string[]): void {
  const posicao = new Map(fileira.map((tipo, i) => [tipo, i]));
  for (const el of grade.querySelectorAll<HTMLElement>("[data-reaction-emoji]")) {
    const ordem = posicao.get(el.getAttribute("data-reaction-emoji") ?? "");
    if (ordem === undefined) el.style.removeProperty("order");
    else el.style.setProperty("order", String(ordem));
  }
}

/** A seta da casa: troca com a vizinha, que é o atalho do arrasto (e o único com teclado). */
function mover(tipo: string, direcao: -1 | 1): void {
  useReacoesFavoritasStore.getState().mover(tipo, direcao);
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
  // A casa inteira é a pega do arrasto: no touch não há hover, e as setas ficam pequenas.
  item.title = LABELS.arrastar;
  item.append(
    botaoDeIcone(ICONE.estrelaCheia, LABELS.desfavoritar, false, () => {
      useReacoesFavoritasStore.getState().alternar(tipo);
      avisar(LABELS.salvo);
    }),
    criarIcone(tipo, emoji),
    botaoDeIcone(ICONE.esquerda, LABELS.esquerda, i <= 0, () => mover(tipo, -1)),
    botaoDeIcone(ICONE.direita, LABELS.direita, i < 0 || i >= fileira.length - 1, () =>
      mover(tipo, 1),
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
      if (lista) {
        lista.dataset.assinatura = assinatura;
        instalarArrasto(lista);
      }
    }
    if (vazio) vazio.hidden = fileira.length > 0;
  }

  // A grade mostra quais são as favoritas: o CSS põe a estrela no canto de quem não é.
  for (const el of grade.querySelectorAll<HTMLElement>("[data-reaction-emoji]")) {
    const tipo = el.getAttribute("data-reaction-emoji") ?? "";
    el.setAttribute("data-favorita", fileira.includes(tipo) ? "sim" : "nao");
  }
  marcarFileira(grade, fileira);
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

/** Redesenha o compacto antes do "+": a grade do "+" não pode mandar na fileira da primeira linha. */
function marcarCompactos(root: ParentNode): void {
  for (const popover of root.querySelectorAll<HTMLElement>(
    "[data-radix-popper-content-wrapper] > div",
  )) {
    const grade = popover.querySelector<HTMLElement>("div.grid.grid-cols-6");
    if (grade && grade.querySelector('button[title="+"]') !== null) marcarCompacto(grade);
  }
}

export function attachReactionFavorites(root: ParentNode = document): void {
  instalarToque();
  // A passada do compacto vem primeiro: a do "+" põe os links de volta e não pode apagar a fileira.
  marcarCompactos(root);
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
 * A grade não tem gancho do React: um `capture` no documento, uma vez, cuida do toque.
 *
 * Reagir e escolher são o mesmo toque: a reação nova entra na fileira (se couber) e a que já é
 * favorita só reage. Tirar da fileira é pela estrela da barra.
 */
function instalarToque(): void {
  if (document.documentElement.hasAttribute(INSTALADO)) return;
  document.documentElement.setAttribute(INSTALADO, "sim");
  document.addEventListener(
    "click",
    (evento) => {
      const alvo = evento.target instanceof Element ? evento.target : null;
      if (!alvo) return;
      // A figurinha da barra reagiria duas vezes (o clique dela vai também à grade).
      if (alvo.closest("[data-reaction-favorita]")) return;

      if (alvo.closest(`[${ESCOLHA_ATTR}]`)) return;
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
    attachReactionFavorites(document);
    void hidratarReacoesFavoritas().then(() => attachReactionFavorites(document));
    const desinscrever = useReacoesFavoritasStore.subscribe((estado, anterior) => {
      if (estado.favoritas === anterior.favoritas && estado.escolheu === anterior.escolheu) return;
      mudouFavoritas = true;
      attachReactionFavorites(document);
      mudouFavoritas = false;
    });
    // Quando as favoritas mudam, a passada nova já veio do store; um ajuste de DOM por causa dela
    // reentraria aqui e desfaria a fileira recém-desenhada.
    let mudouFavoritas = false;
    const observer = new MutationObserver(() => {
      if (mudouFavoritas) return;
      attachReactionFavorites(document);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    // Outra aba mudou a fileira: o store avisa e o seletor aberto se ajeita.
    const storage = (evento: StorageEvent) => {
      if (evento.key !== null && evento.key !== REACOES_FAVORITAS_STORAGE_KEY) return;
      void hidratarReacoesFavoritas().then(() => attachReactionFavorites(document));
    };
    window.addEventListener("storage", storage);
    return () => {
      desinscrever();
      observer.disconnect();
      window.removeEventListener("storage", storage);
    };
  }, []);
}
