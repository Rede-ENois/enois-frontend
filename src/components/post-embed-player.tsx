import { useState } from "react";

import { texts } from "@/texts";
import type { EmbedPlayerProps } from "@/types/components/post/embed-player-props";

export function EmbedPlayer({ type, id }: EmbedPlayerProps) {
  const [playing, setPlaying] = useState(false);

  if (!playing) {
    let thumbnail = "";
    if (type === "youtube") thumbnail = `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
    if (type === "dailymotion") thumbnail = `https://www.dailymotion.com/thumbnail/video/${id}`;

    return (
      <button
        type="button"
        onClick={() => setPlaying(true)}
        className="relative mt-3 block w-full overflow-hidden rounded-xl border border-border-soft text-left transition hover:opacity-90"
      >
        {thumbnail ? (
          <img src={thumbnail} alt="" className="aspect-video w-full bg-surface-1 object-cover" />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-surface-1">
            <div className="text-center">
              <p className="text-2xl">
                {type === "vimeo"
                  ? texts.posts.video.icons.cinema
                  : type === "twitch"
                    ? texts.posts.video.icons.television
                    : texts.posts.video.icons.play}
              </p>
              <p className="mt-1 text-[12px] font-light text-text-subtle">
                {texts.posts.video.watchOn(type === "youtube" ? "YouTube" : type)}
              </p>
            </div>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur">
            <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-5 w-5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </button>
    );
  }

  const srcs: Record<string, string> = {
    youtube: `https://www.youtube.com/embed/${id}?autoplay=1`,
    vimeo: `https://player.vimeo.com/video/${id}?autoplay=1`,
    dailymotion: `https://www.dailymotion.com/embed/video/${id}?autoplay=1`,
    twitch: `https://player.twitch.tv/?video=${id}&parent=${typeof window !== "undefined" ? window.location.hostname : ""}&autoplay=true`,
  };

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-border-soft bg-surface-1">
      <iframe
        src={srcs[type] ?? ""}
        className="aspect-video w-full"
        allow="autoplay; fullscreen; encrypted-media"
        allowFullScreen
      />
    </div>
  );
}
