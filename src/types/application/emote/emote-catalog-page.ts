import type { EmoteCatalogItem } from "./emote-catalog-item";

/**
 * Uma página do catálogo, já filtrada pelo backend. `total` conta as figurinhas que passam na busca
 * (não o catálogo inteiro) — é o número que o seletor mostra enquanto carrega 40 por vez.
 */
export type EmoteCatalogPage = {
  items: EmoteCatalogItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  generatedAt: string;
};
