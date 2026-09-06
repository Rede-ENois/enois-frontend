import type { LocalMediaType } from "./local-media-type";

export type LocalMediaItem = {
  type: LocalMediaType;
  file: File;
  preview: string;
};
