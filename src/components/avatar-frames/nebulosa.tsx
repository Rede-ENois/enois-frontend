import { polar, round, seededRandom } from "@/lib/avatar-frames";

import { useFxId } from "./use-fx-id";

// Faixas de gás com largura irregular; o desenho é calculado uma vez e só as camadas se movem.
const NUVENS = Array.from({ length: 6 }, (_, i) => {
  const pontos = [-1, 1].flatMap((lado) =>
    Array.from({ length: 49 }, (_, j) => {
      const t = (lado === -1 ? j : 48 - j) / 48;
      const raio = 61 + Math.sin(t * Math.PI * 2 + i) * 3;
      const largura = Math.pow(Math.sin(t * Math.PI), 0.65) * (i % 2 ? 6 : 10);
      return polar(raio + lado * largura, i * 60 + t * 112).join(" ");
    }),
  );
  return `M${pontos.join(" L")} Z`;
});
const rand = seededRandom(127);
const ESTRELAS = Array.from({ length: 26 }, (_, i) => {
  const [x, y] = polar(55 + rand() * 22, rand() * 360);
  return { x, y, r: round(0.3 + rand() * 0.65), destaque: i % 7 === 0 };
});

/** Nuvens de poeira cósmica em camadas, com estrelas entre as regiões de gás. */
export function NebulosaFx() {
  const id = useFxId();
  return (
    <svg viewBox="-80 -80 160 160" className="moldura-fx__svg">
      <defs>
        <radialGradient id={`${id}-halo`}>
          <stop offset="0.58" stopColor="#7038c7" stopOpacity="0" />
          <stop offset="0.72" stopColor="#7e40c7" stopOpacity="0.28" />
          <stop offset="0.86" stopColor="#6668d6" stopOpacity="0.15" />
          <stop offset="1" stopColor="#6654ba" stopOpacity="0" />
        </radialGradient>

        <linearGradient
          id={`${id}-gas`}
          gradientUnits="userSpaceOnUse"
          x1="-65"
          y1="-45"
          x2="65"
          y2="50"
        >
          <stop stopColor="#6da5ff" />
          <stop offset="0.3" stopColor="#9b73ec" />
          <stop offset="0.55" stopColor="#e47fc7" />
          <stop offset="0.78" stopColor="#777ee6" />
          <stop offset="1" stopColor="#65d3ed" />
        </linearGradient>

        <radialGradient id={`${id}-borda`}>
          <stop offset="0.72" stopColor="#27133e" stopOpacity="0" />
          <stop offset="0.92" stopColor="#291947" stopOpacity="0.3" />
          <stop offset="1" stopColor="#33204f" stopOpacity="0.75" />
        </radialGradient>

        <radialGradient id={`${id}-recorte`}>
          <stop offset="0.6" stopColor="#000" />
          <stop offset="0.67" stopColor="#fff" />
          <stop offset="0.92" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>

        <mask id={`${id}-anel`} maskUnits="userSpaceOnUse" x="-80" y="-80" width="160" height="160">
          <circle r="80" fill={`url(#${id}-recorte)`} />
        </mask>

        <filter id={`${id}-nevoa`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.09"
            numOctaves="3"
            seed="12"
            result="poeira"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="poeira"
            scale="5"
            xChannelSelector="R"
            yChannelSelector="G"
          />
          <feGaussianBlur stdDeviation="0.9" />
        </filter>

        <filter id={`${id}-luz`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="0.8" result="blur" />

          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle r="80" fill={`url(#${id}-halo)`} />
      <circle r="50" fill={`url(#${id}-borda)`} />

      <g mask={`url(#${id}-anel)`}>
        <g
          className="moldura-nebulosa__nuvens"
          fill={`url(#${id}-gas)`}
          filter={`url(#${id}-nevoa)`}
        >
          {NUVENS.map((d, i) => (
            <path key={i} d={d} opacity={i % 2 ? 0.45 : 0.7} />
          ))}
        </g>

        <g className="moldura-nebulosa__poeira" fill={`url(#${id}-gas)`}>
          {NUVENS.filter((_, i) => i % 2 === 0).map((d, i) => (
            <path key={i} d={d} opacity="0.2" transform="scale(0.96)" />
          ))}
        </g>

        <g
          className="moldura-nebulosa__poeira"
          fill="none"
          stroke="#201e51"
          strokeLinecap="round"
          opacity="0.3"
          filter={`url(#${id}-nevoa)`}
        >
          <path d="M-62 23 Q-66 -14 -48 -33 M15 64 Q43 59 57 36" strokeWidth="3" />
        </g>

        <g
          className="moldura-nebulosa__veus"
          fill="none"
          stroke={`url(#${id}-gas)`}
          strokeLinecap="round"
          opacity="0.65"
        >
          <path d="M-64 24 C-74 -9 -44 -65 -11 -62 M9 65 C39 68 65 40 64 17" strokeWidth="1.4" />
          <path
            d="M-60 39 C-73 17 -64 -14 -52 -28 M28 -58 C54 -57 65 -35 62 -11"
            strokeWidth="0.65"
          />
        </g>
      </g>

      {[0, 1].map((grupo) => (
        <g
          key={grupo}
          className="moldura-nebulosa__estrelas"
          style={{ animationDelay: `${-grupo * 2.4}s` }}
          filter={`url(#${id}-luz)`}
        >
          {ESTRELAS.filter((_, i) => i % 2 === grupo).map((e, i) => (
            <g key={i} transform={`translate(${e.x} ${e.y})`}>
              <circle r={e.r} fill={i % 2 ? "#e9d7ff" : "#d6f5ff"} />
              {e.destaque && (
                <path d="M-2.4 0 H2.4 M0 -2.4 V2.4" stroke="#fff1fc" strokeWidth="0.55" />
              )}
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}
