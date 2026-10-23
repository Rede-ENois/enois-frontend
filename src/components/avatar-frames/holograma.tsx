import { round, seededRandom } from "@/lib/avatar-frames";

import { useFxId } from "./use-fx-id";

const rand = seededRandom(89);

/** Faixas de interferência: aparecem por um instante, deslocadas, e somem. */
const FAIXAS = Array.from({ length: 6 }, (_, i) => ({
  y: round(-68 + rand() * 136),
  x: round(-75 + rand() * 60),
  largura: round(28 + rand() * 50),
  altura: round(1.2 + rand() * 2),
  cor: i % 2 ? "#ff2bd6" : "#22e6ff",
  duracao: round(2.1 + rand() * 1.6),
  atraso: round(-rand() * 3.5),
}));

/**
 * Holograma: anel com separação RGB que dá glitch, linhas de varredura e uma faixa de scan
 * passando pelo rosto, anéis de dados girando e faixas de interferência. Tudo transform e
 * opacidade (as linhas de varredura são um padrão fixo; só a faixa de scan se move).
 */
export function HologramaFx() {
  const id = useFxId();
  return (
    <svg viewBox="-80 -80 160 160" className="moldura-fx__svg">
      <defs>
        <clipPath id={`${id}-rosto`}>
          <circle r="50" />
        </clipPath>

        <pattern id={`${id}-linhas`} width="4" height="2.4" patternUnits="userSpaceOnUse">
          <rect width="4" height="0.9" fill="#67e8f9" />
        </pattern>

        <linearGradient id={`${id}-scan`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#22e6ff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#a5f3fc" stopOpacity="0.45" />
          <stop offset="1" stopColor="#22e6ff" stopOpacity="0" />
        </linearGradient>

        <radialGradient id={`${id}-borda`}>
          <stop offset="0.75" stopColor="#0891b2" stopOpacity="0" />
          <stop offset="1" stopColor="#0891b2" stopOpacity="0.45" />
        </radialGradient>

        <filter id={`${id}-brilho`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.3" result="blur" />

          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g className="moldura-holograma__tremor">
        <g clipPath={`url(#${id}-rosto)`}>
          <circle r="50" fill={`url(#${id}-borda)`} />
          <rect
            x="-50"
            y="-50"
            width="100"
            height="100"
            fill={`url(#${id}-linhas)`}
            opacity="0.16"
          />
          <rect
            x="-50"
            y="-60"
            width="100"
            height="16"
            fill={`url(#${id}-scan)`}
            className="moldura-holograma__scan"
          />
        </g>

        <g fill="none" filter={`url(#${id}-brilho)`}>
          <circle
            r="56"
            stroke="#22d3ee"
            strokeWidth="0.8"
            strokeDasharray="1 3 7 3"
            className="moldura-holograma__dados"
          />
          <circle
            r="62"
            stroke="#67e8f9"
            strokeWidth="0.7"
            strokeDasharray="0.6 3.4"
            strokeOpacity="0.8"
            className="moldura-holograma__marcas"
          />

          <g className="moldura-holograma__arcos">
            <path
              d="M0 -67 A67 67 0 0 1 47.4 -47.4"
              stroke="#a5f3fc"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <path
              d="M0 67 A67 67 0 0 1 -47.4 47.4"
              stroke="#a5f3fc"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </g>

          <circle
            r="50.8"
            stroke="#ff2bd6"
            strokeWidth="1.6"
            strokeOpacity="0.75"
            className="moldura-holograma__magenta"
          />
          <circle
            r="50.8"
            stroke="#22e6ff"
            strokeWidth="1.6"
            strokeOpacity="0.75"
            className="moldura-holograma__ciano"
          />
          <circle r="50.8" stroke="#ecfeff" strokeWidth="1.1" />
        </g>

        {FAIXAS.map((f, i) => (
          <rect
            key={i}
            x={f.x}
            y={f.y}
            width={f.largura}
            height={f.altura}
            fill={f.cor}
            className="moldura-fx__particula moldura-holograma__faixa"
            style={{ animationDuration: `${f.duracao}s`, animationDelay: `${f.atraso}s` }}
          />
        ))}
      </g>
    </svg>
  );
}
