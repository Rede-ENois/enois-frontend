import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { mediaApi } from "@/lib/api";
import { resolveCdnUrl, withImageKitOriginal } from "@/lib/api/media";

import { texts } from "@/texts";
import { LiteVideo } from "./lite-video";
import { SpoilerMedia } from "./spoiler-media";

/**
 * Uma mídia NO MEIO do texto (item 9 do backlog): o render do marcador `{{media:<id>}}`.
 *
 * A mídia precisa ser anexo da publicação — o RichText só troca o marcador por aqui quando o
 * id está na lista de mídias dela, e o backend recusa na gravação qualquer marcador órfão.
 * Imagem clica para ver em tela cheia; vídeo e áudio ganham o player (sem autoplay: som que
 * começa sozinho no meio de um texto é o oposto do que esta rede quer).
 */
export function InlineMedia({ mediaId, mediaSpoiler = false }: { mediaId: string; mediaSpoiler?: boolean }) {
  const [fullscreen, setFullscreen] = useState(false);
  const { data: media } = useQuery({
    queryKey: ["media", mediaId],
    queryFn: () => mediaApi.get(mediaId),
    staleTime: 60_000,
  });

  if (!media?.cdnUrl) return null;

  if (media.mimeType.startsWith("audio/")) {
    return (
      <div className="my-2 rounded-xl border border-border-soft bg-surface-1 p-2">
        <audio
          src={withImageKitOriginal(media.cdnUrl)}
          controls
          preload="metadata"
          className="w-full"
        />
      </div>
    );
  }

  if (media.mimeType.startsWith("video/")) {
    return (
      <div className="my-2 overflow-hidden rounded-xl border border-border-soft">
        <SpoilerMedia active={mediaSpoiler} label={texts.posts.mediaSpoiler.reveal}>
          {() => (
            <LiteVideo src={withImageKitOriginal(media.cdnUrl)} />
          )}
        </SpoilerMedia>
      </div>
    );
  }

  return (
    <>
      <div className="my-2 overflow-hidden rounded-xl border border-border-soft">
        <SpoilerMedia active={mediaSpoiler} label={texts.posts.mediaSpoiler.reveal}>
          {() => (
            <button
              type="button"
              className="block w-full cursor-zoom-in"
              onClick={() => setFullscreen(true)}
            >
              <img
                src={resolveCdnUrl(media.cdnUrl)}
                alt=""
                loading="lazy"
                className="max-h-96 w-full bg-surface-1 object-cover"
              />
            </button>
          )}
        </SpoilerMedia>
      </div>

      {fullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setFullscreen(false)}
        >
          <img
            src={resolveCdnUrl(media.cdnUrl)}
            alt=""
            className="max-h-[90vh] max-w-[90vw] cursor-zoom-out rounded-2xl object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
