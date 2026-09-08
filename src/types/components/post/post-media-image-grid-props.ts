import type { ResolvedMediaAsset } from "@/types/application/media/resolved-media-asset";

export type PostMediaImageGridProps = {
  imageItems: ResolvedMediaAsset[];
  imageGridClassName: string;
  openFullscreen: (url: string) => void;
};
