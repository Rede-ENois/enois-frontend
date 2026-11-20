import type { UploadedMedia } from "@/types/media-upload/uploaded-media";
import type { VlogAttachment } from "@/types/media-upload/vlog-attachment";

/** Teto do post do blog no servidor (`BlogService.MAX_POST_MEDIA`). */
export const BLOG_POST_MEDIA_LIMIT = 8;

/** O anexo já subiu e pode entrar no `mediaIds` do post? */
export function uploadedMediaIds(attachments: VlogAttachment[]): string[] {
  return attachments.flatMap((attachment) => (attachment.media ? [attachment.media.mediaId] : []));
}

/**
 * Anexo importado (post antigo, rascunho restaurado): o id já existe no servidor e não sobe de
 * novo, mas o editor precisa da mesma forma que o upload devolve.
 */
export function importedMedia(id: string, cdnUrl: string | null): UploadedMedia {
  return { mediaId: id, cdnUrl };
}
