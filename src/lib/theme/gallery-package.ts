import { BRAND_GROUND } from "@/constants/brand-ground";
import type { GalleryPackage } from "@/types/lib/theme/gallery-package";
import {
  type BackgroundStyle,
  type Theme,
  type ThemeSettings,
  buildThemeColor,
  clampThemeSettings,
  contrastRatio,
  effectiveAlpha,
  hexToRgb,
  readableForeground,
  representativeHex,
  rgbToHex,
} from "@rede-enois/design-system/domain";

import { resolveThemeCollection } from "./resolve-theme-collection";

/**
 * A PERSONALIZAÇÃO ATUAL como pacote da galeria (o formato que o marketplace vende).
 *
 * A galeria aceita um pacote de cores (fundo, superfície, bloco alternativo, borda, destaque e o
 * texto) — e é esse o denominador comum de TODA customização do Énóis: uma coleção da casa, uma
 * combinação livre de destaque/fundo ou os fundos de página/widget viram os mesmos pares de cor.
 * Assim qualquer visual dá para exportar (arquivo `.enois-theme`) e vender, sem um formato por tipo.
 *
 * Quando a pessoa já tem uma coleção ativa, os tokens dela entram como base; a personalização livre
 * (destaque, cor de widget e fundo de página) por cima — é exatamente o que ela vê na tela.
 *
 * O contrato é o do servidor (`ThemeGalleryService`), e ele é mais exigente do que parece: as cores
 * obrigatórias não têm derivação segura do outro lado, então faltar UMA derruba o publish inteiro
 * com 400. É por isso que `muted`, `onPrimary` e `text.date` saem daqui sempre preenchidos, e que o
 * texto é conferido contra TODAS as superfícies onde ele nasce antes de virar pacote.
 */

const HEX = /#[0-9a-fA-F]{6}/;

/**
 * Piso de contraste do pacote.
 *
 * A galeria recusa abaixo de 4.5:1. A margem existe porque do outro lado a conta é refeita sobre a
 * superfície JÁ COMPOSTA, com arredondamento próprio por canal: um par cravado em 4.5 aqui vira
 * 4.49 lá e o publish volta 400 sem a pessoa entender o porquê.
 */
const MIN_CONTRAST = 4.6;

/** Primeiro hex de um token — tokens podem vir em color-mix() ou gradiente. */
function firstHex(value: string | undefined): string | null {
  if (!value) return null;
  const match = value.match(HEX);
  return match ? match[0] : null;
}

/** Mistura dois hex: `amount` 0 devolve `from`, 1 devolve `to`. */
function mix(from: string, to: string, amount: number): string {
  const start = hexToRgb(from);
  const end = hexToRgb(to);
  const channel = (a: number, b: number) => a + (b - a) * amount;
  return rgbToHex({
    r: channel(start.r, end.r),
    g: channel(start.g, end.g),
    b: channel(start.b, end.b),
  });
}

/** Superfície translúcida resolvida sobre o fundo — a mesma conta que a galeria faz no gate. */
function over(hex: string, backdrop: string, alpha: number): string {
  return alpha >= 100 ? hex : mix(backdrop, hex, alpha / 100);
}

function passes(color: string, backdrops: string[]): boolean {
  return backdrops.every(
    (backdrop) => contrastRatio(hexToRgb(color), hexToRgb(backdrop)) >= MIN_CONTRAST,
  );
}

/**
 * O par claro/escuro do design system, escolhido pelo PIOR caso entre as superfícies.
 *
 * Medir só contra o fundo é o que deixava passar tema com cartão ou bloco alternativo ilegível:
 * o texto nasce nos três, então quem manda é o pior deles.
 */
function fitText(backdrops: string[], hue: number): string {
  const light = rgbToHex(readableForeground(hexToRgb("#000000"), hue).rgb);
  const dark = rgbToHex(readableForeground(hexToRgb("#ffffff"), hue).rgb);
  const worst = (hex: string) =>
    Math.min(...backdrops.map((backdrop) => contrastRatio(hexToRgb(hex), hexToRgb(backdrop))));
  const best = worst(light) >= worst(dark) ? light : dark;
  if (worst(best) >= MIN_CONTRAST) return best;
  // Último recurso: o extremo puro, que é o máximo de contraste possível nessa direção.
  return worst("#ffffff") >= worst("#000000") ? "#ffffff" : "#000000";
}

