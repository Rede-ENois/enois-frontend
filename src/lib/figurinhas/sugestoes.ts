import type { StickerSuggestions } from "@rede-enois/design-system/domain";

/**
 * O que o composer faz com a tecla enquanto o menu do `:` está aberto: setas andam, Enter/Tab
 * escolhem, Esc fecha. O `resolver` do campo é o `consultaDeFigurinha` (o mesmo da digitação).
 */
export function teclasDoMenuDeFigurinhas({
  opcoes,
  destaque,
  onDestacar,
  onEscolher,
  onFechar,
}: {
  opcoes: readonly { code: string }[];
  destaque: number;
  onDestacar: (indice: number) => void;
  onEscolher: (codigo: string) => void;
  onFechar: () => void;
}): NonNullable<StickerSuggestions["onKeyDown"]> {
  return (evento) => {
    if (opcoes.length === 0) return false;
    if (evento.key === "ArrowDown") {
      onDestacar((destaque + 1) % opcoes.length);
      return true;
    }
    if (evento.key === "ArrowUp") {
      onDestacar((destaque - 1 + opcoes.length) % opcoes.length);
      return true;
    }
    if (evento.key === "Tab" || evento.key === "Enter") {
      const escolhida = opcoes[destaque];
      if (escolhida) onEscolher(escolhida.code);
      return true;
    }
    if (evento.key === "Escape") {
      onFechar();
      return true;
    }
    return false;
  };
}
