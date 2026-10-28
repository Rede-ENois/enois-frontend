import type { GalleryPackage } from "@/types/lib/theme/gallery-package";
import {
  type BackgroundStyle,
  type Theme,
  type ThemeSettings,
  buildThemeColor,
  clampThemeSettings,
  representativeHex,
} from "@rede-enois/design-system/domain";

import { resolveThemeCollection } from "./resolve-theme-collection";

/**
 * A PERSONALIZAÇÃO ATUAL como pacote da galeria (o formato que o marketplace vende).
 *
 * A galeria aceita um pacote de cores (fundo, superfície, borda, destaque e o texto) — e é esse o
 * denominador comum de TODA customização do Énóis: uma coleção da casa, uma combinação livre de
 * destaque/fundo ou os fundos de página/widget viram os mesmos cinco pares de cor. Assim qualquer
 * visual dá para exportar (arquivo `.enois-theme`) e vender, sem um formato por tipo.
 *
 * Quando a pessoa já tem uma coleção ativa, os tokens dela entram como base; a personalização livre
 * (destaque e fundo de página) por cima — é exatamente o que ela vê na tela.
 */

const HEX = /#[0-9a-fA-F]{6}/;

/** Primeiro hex de um token — tokens podem vir em color-mix() ou gradiente. */
function firstHex(value: string | undefined): string | null {
  if (!value) return null;
  const match = value.match(HEX);
  return match ? match[0] : null;
}

export function buildGalleryPackage(input: {
  collectionId: string | null;
  settings: ThemeSettings;
  mode: Theme;
  page?: BackgroundStyle | null;
}): GalleryPackage {
  const collection = resolveThemeCollection(input.collectionId);
  const tokens = collection?.tokens[input.mode] ?? collection?.tokens.light ?? {};
  const fallbackBackground = input.mode === "dark" ? "#141420" : "#ffffff";

  const background =
    (input.page ? representativeHex(input.page) : null) ??
    firstHex(tokens["--background"]) ??
    fallbackBackground;
  const surface = firstHex(tokens["--card"]) ?? firstHex(tokens["--surface-3"]) ?? background;
  const border = firstHex(tokens["--border"]) ?? surface;
  // O destaque efetivo é o da personalização livre (buildThemeColor devolve hex).
  const primary =
    buildThemeColor(clampThemeSettings(input.settings), input.mode) ??
    firstHex(tokens["--primary"]) ??
    "#7c3aed";
  const strong =
    firstHex(tokens["--text-strong"]) ?? (input.mode === "dark" ? "#f8f8f2" : "#111111");
  const subtle = firstHex(tokens["--text-subtle"]) ?? strong;

  const packageJson = JSON.stringify({
    palette: {
      background,
      surface,
      border,
      primary,
      text: { strong, subtle },
    },
  });

  return { modeDefault: input.mode, packageJson };
}
