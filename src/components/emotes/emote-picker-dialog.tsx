import { useId, useState } from "react";

import { texts } from "@/texts";
import type { EmotePickerDialogProps } from "@/types/components/emotes/emote-picker-dialog-props";
import { EmotePickerIcon, EmotePickerTriggerButton } from "@rede-enois/design-system/domain";

import { ListaDoSeletor } from "./lista-do-seletor";

/**
 * Seletor de figurinhas, no formato dos chats: busca e a grade. O clique devolve o CÓDIGO
 * (`KEKW`), que entra no texto como qualquer palavra.
 *
 * A lista é UMA só — populares primeiro, depois o resto em ordem alfabética — e vem PAGINADA do
 * backend (`GET /emotes?page&limit&q`), 40 por vez. Não há filtro por coleção: quem escolhe a
 * figurinha quer achar o código, não saber de qual provedor ela veio.
 *
 * A aba É Nóis é o pacote oficial da plataforma, com a lista inteira — e só ele, nada de BTTV ou
 * FrankerFaceZ. Nada aqui fala com esses provedores: quem mantém o catálogo é o nosso backend, que
 * também serve a imagem (`/emotes/image/...`). É isso que garante que toda figurinha da lista já
 * está no cache do site — e aparece igual no texto de quem lê.
 *
 * A aba Da comunidade é o catálogo feito pela rede (`GET /figurinhas`) e a grade dele é a mesma:
 * busca e página no rodapé. Ao lado das abas fica "Enviar figurinha", que abre o mesmo formulário
 * da página de figurinhas: a publicada entra na frente da grade na hora, com o código para copiar,
 * e o que era envio vira mais uma figurinha para escolher no texto.
 *
 * Aqui ficam o estado de aberto, a aba da abertura e o botão que abre: a caixa do seletor é a
 * `ListaDoSeletor`, montada a cada abertura (e ela mesma hospeda o formulário de envio).
 */
export function EmotePickerDialog({ onOpenChange, onSelect }: EmotePickerDialogProps) {
  const [aberto, setAberto] = useState(false);
  const [abaAoAbrir, setAbaAoAbrir] = useState<"third" | "community">("third");
  // O botão anuncia o seletor por `aria-controls`: o id é o do diálogo que ele abre.
  const botaoId = useId();

  const abrir = () => {
    setAberto(true);
    onOpenChange?.(true);
  };
  const fechar = () => {
    setAberto(false);
    onOpenChange?.(false);
  };

  return (
    <>
      {/* Montada a cada abertura: a próxima começa do começo, na aba que a abertura pedir. */}
      {aberto && (
        <ListaDoSeletor
          onAbertoMudou={fechar}
          onSelect={onSelect}
          onEnviar={() => setAbaAoAbrir("community")}
          abaInicial={abaAoAbrir}
        />
      )}

      <EmotePickerTriggerButton
        id={botaoId}
        trigger={<EmotePickerIcon />}
        label={texts.emotes.button}
        onOpen={abrir}
      />
    </>
  );
}

export { EmotePickerIcon };
