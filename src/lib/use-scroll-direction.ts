import { useEffect, useRef } from "react";

/** Pixels de scroll necessários pra mudar de direção (evita tremer com micro-scroll). */
const THRESHOLD = 12;
/** Não esconde o header antes de passar essa posição (o topo da página sempre mostra). */
const MIN_Y = 80;
const ATTR = "data-scroll-down";

/**
 * Seta `data-scroll-down` no `<html>` quando o usuário está scrollando pra baixo no mobile.
 * O CSS do app reage a esse atributo pra esconder o header e reduzir a opacidade do dock.
 *
 * Não usa state do React — manipula o DOM diretamente pra zero re-render durante scroll.
 * O listener é passive — zero jank.
 */
export function useScrollDirection() {
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    lastY.current = window.scrollY;

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY.current;
        const html = document.documentElement;
        if (delta > THRESHOLD && y > MIN_Y) {
          if (!html.hasAttribute(ATTR)) html.setAttribute(ATTR, "");
        } else if (delta < -THRESHOLD) {
          html.removeAttribute(ATTR);
        }
        lastY.current = y;
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.documentElement.removeAttribute(ATTR);
    };
  }, []);
}
