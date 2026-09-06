import type { LocalMediaItem, LocalMediaType } from "./local-media";

export type ComposerMediaPreviewProps = {
  media: LocalMediaItem[];
  mediaType: LocalMediaType | null;
  onRemove: (index: number) => void;
};
