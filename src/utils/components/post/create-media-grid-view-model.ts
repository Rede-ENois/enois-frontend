import type { ResolvedMediaAsset } from "@/types/application/media/resolved-media-asset";

export function createMediaGridViewModel(items: ResolvedMediaAsset[]) {
  const video = items.find((item) => item.mimeType.startsWith("video/"));

  return {
    visible: items.length > 0,
    videoUrl: video?.url ?? null,
    imageItems: video ? [] : items,
    imageGridClassName: items.length === 1 ? "grid-cols-1" : "grid-cols-2",
  };
}
