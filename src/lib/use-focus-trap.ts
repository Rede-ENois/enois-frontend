import { type RefObject, useEffect } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Mantém o foco do teclado dentro de um diálogo modal (`aria-modal`): ao abrir, o foco entra
 * nele; Tab e Shift+Tab dão a volta nos controles dele em vez de sair para a página de trás; ao
 * fechar, o foco volta para onde estava.
 *
 * Dentro de um iframe de outra origem as teclas não chegam aqui, então o Tab lá dentro segue as
 * regras do próprio iframe.
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    const container = ref.current;
    if (!active || !container) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusables = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) =>
          !element.hasAttribute("inert") && element.getAttribute("aria-hidden") !== "true",
      );

    if (!container.contains(document.activeElement)) {
      (focusables()[0] ?? container).focus();
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      if (event.shiftKey && (current === first || !container.contains(current))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || !container.contains(current))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // Só devolve o foco quando o painel saiu da tela. O trap também desliga enquanto o diálogo
      // de denúncia está aberto, e ali o painel continua montado: devolver o foco nesse instante
      // o mandaria para a página de trás com a chamada ainda aberta.
      if (!container.isConnected && previous?.isConnected) previous.focus();
    };
  }, [ref, active]);
}
