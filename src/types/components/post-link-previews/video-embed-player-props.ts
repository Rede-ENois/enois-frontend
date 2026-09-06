import type { VideoProvider } from "@/types/application/video/video-reference";

export type VideoEmbedPlayerProps = {
  provider: VideoProvider;
  videoId: string;
};
