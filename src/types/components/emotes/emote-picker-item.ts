/**
 * Uma figurinha pronta para a grade do seletor: o `code` é o que o texto recebe e o `src` é o que
 * a `<img>` pede.
 *
 * É o mesmo formato do `EmotePickerItem` da view do DS (`EmotePickerDialogViewProps["items"]`),
 * repetido aqui porque o DS não exporta o tipo. O `tsc` quebra se os dois divergirem: a lista
 * declarada com este tipo é passada direto para `items` da view.
 */
export type EmotePickerItem = {
  code: string;
  /** Imagem já resolvida pelo app (miniatura do catálogo ou arquivo do pacote). */
  src?: string;
};
