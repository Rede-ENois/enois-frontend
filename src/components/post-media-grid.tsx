import type { PostView } from "@/types/application/feed/post-view";
import { useMediaGridController } from "@/utils/components/post/use-media-grid-controller";

import { PostMediaFullscreen } from "@/components/post-media-fullscreen";
import { PostMediaImageGrid } from "@/components/post-media-image-grid";
import { PostMediaVideo } from "@/components/post-media-video";

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

  if (videoUrl) return <PostMediaVideo videoUrl={videoUrl} />;

  return (
    <>
      <PostMediaImageGrid
        imageItems={imageItems}
        imageGridClassName={imageGridClassName}
        openFullscreen={openFullscreen}
      />
      {fullscreenUrl && (
        <PostMediaFullscreen
          fullscreenUrl={fullscreenUrl}
          closeFullscreen={closeFullscreen}
          keepFullscreenOpen={keepFullscreenOpen}
        />
      )}
    </>
  );
}
