import type { ThemeFile } from "@/types/lib/theme-file";
import type { ThemeFileResult } from "@/types/lib/theme-file-result";
import {
  type BackgroundStyle,
  type ThemeSettings,
  clampThemeSettings,
} from "@rede-enois/design-system/domain";

import { resolveThemeCollection } from "@/lib/theme/resolve-theme-collection";

/** Versão do formato que este app escreve e entende. */
export const THEME_FILE_VERSION = 1;

/** Extensão e nome sugeridos no download. */
export const THEME_FILE_EXTENSION = ".enois-theme";
export const THEME_FILE_DEFAULT_NAME = `tema${THEME_FILE_EXTENSION}`;

/**
 * Monta o arquivo de um tema. Puro (entra estado, sai texto) para dar para testar e para o mesmo
 * formato valer no download, no compartilhamento e na venda.
 */
export function buildThemeFile(input: {
  collection: string | null;
  settings: ThemeSettings;
  name?: string | null;
  widget?: BackgroundStyle | null;
  page?: BackgroundStyle | null;
}): string {
  const file: ThemeFile = {
    format: "enois-theme",
    version: THEME_FILE_VERSION,
    ...(input.name ? { name: input.name.trim() } : {}),
    collection: resolveThemeCollection(input.collection)?.id ?? null,
    settings: clampThemeSettings(input.settings),
    ...(input.widget ? { widget: input.widget } : {}),
    ...(input.page ? { page: input.page } : {}),
  };
  return `${JSON.stringify(file, null, 2)}\n`;
}

/**
 * Lê um arquivo de tema.
 *
 * Cada recusa tem um motivo próprio porque a tela precisa explicar o que houve: "não é JSON" e
 * "é de uma versão mais nova do app" pedem coisas diferentes de quem está importando. Nada aqui
 * confia no arquivo: coleção precisa existir no catálogo, e os números passam pelo mesmo ajuste de
 * faixa que as escolhas feitas na tela.
 */
export function parseThemeFile(text: string): ThemeFileResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, reason: "json" };
  }
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, reason: "format" };
  }

  const candidate = raw as Record<string, unknown>;
  if (candidate.format !== "enois-theme") {
    return { ok: false, reason: "format" };
  }
  const version = typeof candidate.version === "number" ? candidate.version : 0;
  if (version < 1 || version > THEME_FILE_VERSION) {
    return { ok: false, reason: "version" };
  }

  const collectionId = typeof candidate.collection === "string" ? candidate.collection : null;
  const collection = resolveThemeCollection(collectionId);
  if (collectionId !== null && collection === null) {
    // Coleção que este app não tem: importar "meio tema" seria pior que recusar.
    return { ok: false, reason: "collection" };
  }

  const settings = readSettings(candidate.settings);
  if (settings === null) {
    return { ok: false, reason: "settings" };
  }

  const widget = readOptionalBackground(candidate.widget);
  const page = readOptionalBackground(candidate.page);
  if (widget === null || page === null) {
    return { ok: false, reason: "background" };
  }

  const name =
    typeof candidate.name === "string" && candidate.name.trim() !== ""
      ? candidate.name.trim()
      : undefined;
  return {
    ok: true,
    file: {
      format: "enois-theme",
      version,
      ...(name ? { name } : {}),
      collection: collection?.id ?? null,
      settings,
      ...(widget ? { widget } : {}),
      ...(page ? { page } : {}),
    },
    collectionName: collection?.name ?? null,
  };
}

/** Direções que o app sabe desenhar (ver BackgroundStyle). */
const DIRECTIONS = ["diagonal", "vertical", "horizontal", "radial", "custom"] as const;

/** Hex de 6 dígitos: é o que o app escreve, e é o que a matemática de contraste entende. */
const HEX = /^#[0-9a-fA-F]{6}$/;

/**
 * Lê um fundo opcional do arquivo.
 *
 * Três respostas possíveis: `undefined` quando o arquivo não traz esse fundo (o tema usa o do
 * app), o fundo ajustado quando ele é válido, e `null` quando ele existe mas está torto — aí o
 * arquivo inteiro é recusado, porque aplicar um tema com o fundo pela metade é pior que não
 * aplicar. Os números fora da faixa são ajustados, como nas cores livres.
 */
function readOptionalBackground(value: unknown): BackgroundStyle | null | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const type = raw.type;
  if (type !== "solid" && type !== "gradient") {
    return null;
  }
  const colors = [raw.color, raw.from, raw.to];
  if (colors.some((color) => typeof color !== "string" || !HEX.test(color))) {
    return null;
  }
  const alphas = [raw.alpha, raw.fromAlpha, raw.toAlpha];
  if (alphas.some((alpha) => typeof alpha !== "number" || !Number.isFinite(alpha))) {
    return null;
  }

  const angle = typeof raw.angle === "number" && Number.isFinite(raw.angle) ? raw.angle : 135;
  const direction = DIRECTIONS.includes(raw.direction as (typeof DIRECTIONS)[number])
    ? (raw.direction as BackgroundStyle["direction"])
    : "diagonal";

  return {
    type,
    color: raw.color as string,
    alpha: clampPercent(raw.alpha as number),
    from: raw.from as string,
    fromAlpha: clampPercent(raw.fromAlpha as number),
    to: raw.to as string,
    toAlpha: clampPercent(raw.toAlpha as number),
    direction,
    angle: Math.min(360, Math.max(0, Math.round(angle))),
  };
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** As cores livres precisam ter forma de número; a faixa é ajustada depois, pelo clamp. */
function readSettings(value: unknown): ThemeSettings | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const settings = value as Record<string, unknown>;
  const accent = settings.accent as Record<string, unknown> | undefined;
  const background = settings.background as Record<string, unknown> | undefined;
  if (!accent || !background) {
    return null;
  }
  const numbers = [accent.hue, accent.chroma, accent.lightness, background.hue, background.chroma];
  if (numbers.some((number) => typeof number !== "number" || !Number.isFinite(number))) {
    return null;
  }
  return clampThemeSettings({
    accent: {
      hue: accent.hue as number,
      chroma: accent.chroma as number,
      lightness: accent.lightness as number,
    },
    background: { hue: background.hue as number, chroma: background.chroma as number },
  });
}
