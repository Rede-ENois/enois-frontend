import type { VideoProvider } from "@/types/application/video/video-provider";

export type VideoEmbedPlayerProps = {
  provider: VideoProvider;
  videoId: string;
};
