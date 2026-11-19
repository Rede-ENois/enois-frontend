/**
 * Entrada do pacote de emojis personalizados da Rede É Nóis.
 *
 * `unicode` guarda o emoji padrão equivalente (quando existe) para manter retrocompatibilidade:
 * posts, comentários e mensagens continuam salvando o caractere Unicode real (ou `:code:` para
 * expressões exclusivas) e o frontend renderiza a figurinha da marca no lugar.
 */
export type CustomEmojiEntry = {
  code: string;
  label: string;
  src: string;
  unicode: string | null;
  /** Outros caracteres Unicode que também devem renderizar este ícone (ex: variações sem FE0F). */
  unicodeAliases?: readonly string[];
  keywords: readonly string[];
};
