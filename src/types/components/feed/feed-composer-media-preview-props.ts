import type { MediaItem } from "@/types/components/feed/media-item";

export type FeedComposerMediaPreviewProps = {
  media: MediaItem[];
  onRemove: (index: number) => void;
};
