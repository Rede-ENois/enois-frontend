import { useMemo } from "react";

import {
  type EditorSticker,
  type PostRichTextProps,
  RichText as RichTextView,
} from "@rede-enois/design-system/domain";

import { apiUrl } from "@/lib/api-client";
import { ENOIS_CUSTOM_EMOJIS } from "@/lib/emotes/enois-pack";
import { useEmoteIndex, useEmoteText } from "@/lib/emotes/use-emotes";

import { InlineMedia } from "./inline-media";

/**
 * O desenho da figurinha quando quem desenha é o app. O tamanho vem por classe, e não pelo desenho
 * de anexo: no comentário a figurinha estava saindo no tamanho da mídia anexada, empurrando a
 * altura da frase (issue #1100). Quando o leitor do design system já conhece o mapa de figurinhas,
 * a classe vem dele e nada aqui é usado.
 */
const CLASSE_DA_FIGURINHA = "enois-figurinha";

/** Endereços do pacote É Nóis: a figurinha que o próprio app publica. */
const ENDERECOS_ENOIS = new Set(ENOIS_CUSTOM_EMOJIS.map((emoji) => emoji.src));

/** Endereços de figurinha que texto antigo ainda guarda (o catálogo de hoje sai do nosso backend). */
const CDN_DE_FIGURINHA = /^https:\/\/cdn\.(betterttv\.net|frankerfacez\.com)\//;

/**
 * Endereço de figurinha: o catálogo do backend, o pacote É Nóis ou o CDN de onde texto antigo veio.
 * A comparação é sobre o endereço ANTES de passar pelo `resolveMediaUrl` do app — o resolvedor
 * manda caminho relativo para o CDN de mídia, e figurinha é endereço do próprio app, não mídia
 * anexada. Imagem anexada de verdade (foto, print) não casa com nenhum dos três e segue com o
 * desenho de mídia, que é o de antes.
 */
function ehFigurinha(url: string, ehMidiaNossa: (url: string) => boolean): boolean {
  return (
    ehMidiaNossa(url) &&
    (/\/emotes\/image\//.test(url) || ENDERECOS_ENOIS.has(url) || CDN_DE_FIGURINHA.test(url))
  );
}

/**
 * O mapa que o leitor consulta por código (issue #1100). O índice do backend guarda o caminho do
 * proxy, que em produção mora no host da API; o leitor exige endereço na origem e `apiUrl` já
 * resolve o host, então o mapa usa `apiUrl` direto — prefixar o caminho com `apiUrl` de novo dava
 * `/api/api/emotes/...`.
 */
function mapaDeFigurinhas(index: Map<string, string>): Record<string, EditorSticker> {
  const mapa: Record<string, EditorSticker> = {};
  for (const [code, url] of index) {
    mapa[code] = { url, alt: code };
  }
  for (const emoji of ENOIS_CUSTOM_EMOJIS) {
    mapa[emoji.code] = { url: apiUrl(emoji.src), alt: emoji.code };
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
 * O mapa vai junto com o texto (`inlineStickers`): quando ele existe, o leitor desenha o código
 * como figurinha no tamanho do texto. Sem o mapa ele só vê imagem de mídia anexada — é o caso do
 * pacote publicado antes da issue #1100, e por isso o front também desenha as figurinhas pelo mapa
 * (issue #1100).
 */
export function RichText({ writtenAt, ...props }: PostRichTextProps & { writtenAt?: string }) {
  // Um desenho por caminho quando o leitor do design system não conhece o mapa: o do mapa continua
  // valendo primeiro, e o texto trocado cobre as figurinhas que ele não desenha.
  const index = useEmoteIndex();
  const inlineStickers = useMemo(() => mapaDeFigurinhas(index), [index]);
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
      figurinha={{ classe: CLASSE_DA_FIGURINHA, ehFigurinha }}
    />
  );
}
