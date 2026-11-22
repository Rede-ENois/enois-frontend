import { useQueries } from "@tanstack/react-query";

import type { PostMedia } from "@/types/application/feed/post-media";
import type { PostView } from "@/types/application/feed/post-view";
import { MediaGrid as MediaGridView } from "@rede-enois/design-system/domain";

import { mediaApi } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { autoplayVideoRef } from "@/lib/feed/video-autoplay";
import { isPdfMedia } from "@/lib/pdf/pdf-url";
import { useLiteMode } from "@/lib/use-lite-mode";

import { PdfAttachmentCard } from "./pdf-attachment-card";

/**
 * Grade de mídias do post: usa as mídias que já vieram com o post (com tamanho, para o card nascer
 * na altura final) e busca por id só as que não vieram (repost citado, comentário, mensagem). Liga o
 * vídeo ao coordenador de autoplay do feed.
 */
export function MediaGrid({
  mediaIds,
  known = [],
  compact = false,
  mediaSpoiler = false,
}: Pick<PostView, "mediaIds"> & {
  known?: PostMedia[];
  compact?: boolean;
  mediaSpoiler?: boolean;
}) {
  const lite = useLiteMode();
  const knownById = new Map(known.map((media) => [media.id, media]));
  const missing = mediaIds.filter((id) => !knownById.has(id));
  const queryResults = useQueries({
    queries: missing.map((id) => ({
      queryKey: ["media", id],
      queryFn: () => mediaApi.get(id),
      staleTime: 60_000,
    })),
  });
  const fetchedById = new Map(missing.map((id, index) => [id, queryResults[index].data]));

  const items = mediaIds
    .map((id) => knownById.get(id) ?? fetchedById.get(id))
    .filter((media) => media?.cdnUrl)
    .map((media) => media!);

  const pdfItems = items.filter(isPdfMedia);
  const mediaItems = items.filter((item) => !isPdfMedia(item));

  return (
    <>
      {mediaItems.length > 0 && (
        <MediaGridView
          items={mediaItems}
          compact={compact}
          mediaSpoiler={mediaSpoiler}
          lite={lite}
          registerVideoRef={autoplayVideoRef}
        />
      )}
      {pdfItems.map((pdf) => {
        const pdfUrl = resolveCdnUrl(pdf.cdnUrl);
        return pdfUrl ? <PdfAttachmentCard key={pdf.id} url={pdfUrl} /> : null;
      })}
    </>
  );
}
