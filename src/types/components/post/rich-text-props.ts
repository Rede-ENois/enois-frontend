export type RichTextProps = {
  content: string;
  className?: string;
  /**
   * Classe dos links e das menções. Existe porque o mesmo texto aparece em fundos diferentes (a
   * bolha da mensagem, por exemplo, é colorida) — o padrão é o azul do app.
   */
  linkClassName?: string;
  /**
   * Mídias anexadas à publicação (item 9): quando o texto tem marcadores `{{media:<id>}}`, cada
   * um cujo id está aqui vira a mídia no ponto exato do texto; anexo sem marcador segue como
   * bloco no fim (quem decide a lista é quem chama, filtrando os que foram inseridos inline).
   */
  mediaIds?: string[] | null;
  /** Oculta imagens e vídeos anexados/inline até a pessoa revelar o conteúdo. */
  mediaSpoiler?: boolean;
};