/** O texto forte puxado para o fundo até onde o piso de contraste deixa. */
function softer(strong: string, backdrop: string, gates: string[]): string {
  for (let amount = 0.45; amount > 0; amount -= 0.05) {
    const candidate = mix(strong, backdrop, amount);
    if (passes(candidate, gates)) return candidate;
  }
  return strong;
}

export function buildGalleryPackage(input: {
  collectionId: string | null;
  settings: ThemeSettings;
  mode: Theme;
  widget?: BackgroundStyle | null;
  page?: BackgroundStyle | null;
}): GalleryPackage {
  const collection = resolveThemeCollection(input.collectionId);
  const tokens = collection?.tokens[input.mode] ?? collection?.tokens.light ?? {};
  const fallbackBackground = BRAND_GROUND[input.mode];
  const accent = clampThemeSettings(input.settings).accent;

  const background =
    (input.page ? representativeHex(input.page) : null) ??
    firstHex(tokens["--background"]) ??
    fallbackBackground;

  // A cor de widget É o cartão que a pessoa vê. Sem ela o pacote repetia o fundo em superfície e
  // borda, e o tema vendido saía chapado — uma cor só, nada do visual que a pessoa montou.
  const surface =
    (input.widget ? representativeHex(input.widget) : null) ??
    firstHex(tokens["--card"]) ??
    firstHex(tokens["--surface-3"]) ??
    background;
  const surfaceAlpha = input.widget
    ? effectiveAlpha(input.widget)
    : (collection?.surfaceAlpha ?? 100);
  const surfaceSolid = over(surface, background, surfaceAlpha);

  // Direção do relevo: no escuro as camadas sobem para o branco; no claro, descem para o preto.
  const lift = input.mode === "dark" ? "#ffffff" : "#000000";
  // `--muted` costuma vir em rgb()/color-mix() nos temas da casa, e aí `firstHex` não acha hex
  // nenhum — por isso o degrau próprio, em vez de mandar o bloco alternativo sem cor.
  const muted =
    firstHex(tokens["--surface-2"]) ??
    firstHex(tokens["--muted"]) ??
    (surfaceSolid === background
      ? mix(background, lift, 0.08)
      : mix(background, surfaceSolid, 0.5));

  // O destaque efetivo é o da personalização livre (buildThemeColor devolve hex).
  const primary =
    buildThemeColor(clampThemeSettings(input.settings), input.mode) ??
    firstHex(tokens["--primary"]) ??
    "#7c3aed";
  // O texto que senta EM CIMA do destaque: a galeria exige a cor, e o botão depende dela.
  const onPrimary = rgbToHex(readableForeground(hexToRgb(primary), accent.hue).rgb);

  const border = firstHex(tokens["--border"]) ?? mix(surfaceSolid, lift, 0.18);

  // As superfícies onde o texto do tema nasce — é contra todas que a galeria mede o forte.
  const backdrops = [background, surfaceSolid, muted];
  const brandStrong = input.mode === "dark" ? "#f8f8f2" : "#111111";
  const strongBase = firstHex(tokens["--text-strong"]) ?? brandStrong;
  const strong = passes(strongBase, backdrops) ? strongBase : fitText(backdrops, accent.hue);

  // O secundário responde pelo fundo e pelo bloco alternativo (é o gate do servidor).
  const subtleGates = [background, muted];
  const subtleBase = firstHex(tokens["--text-subtle"]);
  const subtle =
    subtleBase && passes(subtleBase, subtleGates)
      ? subtleBase
      : softer(strong, background, subtleGates);

  // A data fica fora do gate (o app a reajusta contra a superfície real), mas o pacote exige a
  // cor: sem ela o publish responde "Cor invalida em text.date".
  const date = firstHex(tokens["--text-date"]) ?? mix(subtle, background, 0.3);

  const packageJson = JSON.stringify({
    palette: {
      background,
      surface,
      muted,
      border,
      primary,
      onPrimary,
      ...(surfaceAlpha < 100 ? { surfaceAlpha } : {}),
      text: { strong, subtle, date },
    },
  });

  return { modeDefault: input.mode, packageJson };
}
