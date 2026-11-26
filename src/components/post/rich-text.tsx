import { useMemo } from "react";

import {
  type EditorSticker,
  type PostRichTextProps,
  RichText as RichTextView,
} from "@rede-enois/design-system/domain";

import { emoteImageUrl } from "@/lib/emotes/api";
import { ENOIS_CUSTOM_EMOJIS } from "@/lib/emotes/enois-pack";
import { useEmoteIndex, useEmoteText } from "@/lib/emotes/use-emotes";
import { useFigurinhasDoTexto } from "@/lib/figurinhas/use-figurinhas";

import { InlineMedia } from "./inline-media";

/**
 * O mapa que o leitor consulta por código (issue #1100). O índice do backend já chega com o host
 * da API (`emoteIndex` aplica `apiUrl` ao caminho do proxy), então ele entra como está — prefixar de
 * novo dava `/api/api/emotes/...`. O pacote É Nóis é do próprio app (`/emojis/...`) e passa pelo
 * mesmo montador de endereço, que deixa o caminho do app como ele é.
 */
function mapaDeFigurinhas(index: Map<string, string>): Record<string, EditorSticker> {
  // Só o código entre dois-pontos é figurinha (issue #1149): a chave solta faria o leitor trocar
  // toda palavra que também é código ("Pedro") por imagem.
  const mapa: Record<string, EditorSticker> = {};
  for (const [code, url] of index) {
    mapa[`:${code}:`] = { url, alt: code };
  }
  // `emoteImageUrl` (e não `apiUrl`): o `/emojis/...` do pacote é servido pelo APP. Mandá-lo para o
  // host da API — que responde 200 sem corpo nesse caminho — deixava a figurinha do pacote sem
  // imagem, com o texto alternativo ("enois_like") aparecendo no lugar dela.
  for (const emoji of ENOIS_CUSTOM_EMOJIS) {
    mapa[`:${emoji.code}:`] = { url: emoteImageUrl(emoji.src), alt: emoji.code };
  }
  return mapa;
}

/**
 * Renderiza a formatação leve (markdown) de todo campo de texto que não é HTML. A menção abre o
 * perfil e o marcador `{{media:<id>}}` vira a mídia carregada pelo app.
 *
 * Antes de entregar o texto, os códigos do catálogo de figurinhas viram a imagem inline: `:KEKW:` no
 * banco continua `:KEKW:` para quem edita, e quem lê vê a figurinha no meio da frase. `writtenAt` é a
 * data do texto: o que foi escrito antes do prefixo `:` também troca o código solto (issue #556).
 *
 * O mapa vai junto com o texto (`inlineStickers`): com ele o leitor desenha o código como figurinha
 * no tamanho do texto. Sem o mapa ele só vê imagem de mídia anexada, que é o que a figurinha estava
 * virando (issue #1100).
 *
 * As figurinhas da comunidade (`:nomedacomunidade:`) entram pelo mesmo mapa, resolvidas pelo índice
 * do catálogo da comunidade — só as ativas. A origem de cada uma (oficial ou da comunidade) fica
 * no mapa, e por isso nenhuma das duas é confundida com a outra.
 */
export function RichText({ writtenAt, ...props }: PostRichTextProps & { writtenAt?: string }) {
  const index = useEmoteIndex();
  const daComunidade = useFigurinhasDoTexto(props.content);
  const inlineStickers = useMemo(() => {
    const mapa = mapaDeFigurinhas(index);
    for (const figurinha of daComunidade.values()) {
      // O endereço já é o público (CDN/S3): vai como está, sem passar pelo montador de proxy.
      if (!mapa[`:${figurinha.code}:`]) {
        mapa[`:${figurinha.code}:`] = { url: figurinha.url, alt: figurinha.code };
      }
    }
    return mapa;
  }, [index, daComunidade]);
  const content = useEmoteText(props.content, writtenAt);

  return (
    <RichTextView
      {...props}
      content={content}
      inlineStickers={inlineStickers}
      mentionHref={(username) => `/perfil/${username}`}
      renderMedia={(mediaId, mediaSpoiler) => (
        <InlineMedia mediaId={mediaId} mediaSpoiler={mediaSpoiler} />
      )}
    />
  );
}
