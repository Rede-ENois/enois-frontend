import { useEffect, useRef } from "react";

import { ANIMATED_FRAMES } from "./avatar-frames";

const targets = new Set<Element>();
const visible = new Set<Element>();
let observer: IntersectionObserver | null = null;

function syncVisibility(target: Element) {
  target.toggleAttribute("data-avatar-animating", visible.has(target) && !document.hidden);
}

function onVisibilityChange() {
  targets.forEach(syncVisibility);
}

/** Um observer e um listener para todas as molduras, sem render React por quadro. */
function observeAvatar(target: Element) {
  if (targets.size === 0) {
    document.addEventListener("visibilitychange", onVisibilityChange);
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!targets.has(entry.target)) continue;
            if (entry.isIntersecting) visible.add(entry.target);
            else visible.delete(entry.target);
            syncVisibility(entry.target);
          }
        },
        // O efeito se estende além do avatar, inclusive no tamanho maior do perfil.
        { rootMargin: "40px" },
      );
    }
  }
  targets.add(target);
  if (observer) observer.observe(target);
  else {
    visible.add(target);
    syncVisibility(target);
  }
  return () => {
    observer?.unobserve(target);
    targets.delete(target);
    visible.delete(target);
    target.removeAttribute("data-avatar-animating");
    if (targets.size === 0) {
      observer?.disconnect();
      observer = null;
      document.removeEventListener("visibilitychange", onVisibilityChange);
    }
  };
}

export function useAvatarAnimation(frame: string | null | undefined) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (frame && ANIMATED_FRAMES.includes(frame) && ref.current) return observeAvatar(ref.current);
  }, [frame]);
  return ref;
}
