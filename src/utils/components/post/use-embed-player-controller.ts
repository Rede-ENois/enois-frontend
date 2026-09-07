import { useState } from "react";

import { texts } from "@/texts";
import type { EmbedPlayerProps } from "@/types/components/post/embed-player-props";

export function useEmbedPlayerController({ type, id }: EmbedPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const thumbnail =
    type === "youtube"
      ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
      : type === "dailymotion"
        ? `https://www.dailymotion.com/thumbnail/video/${id}`
        : null;
  const fallbackIcon =
    type === "vimeo"
      ? texts.posts.video.icons.cinema
      : type === "twitch"
        ? texts.posts.video.icons.television
        : texts.posts.video.icons.play;
  const providerLabel = type === "youtube" ? "YouTube" : type;
  const srcs: Record<string, string> = {
    youtube: `https://www.youtube.com/embed/${id}?autoplay=1`,
    vimeo: `https://player.vimeo.com/video/${id}?autoplay=1`,
    dailymotion: `https://www.dailymotion.com/embed/video/${id}?autoplay=1`,
    twitch: `https://player.twitch.tv/?video=${id}&parent=${typeof window !== "undefined" ? window.location.hostname : ""}&autoplay=true`,
  };

  return {
    playing,
    startPlaying: () => setPlaying(true),
    thumbnail,
    fallbackIcon,
    watchLabel: texts.posts.video.watchOn(providerLabel),
    src: srcs[type] ?? "",
  };
}
