import { queryOptions } from "@tanstack/react-query";

import type { PostMedia } from "@/types/application/feed/post-media";
import type { UploadedMedia } from "@/types/media-upload/uploaded-media";
import type { VlogAttachment } from "@/types/media-upload/vlog-attachment";

import { mediaApi } from "@/lib/api/media";

/** Teto do post do blog no servidor (`BlogService.MAX_POST_MEDIA`). */
export const BLOG_POST_MEDIA_LIMIT = 8;

/** O anexo já subiu e pode entrar no `mediaIds` do post? */
export function uploadedMediaIds(attachments: VlogAttachment[]): string[] {
  return attachments.flatMap((attachment) => (attachment.media ? [attachment.media.mediaId] : []));
}

/**
 * Anexo importado (post antigo, rascunho restaurado): o id já existe no servidor e não sobe de
 * novo, mas a leitura precisa da mesma forma que o `MediaGrid` desenha.
 */
export function importedMedia(id: string, cdnUrl: string | null): UploadedMedia {
  return { mediaId: id, cdnUrl };
}

/** Busca a mídia já publicada para a leitura desenhar o anexo com a URL certa. */
export async function loadPublishedMedia(mediaIds: string[]): Promise<PostMedia[]> {
  const assets = await Promise.all(mediaIds.map((id) => mediaApi.get(id).catch(() => null)));
  return assets.flatMap((asset) =>
    asset?.cdnUrl
      ? [
          {
            id: asset.id,
            cdnUrl: asset.cdnUrl,
            mimeType: asset.mimeType,
            width: asset.width ?? null,
            height: asset.height ?? null,
          },
        ]
      : [],
  );
}

/**
 * As mídias de um post do blog para a leitura. Fica no cache do react-query com a mesma chave do
 * `MediaGrid` (`["media", id]`), então o card do feed reaproveita o que a página já buscou.
 */
export function blogMediaQuery(mediaIds: string[]) {
  return queryOptions({
    queryKey: ["blog", "media", ...mediaIds],
    queryFn: () => loadPublishedMedia(mediaIds),
    enabled: mediaIds.length > 0,
    staleTime: 60_000,
    placeholderData: [] as PostMedia[],
  });
}
