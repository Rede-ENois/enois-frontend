/** As páginas gravadas de um PDF da vitrine, no lote de render do documento. */
export type PortfolioPages = {
  /** O documento a que as páginas pertencem. */
  ownerId: string;
  /** O lote da renderização (segundo segmento de `paginas/<lote>/pagina-<n>.png`). */
  batch: string;
  /** As chaves das páginas no ar, da primeira para a última. */
  keys: string[];
};
