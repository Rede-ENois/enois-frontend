import type { PostView } from "@/types/application/feed/post-view";

import { createMediaGridViewModel } from "@/utils/components/post/create-media-grid-view-model";
import { useMediaFullscreen } from "@/utils/components/post/use-media-fullscreen";
import { usePostMediaItems } from "@/utils/components/post/use-post-media-items";

export function useMediaGridController(mediaIds: PostView["mediaIds"]) {
  const items = usePostMediaItems(mediaIds);
  const fullscreen = useMediaFullscreen();

  return {
    ...createMediaGridViewModel(items),
    ...fullscreen,
  };
}
