import { useState } from "react";

import { texts } from "@/texts";
import {
  extractUniqueUrls,
  extractVideoReference,
  getUrlMetadata,
  getVideoEmbedUrl,
  getVideoThumbnail,
  videoPlaceholderIcons,
  videoProviderLabels,
  type VideoProvider,
} from "@/utils/video";

function EmbedPlayer({ type, id }: { type: VideoProvider; id: string }) {
  const [playing, setPlaying] = useState(false);
  const thumbnail = getVideoThumbnail(type, id);

  if (!playing) {
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
              <p className="text-2xl">{videoPlaceholderIcons[type]}</p>
              <p className="mt-1 text-[12px] font-light text-text-subtle">
                {texts.posts.video.watchOn(videoProviderLabels[type])}
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

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-border-soft bg-surface-1">
      <iframe
        src={getVideoEmbedUrl(type, id)}
        className="aspect-video w-full"
        allow="autoplay; fullscreen; encrypted-media"
        allowFullScreen
      />
    </div>
  );
}

export function PostLinkPreviews({ content }: { content: string }) {
  return (
    <>
      {extractUniqueUrls(content).map((url) => {
        const video = extractVideoReference(url);
        if (video) {
          return <EmbedPlayer key={url} type={video.type} id={video.id} />;
        }

        const metadata = getUrlMetadata(url);
        return (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center gap-3 rounded-xl border border-border-soft bg-surface-1 px-4 py-3 text-[13px] font-light transition hover:bg-surface-3"
          >
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-xs font-bold text-primary">
              {metadata.initials}
            </div>
            <div className="min-w-0">
              <p className="truncate font-normal text-text-strong">{metadata.hostname}</p>
              <p className="truncate text-[11px] font-light text-text-subtle">{url}</p>
            </div>
          </a>
        );
      })}
    </>
  );
}
