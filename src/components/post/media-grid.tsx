import { useState } from "react";

import { useQueries } from "@tanstack/react-query";

import type { PostView } from "@/types/application/feed/post-view";

import { mediaApi } from "@/lib/api";
import { resolveCdnUrl, withImageKitOriginal } from "@/lib/api/media";
import { autoplayVideoRef } from "@/lib/feed/video-autoplay";

import { texts } from "@/texts";
import { LiteVideo } from "./lite-video";
import { SpoilerMedia } from "./spoiler-media";

/** Grade de mídias do post (vídeo único ou imagens) com visualização em tela cheia.
 *
 * `compact` encolhe as imagens para caber em espacos apertados (comentarios) sem quebrar
 * a largura em telas pequenas.
 */
export function MediaGrid({
  mediaIds,
  compact = false,
  mediaSpoiler = false,
}: Pick<PostView, "mediaIds"> & { compact?: boolean; mediaSpoiler?: boolean }) {
  const queryResults = useQueries({
    queries: mediaIds.map((id) => ({
      queryKey: ["media", id],
      queryFn: () => mediaApi.get(id),
      staleTime: 60_000,
    })),
  });

  const items = queryResults.filter((q) => q.data?.cdnUrl).map((q) => q.data!);
  const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null);

  if (items.length === 0) return null;

  const isVideo = items.some((m) => m.mimeType.startsWith("video/"));

  // Áudio (gravado no comentário): player com controles, sem autoplay — som que começa sozinho no
  // meio de uma conversa é o oposto do que esta rede quer.
  if (items.some((m) => m.mimeType.startsWith("audio/"))) {
    return (
      <div className="rounded-xl border border-border-soft bg-surface-1 p-2">
        <audio
          src={withImageKitOriginal(items[0].cdnUrl)}
          controls
          preload="metadata"
          className="w-full"
        />
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className="overflow-hidden rounded-xl border border-border-soft">
        <SpoilerMedia active={mediaSpoiler} label={texts.posts.mediaSpoiler.reveal}>
          {(revealed) => (
            <LiteVideo
              src={withImageKitOriginal(items[0].cdnUrl)}
              registerRef={revealed ? autoplayVideoRef : undefined}
            />
          )}
        </SpoilerMedia>
      </div>
    );
  }

  return (
    <>
      {/* 1:1 (pedido da comunidade): a imagem ocupa um quadrado e o recorte é sempre o mesmo,
          em vez da faixa de altura fixa que cortava fotos altas ou largas. */}
      <SpoilerMedia active={mediaSpoiler} label={texts.posts.mediaSpoiler.reveal}>
        {() => (
          <div
            className={`grid gap-2 ${items.length === 1 ? "grid-cols-1" : "grid-cols-2"} ${
              compact ? "max-w-[280px]" : ""
            }`}
          >
            {items.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setFullscreenUrl(resolveCdnUrl(m.cdnUrl) ?? null)}
                className="overflow-hidden rounded-xl border border-border-soft text-left"
              >
                <img
                  src={resolveCdnUrl(m.cdnUrl)}
                  alt=""
                  loading="lazy"
                  className="aspect-square w-full bg-surface-1 object-cover transition hover:scale-105"
                />
              </button>
            ))}
          </div>
        )}
      </SpoilerMedia>
      {fullscreenUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setFullscreenUrl(null)}
        >
          <img
            src={fullscreenUrl}
            alt=""
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
