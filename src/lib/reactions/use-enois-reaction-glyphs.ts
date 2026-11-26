import { useEffect } from "react";

import {
  PURPLE_HEART_EMOJI,
  PURPLE_HEART_LABEL,
  REACTION_EMOJIS,
  REACTION_EMOJI_LABELS,
  REACTION_FIGURE_EMOJIS,
} from "@/constants/reaction-emojis";
import {
  type AnyReactionType,
  PURPLE_HEART_REACTION,
} from "@/types/application/reaction/any-reaction-type";
import type { ReactionType } from "@/types/application/reaction/reaction-type";

import { reacaoDoCodigo } from "./favoritas";

const VARIATION_SELECTOR = /\uFE0F/g;

const IGNORED_ANCESTOR_SELECTOR =
  "input, textarea, code, pre, [contenteditable='true'], script, style";

/**
 * O emoji de apoio de cada reação oficial: é ele que fica no texto do DOM (e no leitor de tela)
 * quando uma view desenhou o código da reação no lugar da figura.
 */
const GLYPH_OF_REACTION: Record<string, string> = {
  ...REACTION_EMOJIS,
  [PURPLE_HEART_REACTION]: PURPLE_HEART_EMOJI,
};

/**
 * Emoji → tipo, em duas passadas.
 *
 * Primeiro o emoji de APOIO, que é o que está no texto de quem reagiu (`😭` = SOB). Depois o emoji
 * da FIGURA, que é o que as views do design system desenham (`emojis[type]` = `REACTION_FIGURE_EMOJIS`,
 * a fonte da figura de cada tipo): a pílula de X mostra um emoji que pode ser o de apoio de outro
 * tipo, e aí quem manda é a figura — não o primeiro tipo que registrou aquele símbolo. Sem a segunda
 * passada, a pílula do ROFL (estrela, emoji de apoio do VIBE) seria pintada com o ícone do VIBE.
 */
const EMOJI_TO_REACTION_TYPE = new Map<string, AnyReactionType>();

/** O coração roxo não é uma das 76 expressões: entra pela fileira, com o próprio emoji e nome. */
const REACTION_LABELS: Record<string, string> = {
  ...REACTION_EMOJI_LABELS,
  [PURPLE_HEART_REACTION]: PURPLE_HEART_LABEL,
};

function registrar(glyph: string, type: AnyReactionType, sobrescrever: boolean): void {
  const chaves = [glyph, glyph.replace(VARIATION_SELECTOR, "")].filter(Boolean);
  for (const chave of chaves) {
    if (sobrescrever || !EMOJI_TO_REACTION_TYPE.has(chave)) {
      EMOJI_TO_REACTION_TYPE.set(chave, type);
    }
  }
}

for (const [type, glyph] of Object.entries(REACTION_EMOJIS) as [ReactionType, string][]) {
  registrar(glyph, type, false);
}
for (const [type, glyph] of Object.entries(REACTION_FIGURE_EMOJIS) as [ReactionType, string][]) {
  registrar(glyph, type, true);
}
// Por último: 💜 é o emoji da figura do coração roxo e não pode ser tomado por outra reação.
registrar(PURPLE_HEART_EMOJI, PURPLE_HEART_REACTION, true);

export function resolveReactionTypeFromGlyph(
  text: string | null | undefined,
): AnyReactionType | null {
  if (!text) return null;
  const trimmed = text.trim();
  // Um glifo tem 1 a 8 caracteres (emoji composto); um caminho de figura é bem maior.
  if (!trimmed || trimmed.length > 16 || trimmed.startsWith("/")) return null;
  return (
    EMOJI_TO_REACTION_TYPE.get(trimmed) ??
    EMOJI_TO_REACTION_TYPE.get(trimmed.replace(VARIATION_SELECTOR, "")) ??
    null
  );
}

