import { THEME_COLLECTIONS, type ThemeCollection } from "@rede-enois/design-system/domain";

import { resolveGalleryCollection } from "./gallery-collections";

/**
 * Resolve o identificador para um tema da coleção.
 *
 * Identificador inválido (ou tema removido em uma versão futura) devolve `null` —
 * e a aplicação cai no padrão da marca, nunca num tema pela metade.
 */
export function resolveThemeCollection(id: string | null | undefined): ThemeCollection | null {
  if (!id) return null;
  const daCasa = THEME_COLLECTIONS.find((collection) => collection.id === id);
  // Temas da COMUNIDADE (publicados na galeria) são coleções registradas no navegador —
  // sem esta busca, aplicar um deles e recarregar a página perdia o tema (o id não resolvia).
  return daCasa ?? resolveGalleryCollection(id);
}
