import type { FeedComposerMediaPreviewProps } from "@/types/components/feed/feed-composer-media-preview-props";

export function createFeedComposerMediaPreviewViewModel({
  media,
  onRemove,
}: FeedComposerMediaPreviewProps) {
  const mediaType = media[0]?.type ?? null;

  return {
    visible: media.length > 0,
    showImages: mediaType === "image",
    imageGridClassName: media.length === 1 ? "grid-cols-1" : "grid-cols-2",
    imageItems: media.map((item, index) => ({
      key: `${item.preview}-${index}`,
      item,
      remove: () => onRemove(index),
    })),
    videoItem:
      mediaType === "video" && media[0]
        ? {
            item: media[0],
            remove: () => onRemove(0),
          }
        : null,
  };
}
