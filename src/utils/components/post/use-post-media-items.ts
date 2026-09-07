import { useQueries } from "@tanstack/react-query";

import type { PostView } from "@/types/application/feed/post-view";
import type { ResolvedMediaAsset } from "@/types/application/media/resolved-media-asset";

import { resolveCdnUrl } from "@/lib/api/media";
import { getMedia } from "@/lib/api/media/get-media";

export function usePostMediaItems(mediaIds: PostView["mediaIds"]): ResolvedMediaAsset[] {
  const queryResults = useQueries({
    queries: mediaIds.map((id) => ({
      queryKey: ["media", id],
      queryFn: () => getMedia(id),
      staleTime: 60_000,
    })),
  });

  return queryResults.flatMap((query) => {
    if (!query.data?.cdnUrl) return [];
    const url = resolveCdnUrl(query.data.cdnUrl);
    return url ? [{ ...query.data, url }] : [];
  });
}
