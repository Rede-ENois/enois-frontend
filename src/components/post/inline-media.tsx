import { useQuery } from "@tanstack/react-query";

import { InlineMedia as InlineMediaView } from "@rede-enois/design-system/domain";

import { mediaApi } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { isPdfMedia } from "@/lib/pdf/pdf-url";
import { useLiteMode } from "@/lib/use-lite-mode";

import { PdfAttachmentCard } from "./pdf-attachment-card";

/** Uma mídia NO MEIO do texto: busca o anexo pelo id e entrega para o design system desenhar. */
export function InlineMedia({
  mediaId,
  mediaSpoiler = false,
}: {
  mediaId: string;
  mediaSpoiler?: boolean;
}) {
  const lite = useLiteMode();
  const { data: media } = useQuery({
    queryKey: ["media", mediaId],
    queryFn: () => mediaApi.get(mediaId),
    staleTime: 60_000,
  });

  const pdfUrl = media && isPdfMedia(media) ? resolveCdnUrl(media.cdnUrl) : undefined;
  if (pdfUrl) {
    return <PdfAttachmentCard url={pdfUrl} />;
  }

  return <InlineMediaView media={media} mediaSpoiler={mediaSpoiler} lite={lite} />;
}
