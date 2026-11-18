import { useEffect } from "react";

import { REACTION_EMOJIS } from "@/constants/reaction-emojis";
import type { ReactionType } from "@/types/application/reaction/reaction-type";

const VARIATION_SELECTOR = /\uFE0F/g;
const IGNORED_ANCESTOR_SELECTOR =
  "input, textarea, code, pre, [contenteditable='true'], script, style";

const EMOJI_TO_REACTION_TYPE = new Map<string, ReactionType>();
for (const [type, glyph] of Object.entries(REACTION_EMOJIS) as [ReactionType, string][]) {
  EMOJI_TO_REACTION_TYPE.set(glyph, type);
  const stripped = glyph.replace(VARIATION_SELECTOR, "");
  if (stripped && !EMOJI_TO_REACTION_TYPE.has(stripped)) {
    EMOJI_TO_REACTION_TYPE.set(stripped, type);
  }
}

export function resolveReactionTypeFromGlyph(text: string | null | undefined): ReactionType | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 8) return null;
  return (
    EMOJI_TO_REACTION_TYPE.get(trimmed) ??
    EMOJI_TO_REACTION_TYPE.get(trimmed.replace(VARIATION_SELECTOR, "")) ??
    null
  );
}

function syncElementGlyph(element: Element): void {
  if (element.hasAttribute("data-reaction-emoji")) return;
  if (element.closest(IGNORED_ANCESTOR_SELECTOR)) {
    if (element.hasAttribute("data-enois-reaction-glyph")) {
      element.removeAttribute("data-enois-reaction-glyph");
    }
    return;
  }

  // Only target leaf elements wrapping a single text node with a known reaction glyph
  if (element.childNodes.length === 1 && element.firstChild?.nodeType === Node.TEXT_NODE) {
    const type = resolveReactionTypeFromGlyph(element.firstChild.textContent);
    if (type) {
      if (element.getAttribute("data-enois-reaction-glyph") !== type) {
        element.setAttribute("data-enois-reaction-glyph", type);
      }
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
