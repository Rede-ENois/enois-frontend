import { useState } from "react";

import { texts } from "@/texts";
import type { EmbedPlayerProps } from "@/types/components/post/embed-player-props";

import { buildEmbedUrl } from "@/lib/feed/embed-url";
import { useInView } from "@/lib/feed/use-in-view";

/**
 * Player de vídeo do post.
 *
 * Sem `autoplay`: fica na capa e só monta o quadro no clique — assim um feed com vários vídeos não
 * carrega vários players de uma vez.
 *
 * Com `autoplay` (feed): toca sozinho quando a publicação entra na tela, **mudo**, que é a única
 * forma que o navegador aceita sem gesto do usuário. Ao sair da tela o quadro é desmontado, o que
 * para a reprodução (não há como pausar um player de terceiros de fora; desmontar também libera o
 * player, em vez de deixá-lo rodando escondido). Clicar na capa toca com som, porque aí o clique é
 * gesto e a regra do navegador deixa de valer.
 */
export function EmbedPlayer({ type, id, autoplay = false }: EmbedPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const { ref, inView } = useInView<HTMLDivElement>();

  const autoPlaying = autoplay && inView && !playing;
  const showPlayer = playing || autoPlaying;

  return (
    <div ref={ref} className="mt-3">
      {showPlayer ? (
        <div className="overflow-hidden rounded-xl border border-border-soft bg-surface-1">
          <iframe
            src={buildEmbedUrl(type, id, {
              autoplay: true,
              host: typeof window !== "undefined" ? window.location.hostname : "",
            })}
            title={texts.posts.video.playerTitle}
            className="aspect-video w-full"
            allow="autoplay; fullscreen; encrypted-media"
            allowFullScreen
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="relative block w-full overflow-hidden rounded-xl border border-border-soft text-left transition hover:opacity-90"
        >
          <PosterThumbnail type={type} id={id} />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-black/60 text-white shadow-lg backdrop-blur">
              <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-5 w-5">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </button>
      )}
    </div>
  );
}

/** Capa antes de tocar: miniatura do provedor (uma imagem, sem script) ou um bloco com o nome dele. */
function PosterThumbnail({ type, id }: { type: string; id: string }) {
  const thumbnail =
    type === "youtube"
      ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
      : type === "dailymotion"
        ? `https://www.dailymotion.com/thumbnail/video/${id}`
        : "";

  if (thumbnail) {
    return (
      <img
        src={thumbnail}
        alt=""
        loading="lazy"
        className="aspect-video w-full bg-surface-1 object-cover"
      />
    );
  }

  return (
    <div className="flex aspect-video w-full items-center justify-center bg-surface-1">
      <div className="text-center">
        <p className="text-2xl">
          {type === "vimeo"
            ? texts.posts.video.icons.cinema
            : type === "twitch"
              ? texts.posts.video.icons.television
              : texts.posts.video.icons.play}
        </p>

        <p className="mt-1 text-xs font-normal text-text-subtle">
          {texts.posts.video.watchOn(type === "youtube" ? "YouTube" : type)}
        </p>
      </div>
    </div>
  );
}
