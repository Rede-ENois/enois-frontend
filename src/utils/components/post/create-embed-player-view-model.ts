import { texts } from "@/texts";
import type { EmbedPlayerProps } from "@/types/components/post/embed-player-props";

export function createEmbedPlayerViewModel({ type, id }: EmbedPlayerProps, hostname: string) {
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
  const srcs: Record<EmbedPlayerProps["type"], string> = {
    youtube: `https://www.youtube.com/embed/${id}?autoplay=1`,
    vimeo: `https://player.vimeo.com/video/${id}?autoplay=1`,
    dailymotion: `https://www.dailymotion.com/embed/video/${id}?autoplay=1`,
    twitch: `https://player.twitch.tv/?video=${id}&parent=${hostname}&autoplay=true`,
  };

  return {
    thumbnail,
    fallbackIcon,
    watchLabel: texts.posts.video.watchOn(providerLabel),
    src: srcs[type],
  };
}
