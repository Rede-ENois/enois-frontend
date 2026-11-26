import { useEffect, useMemo, useRef, useState } from "react";

import { texts } from "@/texts";
import type { AutocompleteDeFigurinhas } from "@/types/components/emotes/autocomplete-de-figurinhas";
import type { FigurinhaComunidadeItem } from "@rede-enois/design-system/domain";
import type { StickerQueryState, StickerSuggestions } from "@rede-enois/design-system/domain";

import { consultaDeFigurinha } from "@/lib/figurinhas/autocomplete";
import { teclasDoMenuDeFigurinhas } from "@/lib/figurinhas/sugestoes";
import { useFigurinhasSugeridas } from "@/lib/figurinhas/use-figurinhas";

/**
 * O `:palavra` do campo de escrita virando figurinha.
 *
 * O campo do DS (`MentionTextarea`) só sabe onde o `:palavra` começa e acaba; aqui ficam as
 * escolhas: qual termo está sendo buscado, qual item está em destaque e o que o Enter faz. O menu
 * é do DS (portal no `body`, preso ao campo) e sai com a mesma cara do seletor de figurinhas.
 *
 * `escolha` recebe o código escolhido e o trecho `:palavra` ao qual ele pertence — o campo é quem
 * troca o texto (`replaceStickerQuery`), então o que está na tela na hora do Enter é o que muda.
 */
export function useAutocompleteDeFigurinhas(
  escolha: (codigo: string, consulta: StickerQueryState) => void,
): AutocompleteDeFigurinhas {
  const [consulta, setConsulta] = useState<StickerQueryState | null>(null);
  const [destaque, setDestaque] = useState(0);
  const termo = consulta?.query ?? "";

  const { opcoes, carregando } = useFigurinhasSugeridas(termo, consulta !== null);

  // O campo guarda o `stickerSuggestions` de um render só: o menu e as teclas leem o estado mais
  // novo por aqui, senão uma seta escolheria o item da lista anterior.
  const agora = useRef({ consulta, destaque, escolha, opcoes, carregando });
  agora.current = { consulta, destaque, escolha, opcoes, carregando };

  useEffect(() => {
    setDestaque(0);
  }, [termo]);

  const escolher = useRef<(codigo: string) => void>(() => undefined);
  escolher.current = (codigo) => {
    const atual = agora.current;
    if (!atual.consulta) return;
    setConsulta(null);
    setDestaque(0);
    atual.escolha(codigo, atual.consulta);
  };

  const sugestoes = useMemo<StickerSuggestions>(
    () => ({
      resolve: consultaDeFigurinha,
      render: (anchor) => {
        const atual = agora.current;
        if (!atual.consulta) return null;
        return {
          id: "composer-figurinhas",
          opcoes: atual.opcoes.map((opcao) => ({
            id: opcao.code,
            code: opcao.code,
            nome: opcao.nome,
            src: opcao.url,
            origem: texts.figurinhas.origem[opcao.kind],
          })),
          destaque: atual.destaque,
          destaqueId: atual.opcoes[atual.destaque]?.code,
          carregando: atual.carregando,
          loadingLabel: texts.figurinhas.composer.loading,
          listLabel: texts.figurinhas.composer.suggestions,
          onEscolher: (codigo: string) => escolher.current(codigo),
          onDestacar: setDestaque,
          anchor,
        };
      },
      onKeyDown: (evento) =>
        teclasDoMenuDeFigurinhas({
          opcoes: agora.current.opcoes,
          destaque: agora.current.destaque,
          onDestacar: setDestaque,
          onEscolher: (codigo: string) => escolher.current(codigo),
          onFechar: () => setConsulta(null),
        })(evento),
    }),
    [],
  );

  return { sugestoes };
}
