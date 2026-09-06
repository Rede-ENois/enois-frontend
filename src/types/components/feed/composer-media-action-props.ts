import type { LocalMediaItem } from "./local-media-item";
import type { LocalMediaType } from "./local-media-type";

export type ComposerMediaActionProps = {
  media: LocalMediaItem[];
  mediaType: LocalMediaType | null;
  onSelect: (files: FileList) => void;
};
