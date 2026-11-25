import type { StickerSuggestions } from "@rede-enois/design-system/domain";

/** O que o compositor recebe para o `:` virar figurinha: o campo do DS e as escolhas de quem compõe. */
export type AutocompleteDeFigurinhas = {
  sugestoes: StickerSuggestions;
};
