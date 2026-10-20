import type { RgbColor } from "@/types/preferences/rgb-color";
import type { ThemeContrastLevel } from "@/types/preferences/theme-contrast-level";

/** Converte um valor de canal linear (0–1) para o codificado em sRGB (0–1). */
function encodeSrgb(value: number): number {
  const clamped = Math.min(1, Math.max(0, value));
  return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
}

/** oklch → sRGB. Canais fora da gamut são recortados. */
export function oklchToRgb(lightness: number, chroma: number, hue: number): RgbColor {
  const radians = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(radians);
  const b = chroma * Math.sin(radians);

  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return {
    r: encodeSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: encodeSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: encodeSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  };
}

/** Cor como o CSS espera, mantendo a notação oklch (mais fiel à paleta). */
export function oklch(lightness: number, chroma: number, hue: number): string {
  return `oklch(${round(lightness)} ${round(chroma)} ${round(hue)})`;
}

/** Cor em hexadecimal, para tokens que o CSS da marca declara em hex. */
export function oklchToHex(lightness: number, chroma: number, hue: number): string {
  return rgbToHex(oklchToRgb(lightness, chroma, hue));
}

export function hexToRgb(hex: string): RgbColor {
  const value = hex.replace("#", "");
  const channel = (start: number) => parseInt(value.slice(start, start + 2), 16) / 255;
  return { r: channel(0), g: channel(2), b: channel(4) };
}

export function rgbToHex({ r, g, b }: RgbColor): string {
  const toHex = (value: number) =>
    Math.round(value * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Luminância relativa da WCAG. */
export function relativeLuminance({ r, g, b }: RgbColor): number {
  const channel = (value: number) =>
    value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Razão de contraste da WCAG entre duas cores (1 a 21). */
export function contrastRatio(first: RgbColor, second: RgbColor): number {
  const a = relativeLuminance(first);
  const b = relativeLuminance(second);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Nível de contraste da WCAG para texto normal. */
export function classifyContrast(ratio: number): ThemeContrastLevel {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA_LARGE";
  return "FAIL";
}

/**
 * Escolhe o texto (quase branco ou quase preto) que se lê melhor sobre a cor dada.
 * É assim que o contraste fica garantido por construção, em qualquer combinação.
 */
export function readableForeground(
  background: RgbColor,
  hue: number,
): { css: string; rgb: RgbColor; ratio: number } {
  const light = oklchToRgb(0.99, 0.005, hue);
  const dark = oklchToRgb(0.16, 0.02, hue);
  const lightRatio = contrastRatio(background, light);
  const darkRatio = contrastRatio(background, dark);

  return lightRatio >= darkRatio
    ? { css: oklch(0.99, 0.005, hue), rgb: light, ratio: lightRatio }
    : { css: oklch(0.16, 0.02, hue), rgb: dark, ratio: darkRatio };
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * Cor do destaque SEGURA como texto: o próprio primário quando ele já alcança 3:1
 * contra TODOS os fundos dados; senão, escurecido (fundo mais claro que ele) ou
 * clareado até alcançar o pior caso. Botões continuam com o primário vivo
 * (`--primary`) — é o TEXTO que o usa como cor (links, "Entrar", "Esqueci minha
 * senha") que não pode sumir em temas de primário claro (amarelo, ciano). O fundo
 * do `--primary-soft` entra na lista porque combos `bg-primary-soft text-primary`
 * (iniciais de empresa, passos) ficariam texto≈fundo quando o soft é o próprio
 * tom profundo derivado do primário.
 */
export function textSafeAccent(primary: RgbColor, backgrounds: RgbColor[]): string {
  const worst = (color: RgbColor) => Math.min(...backgrounds.map((bg) => contrastRatio(color, bg)));
  if (worst(primary) >= 3.4) return rgbToHex(primary);
  // A direção vem do fundo da PÁGINA (primeiro da lista) — o soft pode ficar do lado
  // oposto da luminância (tom profundo num tema claro) e não manda na direção; ele só
  // entra no gate do pior caso, junto.
  const page = backgrounds[0];
  const darken = relativeLuminance(page) > relativeLuminance(primary);
  const target = darken ? 0 : 1;
  let low = 0;
  let high = 1;
  let best = darken ? { r: 0, g: 0, b: 0 } : { r: 1, g: 1, b: 1 };
  for (let i = 0; i < 12; i += 1) {
    const t = (low + high) / 2;
    const mixed = {
      r: primary.r + (target - primary.r) * t,
      g: primary.g + (target - primary.g) * t,
      b: primary.b + (target - primary.b) * t,
    };
    if (worst(mixed) >= 3.4) {
      best = mixed;
      high = t;
    } else {
      low = t;
    }
  }
  if (worst(best) < 3.4) {
    // Fundo do primário colado no alvo (ex.: soft ≈ primário): segue para preto/branco
    // além da mistura — o pior caso vence.
    let extra = best;
    for (let i = 0; i < 12 && worst(extra) < 3.4; i += 1) {
      extra = {
        r: extra.r + (target - extra.r) * 0.5,
        g: extra.g + (target - extra.g) * 0.5,
        b: extra.b + (target - extra.b) * 0.5,
      };
    }
    return rgbToHex(extra);
  }
  return rgbToHex(best);
}

/** Converte hex em HSL (h 0–360, s/l 0–100) — a forma que os sliders de fundo falam. */
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  // RgbColor já é normalizado (0–1): nada de dividir por 255 de novo.
  const rn = hexToRgb(hex);
  const max = Math.max(rn.r, rn.g, rn.b);
  const min = Math.min(rn.r, rn.g, rn.b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn.r) h = (rn.g - rn.b) / d + (rn.g < rn.b ? 6 : 0);
  else if (max === rn.g) h = (rn.b - rn.r) / d + 2;
  else h = (rn.r - rn.g) / d + 4;
  return { h: Math.round(h * 60), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/** Converte HSL (h 0–360, s/l 0–100) de volta para hex. */
export function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = ln - c / 2;
  // RgbColor é normalizado (0–1): os canais HSL já nascem nessa escala.
  return rgbToHex({
    r: Math.min(1, Math.max(0, r + m)),
    g: Math.min(1, Math.max(0, g + m)),
    b: Math.min(1, Math.max(0, b + m)),
  });
}
