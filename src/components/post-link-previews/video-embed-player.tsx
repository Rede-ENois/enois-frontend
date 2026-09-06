import { useState } from "react";

import { PlayIcon } from "@/assets/svgs/play-icon";
import { texts } from "@/texts";
import type { VideoEmbedPlayerProps } from "@/types/components/post-link-previews/video-embed-player-props";
import {
  getVideoEmbedUrl,
  getVideoThumbnail,
  videoPlaceholderIcons,
  videoProviderLabels,
} from "@/utils/video";

export function VideoEmbedPlayer({ provider, videoId }: VideoEmbedPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const thumbnail = getVideoThumbnail(provider, videoId);

  if (isPlaying) {
    return (
      <div className="mt-3 overflow-hidden rounded-xl border border-border-soft bg-surface-1">
        <iframe
          src={getVideoEmbedUrl(provider, videoId)}
          className="aspect-video w-full"
          allow="autoplay; fullscreen; encrypted-media"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsPlaying(true)}
      className="relative mt-3 block w-full overflow-hidden rounded-xl border border-border-soft text-left transition hover:opacity-90"
    >
      {thumbnail ? (
        <img src={thumbnail} alt="" className="aspect-video w-full bg-surface-1 object-cover" />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-surface-1">
          <div className="text-center">
            <p className="text-2xl">{videoPlaceholderIcons[provider]}</p>
            <p className="mt-1 text-[12px] font-light text-text-subtle">
              {texts.posts.video.watchOn(videoProviderLabels[provider])}
            </p>
          </div>
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur">
          <PlayIcon className="ml-0.5 h-5 w-5" />
        </div>
      </div>
    </button>
  );
}
