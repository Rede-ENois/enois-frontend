import type { LocalMediaItem } from "./local-media-item";
import type { LocalMediaType } from "./local-media-type";

export type ComposerMediaPreviewProps = {
  media: LocalMediaItem[];
  mediaType: LocalMediaType | null;
  onRemove: (index: number) => void;
};
