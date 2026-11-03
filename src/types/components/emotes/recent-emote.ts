/**
 * Uma figurinha usada recentemente, guardada neste aparelho (issue #555).
 *
 * O caminho da miniatura vem junto com o código: a aba Recentes precisa desenhar a figurinha que a
 * pessoa acabou de usar mesmo com o índice do catálogo vazio ou ainda carregando.
 */
export type RecentEmote = {
  code: string;
  /** `null` para entrada salva antes de a miniatura existir; o índice do catálogo preenche. */
  thumb: string | null;
};
