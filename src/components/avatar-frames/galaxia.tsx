import { useEffect, useRef } from "react";

import clouds from "@/assets/avatar-frames/galaxia/clouds.webp";
import core from "@/assets/avatar-frames/galaxia/core.webp";
import particlesA from "@/assets/avatar-frames/galaxia/glints-a.webp";
import particlesB from "@/assets/avatar-frames/galaxia/glints-b.webp";
import wisps from "@/assets/avatar-frames/galaxia/wisps.webp";

const targets = new Set<Element>();
const visible = new Set<Element>();
let observer: IntersectionObserver | null = null;

function syncVisibility(target: Element) {
  target.classList.toggle("moldura-galaxia--ativa", visible.has(target) && !document.hidden);
}

function onVisibilityChange() {
  targets.forEach(syncVisibility);
}

/** Um observer e um listener para todas as instâncias; nenhum render React por quadro. */
function observeGalaxy(target: Element) {
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
        { rootMargin: "24px" },
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
    target.classList.remove("moldura-galaxia--ativa");
    if (targets.size === 0) {
      observer?.disconnect();
      observer = null;
      document.removeEventListener("visibilitychange", onVisibilityChange);
    }
  };
}

const IMAGE_PROPS = {
  alt: "",
  width: 384,
  height: 384,
  draggable: false,
  loading: "lazy",
  decoding: "async",
} as const;

/** Braços e partículas em camadas compartilhadas, com giro anti-horário. */
export function GalaxiaFx() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (ref.current) return observeGalaxy(ref.current);
  }, []);
  return (
    <span ref={ref} className="moldura-galaxia">
      <img
        {...IMAGE_PROPS}
        src={wisps}
        className="moldura-galaxia__camada moldura-galaxia__gas moldura-galaxia__movimento"
      />

      <span className="moldura-galaxia__sistema moldura-galaxia__movimento">
        <img {...IMAGE_PROPS} src={clouds} className="moldura-galaxia__camada" />
      </span>

      <img
        {...IMAGE_PROPS}
        src={particlesA}
        className="moldura-galaxia__camada moldura-galaxia__particulas moldura-galaxia__particulas--a moldura-galaxia__movimento"
      />
      <img
        {...IMAGE_PROPS}
        src={particlesB}
        className="moldura-galaxia__camada moldura-galaxia__particulas moldura-galaxia__particulas--b moldura-galaxia__movimento"
      />
      <img {...IMAGE_PROPS} src={core} className="moldura-galaxia__camada" />
    </span>
  );
}
