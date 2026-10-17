import type { MouseEvent } from "react";

import { MAIN_CONTENT_ID } from "@/constants/accessibility";
import { texts } from "@/texts";

/**
 * Primeiro item focável da página: quem navega por teclado ou leitor de tela pula o cabeçalho e a
 * navegação e cai direto no conteúdo. Fica invisível até receber foco.
 *
 * O `<main>` das cascas do design system não carrega o id do alvo: sem ele na página, o foco vai
 * para o primeiro `<main>` que existir.
 */
export function SkipLink() {
  const skip = (event: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(MAIN_CONTENT_ID) ?? document.querySelector("main");
    if (!target) return;

    event.preventDefault();
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus();
    target.scrollIntoView();
  };

  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      onClick={skip}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      {texts.accessibility.skipToContent}
    </a>
  );
}
