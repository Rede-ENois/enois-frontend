import { useState } from "react";

import { texts } from "@/texts";
import type { PostView } from "@/types/application/feed/post-view";
import type { EmbedPlayerProps } from "@/types/components/post/embed-player-props";

export function LinkPreviews({ content }: Pick<PostView, "content">) {
  const urlRegex = /https?:\/\/[^\s]+/g;
  const urls = content.match(urlRegex) ?? [];
  const seen = new Set<string>();

  return (
    <>
      {urls.map((url) => {
        if (seen.has(url)) return null;
        seen.add(url);

        const video = extractVideoId(url);
        if (video) {
          return <EmbedPlayer key={url} type={video.type} id={video.id} />;
        }

        return (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center gap-3 rounded-xl border border-border-soft bg-surface-1 px-4 py-3 text-[13px] font-light transition hover:bg-surface-3"
          >
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-xs font-bold text-primary">
              {getHostnameInitials(url)}
            </div>
            <div className="min-w-0">
              <p className="truncate font-normal text-text-strong">{getHostname(url)}</p>
              <p className="truncate text-[11px] font-light text-text-subtle">{url}</p>
            </div>
          </a>
        );
      })}
    </>
  );
}

function EmbedPlayer({ type, id }: EmbedPlayerProps) {
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

function extractVideoId(url: string): EmbedPlayerProps | null {
  const patterns: [RegExp, EmbedPlayerProps["type"]][] = [
    [/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/, "youtube"],
    [/(?:dailymotion\.com\/video\/|dai\.ly\/)([a-zA-Z0-9]+)/, "dailymotion"],
    [/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/, "vimeo"],
    [/(?:twitch\.tv\/videos\/|clips\.twitch\.tv\/)([a-zA-Z0-9_-]+)/, "twitch"],
    [/twitch\.tv\/([a-zA-Z0-9_]+)\/?$/, "twitch"],
  ];

  for (const [regex, type] of patterns) {
    const match = url.match(regex);
    if (match) return { type, id: match[1] };
  }

  return null;
}

function getHostname(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function getHostnameInitials(url: string) {
  try {
    return new URL(url).hostname.slice(0, 2).toUpperCase();
  } catch {
    return texts.posts.video.icons.web;
  }
}
