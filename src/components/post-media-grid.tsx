import { useState } from "react";

import { useQueries } from "@tanstack/react-query";

import { resolveCdnUrl } from "@/lib/api/media";
import { getMedia } from "@/lib/api/media/get-media";
import type { PostView } from "@/types/application/feed/post-view";

export function MediaGrid({ mediaIds }: Pick<PostView, "mediaIds">) {
  const queryResults = useQueries({
    queries: mediaIds.map((id) => ({
      queryKey: ["media", id],
      queryFn: () => getMedia(id),
      staleTime: 60_000,
    })),
  });

  const items = queryResults.filter((query) => query.data?.cdnUrl).map((query) => query.data!);
  const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null);

  if (items.length === 0) return null;

  const isVideo = items.some((item) => item.mimeType.startsWith("video/"));

  if (isVideo) {
    return (
      <div className="overflow-hidden rounded-xl border border-border-soft">
        <video
          src={resolveCdnUrl(items[0].cdnUrl)}
          controls
          className="max-h-96 w-full bg-surface-1"
        />
      </div>
    );
  }

  return (
    <>
      <div className={`grid gap-2 ${items.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFullscreenUrl(resolveCdnUrl(item.cdnUrl) ?? null)}
            className="overflow-hidden rounded-xl border border-border-soft text-left"
          >
            <img
              src={resolveCdnUrl(item.cdnUrl)}
              alt=""
              className="h-48 w-full object-cover bg-surface-1 transition hover:scale-105"
            />
          </button>
        ))}
      </div>
      {fullscreenUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setFullscreenUrl(null)}
        >
          <img
            src={fullscreenUrl}
            alt=""
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
