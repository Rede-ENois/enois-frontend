import { type MouseEvent, useState } from "react";

import { useQueries } from "@tanstack/react-query";

import type { PostView } from "@/types/application/feed/post-view";

import { resolveCdnUrl } from "@/lib/api/media";
import { getMedia } from "@/lib/api/media/get-media";

export function useMediaGridController(mediaIds: PostView["mediaIds"]) {
  const queryResults = useQueries({
    queries: mediaIds.map((id) => ({
      queryKey: ["media", id],
      queryFn: () => getMedia(id),
      staleTime: 60_000,
    })),
  });
  const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null);
  const items = queryResults
    .filter((query) => query.data?.cdnUrl)
    .map((query) => query.data!)
    .map((item) => ({ ...item, url: resolveCdnUrl(item.cdnUrl) }));
  const video = items.find((item) => item.mimeType.startsWith("video/"));

  return {
    visible: items.length > 0,
    videoUrl: video?.url ?? null,
    imageItems: video ? [] : items,
    imageGridClassName: items.length === 1 ? "grid-cols-1" : "grid-cols-2",
    fullscreenUrl,
    openFullscreen: (url: string) => setFullscreenUrl(url),
    closeFullscreen: () => setFullscreenUrl(null),
    keepFullscreenOpen: (event: MouseEvent<HTMLImageElement>) => event.stopPropagation(),
  };
}
