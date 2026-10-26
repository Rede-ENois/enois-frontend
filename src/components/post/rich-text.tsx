import { type PostRichTextProps, RichText as RichTextView } from "@rede-enois/design-system/domain";

import { InlineMedia } from "./inline-media";

/**
 * Renderiza a formatação leve (markdown) de todo campo de texto que não é HTML. A menção abre o
 * perfil e o marcador `{{media:<id>}}` vira a mídia carregada pelo app.
 */
export function RichText(props: PostRichTextProps) {
  return (
    <RichTextView
      {...props}
      mentionHref={(username) => `/perfil/${username}`}
      renderMedia={(mediaId, mediaSpoiler) => (
        <InlineMedia mediaId={mediaId} mediaSpoiler={mediaSpoiler} />
      )}
    />
  );
}