function syncButtonTooltip(element: Element, type: AnyReactionType, glyph: string | null): void {
  const button = element.closest("button[title]");
  if (!button) return;
  const currentTitle = button.getAttribute("title");
  if (!currentTitle) return;
  const label = REACTION_LABELS[type];
  if (!label || !glyph) return;
  const trimmedGlyph = glyph.trim();
  if (!trimmedGlyph || !currentTitle.includes(trimmedGlyph)) return;
  const nextTitle = currentTitle.replace(trimmedGlyph, label);
  if (nextTitle !== currentTitle) {
    button.setAttribute("title", nextTitle);
  }
}

function syncElementGlyph(element: Element): void {
  if (element.hasAttribute("data-reaction-emoji")) {
    const pickerType = element.getAttribute("data-reaction-emoji");
    if (pickerType && Object.hasOwn(REACTION_LABELS, pickerType)) {
      element.setAttribute("data-enois-reaction-glyph", pickerType);
      const label = REACTION_LABELS[pickerType];
      if (element.getAttribute("title") !== label) {
        element.setAttribute("title", label);
      }
    }
    return;
  }

  if (element.closest(IGNORED_ANCESTOR_SELECTOR)) {
    if (element.hasAttribute("data-enois-reaction-glyph")) {
      element.removeAttribute("data-enois-reaction-glyph");
    }
    return;
  }

  // Lista de quem reagiu e abas do diálogo desenham o valor de `emojis[type]` como texto: para o
  // coração roxo ele é o código (`HEART_PURPLE`) ou o nome do arquivo (`heart_purple`), não um
  // emoji. O texto vira o glifo da reação e o CSS pinta a figura.
  // Um código tem até 40 letras; texto de verdade não passa por aqui.
  if (
    element.childNodes.length === 1 &&
    element.firstChild?.nodeType === Node.TEXT_NODE &&
    (element.textContent?.trim().length ?? 0) <= 40
  ) {
    const codigo = reacaoDoCodigo(element.textContent);
    if (codigo) {
      if (element.getAttribute("data-enois-reaction-glyph") !== codigo) {
        element.setAttribute("data-enois-reaction-glyph", codigo);
      }
      const glyph = GLYPH_OF_REACTION[codigo];
      if (glyph) element.firstChild.textContent = glyph;
      return;
    }
  }

  // Only target leaf elements wrapping a single text node with a known reaction glyph
  if (element.childNodes.length === 1 && element.firstChild?.nodeType === Node.TEXT_NODE) {
    const rawGlyph = element.firstChild.textContent;
    const type = resolveReactionTypeFromGlyph(rawGlyph);
    if (type) {
      if (element.getAttribute("data-enois-reaction-glyph") !== type) {
        element.setAttribute("data-enois-reaction-glyph", type);
      }
      syncButtonTooltip(element, type, rawGlyph);
      return;
    }
  }

  if (element.hasAttribute("data-enois-reaction-glyph")) {
    element.removeAttribute("data-enois-reaction-glyph");
  }
}

function scanSubtree(root: Node): void {
  if (root.nodeType === Node.TEXT_NODE) {
    if (root.parentElement) syncElementGlyph(root.parentElement);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;

  const el = root as Element;
  if (el.matches(IGNORED_ANCESTOR_SELECTOR)) return;

  syncElementGlyph(el);
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT);
  let current = walker.nextNode();
  while (current) {
    syncElementGlyph(current as Element);
    current = walker.nextNode();
  }
}

/**
 * Marca elementos folha da UI que exibem um emoji de reação padrão (como os componentes do
 * design system) com `data-enois-reaction-glyph="<TYPE>"` sem alterar nós de texto do React.
 * O CSS então exibe exclusivamente o ícone oficial da Rede É Nóis em qualquer plataforma.
 */
export function useEnoisReactionGlyphs(): void {
  useEffect(() => {
    if (typeof document === "undefined" || !document.body) return;

    scanSubtree(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          if (mutation.target.parentElement) {
            syncElementGlyph(mutation.target.parentElement);
          }
        } else if (mutation.type === "childList") {
          if (mutation.target instanceof Element) {
            syncElementGlyph(mutation.target);
          }
          for (const added of mutation.addedNodes) {
            scanSubtree(added);
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, []);
}
