import { useQueries } from "@tanstack/react-query";

import type { PostView } from "@/types/application/feed/post-view";
import { MediaGrid as MediaGridView } from "@rede-enois/design-system/domain";

import { mediaApi } from "@/lib/api";
import { autoplayVideoRef } from "@/lib/feed/video-autoplay";
import { useLiteMode } from "@/lib/use-lite-mode";

/** Grade de mídias do post: busca cada anexo e liga o vídeo ao coordenador de autoplay do feed. */
export function MediaGrid({
  mediaIds,
  compact = false,
  mediaSpoiler = false,
}: Pick<PostView, "mediaIds"> & { compact?: boolean; mediaSpoiler?: boolean }) {
  const lite = useLiteMode();
  const queryResults = useQueries({
    queries: mediaIds.map((id) => ({
      queryKey: ["media", id],
      queryFn: () => mediaApi.get(id),
      staleTime: 60_000,
    })),
  });

  const items = queryResults.filter((q) => q.data?.cdnUrl).map((q) => q.data!);

  return (
    <MediaGridView
      items={items}
      compact={compact}
      mediaSpoiler={mediaSpoiler}
      lite={lite}
      registerVideoRef={autoplayVideoRef}
    />
  );
}
