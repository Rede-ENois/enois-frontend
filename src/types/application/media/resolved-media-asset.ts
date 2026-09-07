import type { MediaAsset } from "@/types/application/media/media-asset";

export type ResolvedMediaAsset = MediaAsset & {
  url: string;
};
