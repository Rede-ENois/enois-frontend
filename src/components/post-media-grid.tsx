import type { PostView } from "@/types/application/feed/post-view";
import { useMediaGridController } from "@/utils/components/post/use-media-grid-controller";

export function MediaGrid({ mediaIds }: Pick<PostView, "mediaIds">) {
  const {
    visible,
    videoUrl,
    imageItems,
    imageGridClassName,
    fullscreenUrl,
    openFullscreen,
    closeFullscreen,
    keepFullscreenOpen,
  } = useMediaGridController(mediaIds);

  if (!visible) return null;

  if (videoUrl) {
    return (
      <div className="overflow-hidden rounded-xl border border-border-soft">
        <video src={videoUrl} controls className="max-h-96 w-full bg-surface-1" />
      </div>
    );
  }

  return (
    <>
      <div className={`grid gap-2 ${imageGridClassName}`}>
        {imageItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => openFullscreen(item.url)}
            className="overflow-hidden rounded-xl border border-border-soft text-left"
          >
            <img
              src={item.url}
              alt=""
              className="h-48 w-full object-cover bg-surface-1 transition hover:scale-105"
            />
          </button>
        ))}
      </div>
      {fullscreenUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={closeFullscreen}
        >
          <img
            src={fullscreenUrl}
            alt=""
            className="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain"
            onClick={keepFullscreenOpen}
          />
        </div>
      )}
    </>
  );
}
