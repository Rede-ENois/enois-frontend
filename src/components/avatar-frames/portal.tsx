import { polar, round, seededRandom } from "@/lib/avatar-frames";

import { useFxId } from "./use-fx-id";

const rand = seededRandom(71);

// Arcos irregulares acompanham a borda: a abertura fica legível entre os filamentos.
const FILAMENTOS = Array.from({ length: 7 }, (_, i) => {
  const inicio = i * 51 + rand() * 20;
  const arco = 65 + rand() * 80;
  const raio = 54 + rand() * 9;
  const pontos = Array.from({ length: 49 }, (_, j) => {
    const t = j / 48;
    return polar(
      raio + Math.sin(t * Math.PI * 3 + i) * 1.4 + Math.sin(t * 23 + i) * 0.45,
      inicio + arco * t,
    ).join(" ");
  });
  return {
    d: `M${pontos.join(" L")}`,
    largura: round(0.55 + rand() * 0.85),
    opacidade: round(0.45 + rand() * 0.5),
  };
});

const PARTICULAS = Array.from({ length: 14 }, (_, i) => ({
  angulo: round(i * (360 / 14) + rand() * 12),
  duracao: round(1.8 + rand() * 1.8),
  atraso: round(-rand() * 3.6),
  escala: round(0.5 + rand() * 0.7),
}));

const FLUXOS = Array.from({ length: 5 }, (_, i) => {
  const inicio = i * 72 + rand() * 20;
  const pontos = Array.from({ length: 25 }, (_, j) => {
    const t = j / 24;
    return polar(74 - 20 * t, inicio + t * 65).join(" ");
  });
  return `M${pontos.join(" L")}`;
});

/** Abertura de plasma: borda luminosa, profundidade violeta e matéria entrando em espiral. */
export function PortalFx() {
  const id = useFxId();
  return (
    <svg viewBox="-80 -80 160 160" className="moldura-fx__svg">
      <defs>
        <radialGradient id={`${id}-aura`}>
          <stop offset="0.6" stopColor="#3b1ba5" stopOpacity="0" />
          <stop offset="0.73" stopColor="#743bdf" stopOpacity="0.26" />
          <stop offset="0.85" stopColor="#5855d9" stopOpacity="0.12" />
          <stop offset="1" stopColor="#6366f1" stopOpacity="0" />
        </radialGradient>

        <radialGradient id={`${id}-abertura`} gradientUnits="userSpaceOnUse" cx="0" cy="0" r="76">
          <stop offset="0.64" stopColor="#12103e" stopOpacity="0" />
          <stop offset="0.665" stopColor="#222056" stopOpacity="0.9" />
          <stop offset="0.7" stopColor="#268aaf" stopOpacity="0.8" />
          <stop offset="0.735" stopColor="#b5ffef" />
          <stop offset="0.755" stopColor="#6fffe2" stopOpacity="0.95" />
          <stop offset="0.79" stopColor="#33b9cc" stopOpacity="0.65" />
          <stop offset="0.86" stopColor="#7660dc" stopOpacity="0.28" />
          <stop offset="1" stopColor="#7756cb" stopOpacity="0" />
        </radialGradient>

        <linearGradient id={`${id}-energia`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#e2fff4" />
          <stop offset="0.4" stopColor="#65f7da" />
          <stop offset="0.7" stopColor="#62cced" />
          <stop offset="1" stopColor="#c9a6ff" />
        </linearGradient>

        <radialGradient id={`${id}-fluxo`} gradientUnits="userSpaceOnUse" cx="0" cy="0" r="75">
          <stop offset="0.68" stopColor="#c1fff0" stopOpacity="0.7" />
          <stop offset="0.78" stopColor="#71e0d1" stopOpacity="0.4" />
          <stop offset="1" stopColor="#9d83e8" stopOpacity="0" />
        </radialGradient>

        <radialGradient id={`${id}-profundidade`}>
          <stop offset="0.65" stopColor="#291353" stopOpacity="0" />
          <stop offset="0.88" stopColor="#261750" stopOpacity="0.2" />
          <stop offset="1" stopColor="#111334" stopOpacity="0.8" />
        </radialGradient>

        <filter id={`${id}-brilho`} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="1.3" result="blur" />

          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle r="79" fill={`url(#${id}-aura)`} className="moldura-portal__aura" />
      <circle r="76" fill={`url(#${id}-abertura)`} className="moldura-portal__abertura" />
      <circle r="50" fill={`url(#${id}-profundidade)`} />

      <g fill="none" strokeLinecap="round" filter={`url(#${id}-brilho)`}>
        <g className="moldura-portal__fluxo" stroke={`url(#${id}-fluxo)`} strokeWidth="1.6">
          {FLUXOS.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>

        <g className="moldura-portal__coroa" stroke={`url(#${id}-energia)`}>
          {FILAMENTOS.map((f, i) => (
            <path key={i} d={f.d} strokeWidth={f.largura} opacity={f.opacidade} />
          ))}
        </g>

        <g className="moldura-portal__contrafluxo" stroke="#b49bff" opacity="0.55">
          <path d="M-58 -20 C-57 -51 -25 -68 4 -64 M52 23 C49 51 18 65 -9 62" strokeWidth="1" />
          <path d="M-63 2 Q-66 26 -49 42 M59 -34 Q68 -17 65 -6" strokeWidth="0.55" />
        </g>

        <circle
          r="53.3"
          stroke="#d6fff4"
          strokeWidth="0.75"
          strokeDasharray="58 29 13 73"
          className="moldura-portal__horizonte"
        />
      </g>

      {PARTICULAS.map((p, i) => (
        <g key={i} transform={`rotate(${p.angulo})`}>
          <g
            className="moldura-fx__particula moldura-portal__materia"
            style={{ animationDuration: `${p.duracao}s`, animationDelay: `${p.atraso}s` }}
          >
            <g transform={`scale(${p.escala})`}>
              <path
                d="M0 0 Q-1.5 -5 -4 -8"
                fill="none"
                stroke={i % 3 ? "#7cebdc" : "#c4a2ff"}
                strokeWidth="0.8"
                strokeLinecap="round"
              />
              <circle r="1.5" fill="#e2fff5" />
            </g>
          </g>
        </g>
      ))}
    </svg>
  );
}
