import type { LocalMediaType } from "./local-media-type";

export type MediaRule = {
  maxItems: number;
  incompatibleWith: LocalMediaType[];
};
