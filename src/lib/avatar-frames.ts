/**
 * Molduras com efeito (raio, fogo...): o desenho sai do círculo do avatar, então o
 * UserAvatar as embrulha num invólucro sem overflow-hidden (ver AvatarFrameFx).
 */
export const FX_FRAMES = [
  "moldura-tempestade",
  "moldura-inferno",
  "moldura-buraco-negro",
  "moldura-orbita",
  "moldura-glacial",
  "moldura-toxica",
  "moldura-nebulosa",
  "moldura-supernova",
  "moldura-galaxia",
  "moldura-portal",
  "moldura-holograma",
] as const;

/** A categoria "Animadas" da loja: as de anel animado (só CSS) e as com efeito. */
export const ANIMATED_FRAMES: readonly string[] = [
  "moldura-aurora",
  "moldura-pulsar",
  "moldura-solar",
  ...FX_FRAMES,
];

export function isFxFrame(frame: string | null | undefined): boolean {
  return !!frame && (FX_FRAMES as readonly string[]).includes(frame);
}

/**
 * Pseudoaleatório com semente: os raios, chamas e cristais saem iguais no servidor e no
 * navegador (sem diferença de hidratação) e iguais em todo avatar com a mesma moldura.
 */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Ponto no círculo centrado na origem; 0° é o topo e o ângulo cresce no sentido horário. */
export function polar(radius: number, degrees: number): [number, number] {
  const rad = (degrees * Math.PI) / 180;
  return [round(radius * Math.sin(rad)), round(-radius * Math.cos(rad))];
}

export function round(n: number): number {
  return Math.round(n * 100) / 100;
}
