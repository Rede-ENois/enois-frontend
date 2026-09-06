import type { LocalMediaItem, LocalMediaType } from "./local-media";

export type ComposerMediaActionProps = {
  media: LocalMediaItem[];
  mediaType: LocalMediaType | null;
  onSelect: (files: FileList) => void;
};
