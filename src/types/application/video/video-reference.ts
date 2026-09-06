import type { VideoProvider } from "./video-provider";

export type VideoReference = {
  type: VideoProvider;
  id: string;
};
