import {
  GALLERY_COLLECTION_PREFIX,
  type GalleryThemePackage,
  type ThemeCollection,
  buildGalleryCollection,
  galleryCollectionId,
} from "@rede-enois/design-system/domain";

/**
 * Temas da COMUNIDADE como coleções do motor de temas.
 *
 * A galeria publica um pacote de cores (background, surface, border, primary e o texto);
 * antes, "Aplicar" só derivava um destaque e um fundo a partir delas — o resto do tema
 * (superfícies, bordas, texto) ficava de fora, e um tema de destaque parecido com o da
 * marca parecia "não ter mudado nada". Aqui o pacote vira uma `ThemeCollection` de
 * verdade: a MESMA função que monta os temas da casa (`palette()`) expande as cores
 * recebidas em todos os tokens, então superfície, borda, texto e relevos acompanham
 * (`buildGalleryCollection`, no design system).
 *
 * O registro fica no localStorage porque o motor resolve coleções por id — inclusive
 * depois de recarregar a página, quando o CSS e o id são reaplicados do zero.
 */

const STORAGE_KEY = "connect-grow-gallery-themes";

/** Teto do registro: um navegador não precisa guardar a galeria inteira, só o que aplicou. */
const MAX_STORED = 40;

const cache = new Map<string, ThemeCollection>();

/** Guarda o pacote (para o id continuar resolvendo depois do reload) e devolve a coleção. */
export function registerGalleryCollection(theme: GalleryThemePackage): ThemeCollection {
  const collection = buildGalleryCollection(theme);
  cache.set(collection.id, collection);
  const stored = readStored().filter((item) => item.id !== theme.id);
  stored.push({ ...theme, storedAt: Date.now() });
  writeStored(stored.slice(-MAX_STORED));
  return collection;
}

/** Resolve um id de tema da comunidade; `null` quando não é da galeria ou saiu do registro. */
export function resolveGalleryCollection(id: string | null | undefined): ThemeCollection | null {
  if (!id || !id.startsWith(GALLERY_COLLECTION_PREFIX)) return null;
  const cached = cache.get(id);
  if (cached) return cached;
  const theme = readStored().find((item) => galleryCollectionId(item.id) === id);
  if (!theme) return null;
  const collection = buildGalleryCollection(theme);
  cache.set(id, collection);
  return collection;
}

function readStored(): (GalleryThemePackage & { storedAt: number })[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as (GalleryThemePackage & { storedAt: number })[];
    return Array.isArray(parsed)
      ? parsed.filter(
          (item) =>
            item &&
            typeof item.id === "string" &&
            typeof item.name === "string" &&
            typeof item.packageJson === "string",
        )
      : [];
  } catch {
    return [];
  }
}

function writeStored(items: (GalleryThemePackage & { storedAt: number })[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Cota cheia/modo privado: o tema ainda vale para esta sessão (cache em memória).
  }
}
