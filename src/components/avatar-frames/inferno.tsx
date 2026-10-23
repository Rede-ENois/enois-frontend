import type { CSSProperties } from "react";

import { polar, round, seededRandom } from "@/lib/avatar-frames";

import { useFxId } from "./use-fx-id";

const rand = seededRandom(11);

/** Labareda com a base na origem e a ponta para cima (o grupo pai a gira no lugar). */
function labareda(w: number, h: number): string {
  const [a, b, c] = [round(w), round(h), round(w * 0.15)];
  return `M${-a} 0 C${-a} ${round(-b * 0.45)} ${-c} ${round(-b * 0.55)} 0 ${-b} C${c} ${round(-b * 0.55)} ${a} ${round(-b * 0.45)} ${a} 0 C${round(a * 0.55)} ${round(a * 0.9)} ${round(-a * 0.55)} ${round(a * 0.9)} ${-a} 0 Z`;
}

/**
 * Chamas em volta da borda: saem para fora, mas puxadas para cima como fogo de verdade —
 * altas no topo, curtas embaixo (para não cobrir o rosto).
 */
function chamas(quantidade: number, raio: number, escala: number) {
  return Array.from({ length: quantidade }, (_, i) => {
    const theta = (i * 360) / quantidade + (rand() - 0.5) * 6;
    const rad = (theta * Math.PI) / 180;
    const [x, y] = polar(raio, theta);
    const angulo = round((Math.atan2(Math.sin(rad), Math.cos(rad) + 0.6) * 180) / Math.PI);
    const topo = (1 + Math.cos(rad)) / 2;
    return {
      x,
      y,
      angulo,
      d: labareda((3.2 + rand() * 1.4) * escala, (7 + 13 * topo + rand() * 5) * escala),
      duracao: round(0.5 + rand() * 0.45),
      atraso: round(-rand()),
    };
  });
}

const EXTERNAS = chamas(26, 47, 1);
const INTERNAS = chamas(20, 48, 0.6);
const BRASAS = Array.from({ length: 9 }, () => {
  const [x, y] = polar(52 + rand() * 6, (rand() - 0.5) * 170);
  return {
    x,
    y,
    r: round(0.7 + rand() * 0.7),
    deriva: `${round((rand() - 0.5) * 14)}px`,
    duracao: round(1.4 + rand()),
    atraso: round(-rand() * 2.4),
  };
});

/** Inferno: labaredas que lambem a borda, brasas subindo e o retrato aquecido nas bordas. */
export function InfernoFx() {
  const id = useFxId();
  const camada = (lista: typeof EXTERNAS, gradiente: string) =>
    lista.map((c, i) => (
      <g key={i} transform={`translate(${c.x} ${c.y}) rotate(${c.angulo})`}>
        <path
          d={c.d}
          fill={`url(#${id}-${gradiente})`}
          className="moldura-inferno__chama"
          style={{ animationDuration: `${c.duracao}s`, animationDelay: `${c.atraso}s` }}
        />
      </g>
    ));
  return (
    <svg viewBox="-80 -80 160 160" className="moldura-fx__svg">
      <defs>
        <linearGradient id={`${id}-externa`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#fde047" />
          <stop offset="0.35" stopColor="#fb923c" />
          <stop offset="0.75" stopColor="#ef4444" />
          <stop offset="1" stopColor="#7f1d1d" stopOpacity="0" />
        </linearGradient>

        <linearGradient id={`${id}-interna`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#fffbeb" />
          <stop offset="0.5" stopColor="#fde047" />
          <stop offset="1" stopColor="#f97316" stopOpacity="0" />
        </linearGradient>

        <radialGradient id={`${id}-brasa`}>
          <stop offset="0.78" stopColor="#ea580c" stopOpacity="0" />
          <stop offset="1" stopColor="#ea580c" stopOpacity="0.6" />
        </radialGradient>

        <filter id={`${id}-calor`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.09 0.16"
            numOctaves="2"
            seed="4"
            result="ruido"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="ruido"
            scale="5"
            xChannelSelector="R"
            yChannelSelector="G"
            result="onda"
          />
          <feGaussianBlur in="onda" stdDeviation="1.2" result="blur" />

          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="onda" />
          </feMerge>
        </filter>

        <filter id={`${id}-brilho`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.8" />
        </filter>
      </defs>

      <circle r="50" fill={`url(#${id}-brasa)`} />
      {/* O núcleo "engrossa" trocando a opacidade entre um anel fino e um grosso: animar
          stroke-width obriga a thread principal a repintar todo quadro (benchmark), opacidade não. */}
      <circle
        r="49.5"
        fill="none"
        stroke="#f97316"
        strokeWidth="3.5"
        filter={`url(#${id}-brilho)`}
        className="moldura-inferno__nucleo"
      />
      <circle
        r="49.5"
        fill="none"
        stroke="#f97316"
        strokeWidth="5"
        opacity="0"
        filter={`url(#${id}-brilho)`}
        className="moldura-inferno__nucleo-grosso"
      />

      <g filter={`url(#${id}-calor)`}>
        {camada(EXTERNAS, "externa")}
        {camada(INTERNAS, "interna")}
      </g>
      {BRASAS.map((b, i) => (
        <g key={i} transform={`translate(${b.x} ${b.y})`}>
          <circle
            r={b.r}
            fill="#fdba74"
            className="moldura-fx__particula moldura-inferno__brasa"
            style={
              {
                "--deriva": b.deriva,
                animationDuration: `${b.duracao}s`,
                animationDelay: `${b.atraso}s`,
              } as CSSProperties
            }
          />
        </g>
      ))}
    </svg>
  );
}
