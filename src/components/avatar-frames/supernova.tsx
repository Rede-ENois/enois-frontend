import { polar, round, seededRandom } from "@/lib/avatar-frames";

import { useFxId } from "./use-fx-id";

const rand = seededRandom(151);
const RAIOS = Array.from({ length: 28 }, (_, i) => {
  const angulo = i * (360 / 28) + rand() * 5;
  const ponta = i % 7 === 0 ? 77 : 61 + rand() * 11;
  const largura = i % 7 === 0 ? 2.8 : 0.8 + rand() * 1.2;
  const a = polar(52, angulo - largura);
  const b = polar(ponta, angulo);
  const c = polar(52, angulo + largura);
  return `M${a.join(" ")} L${b.join(" ")} L${c.join(" ")} Z`;
});
const EJECOES = Array.from({ length: 18 }, (_, i) => ({
  angulo: round(i * 20 + rand() * 12),
  r: round(0.45 + rand() * 0.8),
  atraso: round(-1.5 - rand() * 0.5),
}));

/** Coroa estelar persistente com uma explosão periódica de luz, matéria e ondas de choque. */
export function SupernovaFx() {
  const id = useFxId();
  return (
    <svg viewBox="-80 -80 160 160" className="moldura-fx__svg">
      <defs>
        <radialGradient id={`${id}-coroa`}>
          <stop offset="0.58" stopColor="#f76324" stopOpacity="0" />
          <stop offset="0.65" stopColor="#ffb04f" stopOpacity="0.2" />
          <stop offset="0.685" stopColor="#fff1ce" stopOpacity="0.95" />
          <stop offset="0.72" stopColor="#ffd484" stopOpacity="0.75" />
          <stop offset="0.8" stopColor="#ff8a42" stopOpacity="0.35" />
          <stop offset="1" stopColor="#f04038" stopOpacity="0" />
        </radialGradient>

        <radialGradient id={`${id}-raios`} gradientUnits="userSpaceOnUse" cx="0" cy="0" r="78">
          <stop offset="0.64" stopColor="#fff6dd" />
          <stop offset="0.73" stopColor="#ffcf87" />
          <stop offset="0.88" stopColor="#ff9a4a" stopOpacity="0.8" />
          <stop offset="1" stopColor="#d46139" stopOpacity="0.15" />
        </radialGradient>

        <radialGradient id={`${id}-borda`}>
          <stop offset="0.78" stopColor="#6b2631" stopOpacity="0" />
          <stop offset="1" stopColor="#752b34" stopOpacity="0.55" />
        </radialGradient>

        <filter id={`${id}-brilho`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />

          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle r="78" fill={`url(#${id}-coroa)`} className="moldura-supernova__halo" />
      <circle r="50" fill={`url(#${id}-borda)`} />
      <circle r="52.4" fill="none" stroke="#c85933" strokeWidth="2.4" opacity="0.55" />

      <g
        className="moldura-supernova__coroa"
        fill={`url(#${id}-raios)`}
        filter={`url(#${id}-brilho)`}
      >
        {RAIOS.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>

      <g fill="none" strokeLinecap="round" filter={`url(#${id}-brilho)`}>
        <circle r="51.2" stroke="#fff1d4" strokeWidth="1.4" className="moldura-supernova__nucleo" />

        <g className="moldura-supernova__plasma">
          <path
            d="M-29 -45 A53.5 53.5 0 0 1 53 8 M24 48 A53.5 53.5 0 0 1 -49 -21"
            stroke="#ffe0a2"
            strokeWidth="2.2"
          />
          <path
            d="M-50 25 A56 56 0 0 1 -28 -48 M53 -17 A56 56 0 0 1 35 44"
            stroke="#ff9e65"
            strokeWidth="1.2"
          />
        </g>
      </g>

      {[0, 0.38].map((fase) => (
        <circle
          key={fase}
          r="56"
          fill="none"
          stroke={fase ? "#ffb5a1" : "#ffe7b7"}
          strokeWidth={fase ? 0.65 : 1.1}
          className="moldura-fx__particula moldura-supernova__onda"
          style={{ animationDelay: `${-1.6 - fase}s` }}
        />
      ))}

      {EJECOES.map((e, i) => (
        <g key={i} transform={`rotate(${e.angulo})`}>
          <g
            className="moldura-fx__particula moldura-supernova__ejecao"
            style={{ animationDelay: `${e.atraso}s` }}
          >
            <path d="M0 0 V3.5" stroke="#ffcc97" strokeWidth="0.55" />
            <circle r={e.r} fill="#fff3d4" />
          </g>
        </g>
      ))}
    </svg>
  );
}
