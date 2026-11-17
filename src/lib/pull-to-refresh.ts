import { type RefObject, useEffect, useRef, useState } from "react";

/**
 * Distância de arrasto que dispara a renovação e a partir da qual o gesto é reconhecido como
 * "puxar para renovar" (menos que isso é rolar a lista).
 */
const TRIGGER_PX = 70;
const RECOGNIZE_PX = 12;

/**
 * Puxar para renovar no topo da lista, em toque. O gesto não rola a página: é reconhecido quando o
 * dedo desce com a lista já no topo, e conta a distância vertical líquida. Ao soltar passando do
 * limite, pede a renovação — e só dela: nada de invalidar outras consultas, porque as outras listas
 * não fazem parte do que a pessoa puxou.
 *
 * O mesmo gesto serve a qualquer lista do app (feed, avisos, conversas): o que muda é o `onRefresh`
 * de quem chama. Quando a lista rola DENTRO de um contêiner (não na janela), passe o `RefObject`
 * dele: o topo passa a ser o `scrollTop` do contêiner e o gesto só conta se começar dentro dele —
 * senão, com a página sempre em `scrollY === 0`, qualquer arrasto para baixo "renovaria", mesmo com
 * a lista já rolada. O estado de "puxando" (distância atual) serve de feedback ao chamador; a
 * própria renovação acontece só uma vez por gesto e não enquanto uma já está em curso.
 */
export function usePullToRefresh(
  onRefresh: () => void,
  fetching: boolean,
  container?: RefObject<HTMLElement | null>,
) {
  const [pull, setPull] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const triggered = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const atTop = (target: EventTarget | null) => {
      const node = container?.current;
      if (!node) return window.scrollY === 0;
      // O gesto é da lista interna: precisa começar nela e com ela no topo.
      if (!(target instanceof Node) || !node.contains(target)) return false;
      return node.scrollTop <= 0;
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1 || !atTop(event.target)) {
        start.current = null;
        return;
      }
      triggered.current = false;
      start.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    };

    const onTouchMove = (event: TouchEvent) => {
      if (start.current === null || triggered.current) return;
      if (event.touches.length !== 1) return;
      const dx = event.touches[0].clientX - start.current.x;
      const dy = event.touches[0].clientY - start.current.y;
      // Horizontal domina: é um swipe, não uma puxada.
      if (Math.abs(dx) > Math.abs(dy)) return;
      if (dy <= -RECOGNIZE_PX && !atTop(event.target)) {
        start.current = null;
        setPull(0);
        return;
      }
      const distance = Math.max(0, dy);
      setPull(Math.min(distance, TRIGGER_PX * 1.5));
      if (distance >= TRIGGER_PX && !fetching) {
        triggered.current = true;
        onRefresh();
      }
    };

    const onTouchEnd = () => {
      start.current = null;
      setPull(0);
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [onRefresh, fetching, container]);

  return { pulling: pull > RECOGNIZE_PX, pull, trigger: TRIGGER_PX };
}
