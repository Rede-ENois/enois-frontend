import { type ChangeEvent, useRef, useState } from "react";

import type { MediaItem } from "@/types/components/feed/media-item";

export function useFeedComposerMedia() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleMediaSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (!isVideo && !isImage) continue;

      const hasExistingImages = media.some((item) => item.type === "image");
      const hasExistingVideo = media.some((item) => item.type === "video");

      if (isVideo && (hasExistingImages || hasExistingVideo || media.length >= 1)) break;
      if (isImage && hasExistingVideo) break;
      if (isImage && media.length >= 4) break;

      const preview = URL.createObjectURL(file);
      setMedia((previous) => [...previous, { type: isVideo ? "video" : "image", file, preview }]);
    }
    event.target.value = "";
  };

  const removeMedia = (index: number) => {
    setMedia((previous) => {
      URL.revokeObjectURL(previous[index].preview);
      return previous.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const clearMedia = () => setMedia([]);
  const mediaType = media.length > 0 ? (media[0].type === "image" ? "image" : "video") : null;

  return {
    media,
    mediaType,
    fileRef,
    handleMediaSelect,
    removeMedia,
    clearMedia,
  };
}
