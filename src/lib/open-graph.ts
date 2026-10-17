import { texts } from "@/texts";
import type { PostView } from "@/types/application/feed/post-view";
import type { ShareMeta } from "@/types/lib/open-graph/share-meta";

import { resolveCdnUrl } from "@/lib/api/media";

/**
 * Monta o metadado da miniatura de um post compartilhado.
 *
 * Quem lê isto é o rastreador do WhatsApp/Telegram/X/LinkedIn: ele recebe o HTML do servidor e nada
 * mais — sem sessão, sem JS. Então o texto do post e a imagem têm de estar no `<head>` da página, e
 * a imagem tem de ser um endereço https fechado (o CDN do ImageKit é), não um endpoint da API.
 *
 * Recortes: título curto (é o que aparece em negrito), descrição em ~160 caracteres e imagem em
 * 1200×630 — a proporção que as plataformas esperam. O ImageKit faz esse recorte na hora, então a
 * foto do post vira miniatura sem ninguém precisar gerar arquivo: `tr=w-1200,h-630,fo-auto` para
 * imagem e `/ik-thumbnail.jpg` para vídeo (o quadro do vídeo).
 */
const DESCRIPTION_LIMIT = 160;
const TITLE_LIMIT = 70;
const IMAGE_TRANSFORM = "tr=w-1200%2Ch-630%2Cfo-auto";
const VIDEO_THUMB_TRANSFORM = "tr=w-1200%2Ch-630";

/** Vírgula não pode ir crua no `tr` quando o endereço já tem query (o CDN devolve 400). */

export function buildPostShareMeta(input: {
  post: PostView;
  /** URL absoluta e canônica do post (o link que a pessoa compartilhou). */
  postUrl: string;
  /** Imagem de marca usada quando o post não tem mídia (endereço absoluto). */
  fallbackImageUrl: string;
  /**
   * Cartão desenhado pelo servidor com o TEXTO da página (endereço absoluto), só para posts do tipo
   * página. É o que faz a miniatura mostrar o que a pessoa escreveu em vez da imagem de marca.
   */
  pagePreviewUrl?: string | null;
  /** Tipo e endereço da primeira mídia do post, quando houver (buscados à parte). */
  media?: { mimeType: string | null; cdnUrl: string | null } | null;
}): ShareMeta {
  const { post, postUrl, fallbackImageUrl, pagePreviewUrl, media } = input;
  const author = post.authorName || `@${post.authorUsername}`;
  const text = collapse(post.content);

  const isPage = post.type === "PAGE";
  const title = isPage
    ? `${author} publicou uma página`
    : text
      ? excerpt(text, TITLE_LIMIT)
      : `${author} publicou no Énóis`;

  const description = isPage
    ? `Página publicada por ${author} no Énóis.`
    : text
      ? `${excerpt(text, DESCRIPTION_LIMIT)} · ${author}`
      : `Publicação de ${author} no Énóis.`;

  const mediaUrl = resolveCdnUrl(media?.cdnUrl ?? null);
  const mimeType = media?.mimeType ?? "";
  const isVideo = mimeType.startsWith("video/");

  // As transformações e miniaturas de vídeo são recursos do ImageKit, não do S3.
  const isImageKit = mediaUrl ? new URL(mediaUrl).hostname === "ik.imagekit.io" : false;
  const isImage = mimeType.startsWith("image/");
  const imageUrl =
    isPage && pagePreviewUrl
      ? pagePreviewUrl
      : !mediaUrl
        ? fallbackImageUrl
        : isVideo
          ? isImageKit
            ? `${mediaUrl}/ik-thumbnail.jpg?${VIDEO_THUMB_TRANSFORM}`
            : fallbackImageUrl
          : isImage
            ? isImageKit
              ? `${mediaUrl}${mediaUrl.includes("?") ? "&" : "?"}${IMAGE_TRANSFORM}`
              : mediaUrl
            : fallbackImageUrl;

  return {
    title,
    description,
    url: postUrl,
    imageUrl,
    imageAlt: isPage
      ? `Página publicada por ${author}`
      : isVideo
        ? `Vídeo publicado por ${author}`
        : `Publicação de ${author}`,
    videoUrl: mimeType === "video/mp4" ? (mediaUrl ?? null) : null,
    type: isVideo ? "video.other" : "article",
  };
}

function collapse(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function excerpt(text: string, limit: number): string {
  if (text.length <= limit) return text;
  // Corta na última palavra inteira: miniatura com palavra picada lê pior que miniatura menor.
  const cut = text.slice(0, limit);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * Miniatura padrão: a da página inicial. Toda página que não tiver texto ou imagem própria cai aqui,
 * e o `__root` emite estes mesmos valores para que nenhuma rota fique sem Open Graph.
 */
export const DEFAULT_SHARE = {
  title: texts.landing.seo.title,
  description: texts.landing.seo.description,
  ogDescription: texts.landing.seo.ogDescription,
  imageUrl: `${texts.siteUrl}/icons/icon-512.png`,
  imageAlt: texts.brand.name,
} as const;

/** Só as tags Open Graph e do card do Twitter/X, sem `<title>` nem `description`. */
export function buildOpenGraphTags(input: {
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  imageAlt: string;
}) {
  const description = excerpt(collapse(input.description), DESCRIPTION_LIMIT);
  return [
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: texts.brand.name },
    { property: "og:locale", content: "pt_BR" },
    { property: "og:title", content: input.title },
    { property: "og:description", content: description },
    { property: "og:url", content: input.url },
    { property: "og:image", content: input.imageUrl },
    { property: "og:image:alt", content: input.imageAlt },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: input.title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: input.imageUrl },
    { name: "twitter:image:alt", content: input.imageAlt },
  ];
}

/** Metadados para paginas publicas, emitidos no HTML inicial do servidor. */
export function buildShareTags(input: {
  title: string;
  description: string;
  /** Texto da miniatura, quando difere da `description` de busca. */
  ogDescription?: string;
  url: string;
  imageUrl: string;
  imageAlt: string;
}) {
  return [
    { title: input.title },
    { name: "description", content: excerpt(collapse(input.description), DESCRIPTION_LIMIT) },
    ...buildOpenGraphTags({ ...input, description: input.ogDescription ?? input.description }),
  ];
}

/**
 * Atalho para as rotas: só o `path` é obrigatório; o que faltar vem da página inicial
 * (`DEFAULT_SHARE`). Imagem vazia (perfil sem foto, vaga sem logo) também cai no padrão.
 */
export function buildPageShareTags(input: {
  path: string;
  title?: string;
  description?: string;
  imageUrl?: string | null;
  imageAlt?: string;
}) {
  const hasOwnDescription = Boolean(input.description);
  return buildShareTags({
    title: input.title ?? DEFAULT_SHARE.title,
    description: input.description || DEFAULT_SHARE.description,
    ogDescription: hasOwnDescription ? undefined : DEFAULT_SHARE.ogDescription,
    url: `${texts.siteUrl}${input.path}`,
    imageUrl: input.imageUrl || DEFAULT_SHARE.imageUrl,
    imageAlt: input.imageAlt ?? input.title ?? DEFAULT_SHARE.imageAlt,
  });
}
