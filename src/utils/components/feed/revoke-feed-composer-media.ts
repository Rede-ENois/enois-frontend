import type { MediaItem } from "@/types/components/feed/media-item";

export function revokeFeedComposerMedia(media: MediaItem[]) {
  for (const item of media) URL.revokeObjectURL(item.preview);
}
