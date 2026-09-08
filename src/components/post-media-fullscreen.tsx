import type { PostMediaFullscreenProps } from "@/types/components/post/post-media-fullscreen-props";

export function PostMediaFullscreen({
  fullscreenUrl,
  closeFullscreen,
  keepFullscreenOpen,
}: PostMediaFullscreenProps) {
  return (
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
  );
}
