import type { EmbedPlayerProps } from "@/types/components/post/embed-player-props";

import { useEmbedPlayerController } from "@/utils/components/post/use-embed-player-controller";

export function EmbedPlayer(props: EmbedPlayerProps) {
  const { playing, startPlaying, thumbnail, fallbackIcon, watchLabel, src } =
    useEmbedPlayerController(props);

  if (!playing) {
    return (
      <button
        type="button"
        onClick={startPlaying}
        className="relative mt-3 block w-full overflow-hidden rounded-xl border border-border-soft text-left transition hover:opacity-90"
      >
        {thumbnail ? (
          <img src={thumbnail} alt="" className="aspect-video w-full bg-surface-1 object-cover" />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-surface-1">
            <div className="text-center">
              <p className="text-2xl">{fallbackIcon}</p>

              <p className="mt-1 text-[12px] font-light text-text-subtle">{watchLabel}</p>
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
        src={src}
        className="aspect-video w-full"
        allow="autoplay; fullscreen; encrypted-media"
        allowFullScreen
      />
    </div>
  );
}
