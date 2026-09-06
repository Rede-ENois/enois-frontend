export type LocalMediaType = "image" | "video";

export type LocalMediaItem = {
  type: LocalMediaType;
  file: File;
  preview: string;
};

export type MediaRule = {
  maxItems: number;
  incompatibleWith: LocalMediaType[];
};
