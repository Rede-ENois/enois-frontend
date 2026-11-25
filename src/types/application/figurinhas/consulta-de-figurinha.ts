/**
 * O `:palavra` que está sendo digitado no texto — o mesmo formato do campo do DS
 * (`StickerQueryState`), para o campo e a tela falarem do mesmo recorte.
 */
export type ConsultaDeFigurinha = {
  /** Início do `:` na string. */
  start: number;
  /** Fim do trecho digitado (o cursor). */
  end: number;
  /** O que foi digitado depois dos dois-pontos, já em minúsculas. */
  query: string;
};
