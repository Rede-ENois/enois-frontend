export type VideoProvider = "youtube" | "dailymotion" | "vimeo" | "twitch";

export type VideoReference = {
  type: VideoProvider;
  id: string;
};
