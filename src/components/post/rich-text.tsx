import { type PostRichTextProps, RichText as RichTextView } from "@rede-enois/design-system/domain";

import { useEmoteText } from "@/lib/emotes/use-emotes";

import { InlineMedia } from "./inline-media";

/**
 * Renderiza a formatação leve (markdown) de todo campo de texto que não é HTML. A menção abre o
 * perfil e o marcador `{{media:<id>}}` vira a mídia carregada pelo app.
 *
 * Antes de entregar o texto, os códigos do catálogo de figurinhas viram a imagem inline: `:KEKW:` no
 * banco continua `:KEKW:` para quem edita, e quem lê vê a figurinha no meio da frase. `writtenAt` é a
 * data do texto: o que foi escrito antes do prefixo `:` também troca o código solto (issue #556).
 */
export function RichText({ writtenAt, ...props }: PostRichTextProps & { writtenAt?: string }) {
  const content = useEmoteText(props.content, writtenAt);

  return (
    <RichTextView
      {...props}
      content={content}
      mentionHref={(username) => `/perfil/${username}`}
      renderMedia={(mediaId, mediaSpoiler) => (
        <InlineMedia mediaId={mediaId} mediaSpoiler={mediaSpoiler} />
      )}
    />
  );
}
