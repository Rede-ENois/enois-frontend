import type { MediaItem } from "@/types/components/feed/media-item";

export function createFeedComposerMediaPreviewViewModel(
  media: MediaItem[],
  removeMedia: (index: number) => void,
) {
  const mediaType = media[0]?.type ?? null;

  return {
    visible: media.length > 0,
    showImages: mediaType === "image",
    imageGridClassName: media.length === 1 ? "grid-cols-1" : "grid-cols-2",
    imageItems: media.map((item, index) => ({
      key: `${item.preview}-${index}`,
      item,
      remove: () => removeMedia(index),
    })),
    videoItem:
      mediaType === "video" && media[0]
        ? {
            item: media[0],
            remove: () => removeMedia(0),
          }
        : null,
  };
}
