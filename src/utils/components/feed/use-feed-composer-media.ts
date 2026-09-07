import { type ChangeEvent, useRef, useState } from "react";

import type { MediaItem } from "@/types/components/feed/media-item";

import { appendFeedComposerMedia } from "@/utils/components/feed/append-feed-composer-media";
import { revokeFeedComposerMedia } from "@/utils/components/feed/revoke-feed-composer-media";

export function useFeedComposerMedia() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleMediaSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setMedia((current) => appendFeedComposerMedia(current, Array.from(files)));
    event.target.value = "";
  };

  const removeMedia = (index: number) => {
    setMedia((current) => {
      const removed = current[index];
      if (removed) URL.revokeObjectURL(removed.preview);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const clearMedia = () => {
    setMedia((current) => {
      revokeFeedComposerMedia(current);
      return [];
    });
  };

  return {
    media,
    mediaType: media[0]?.type ?? null,
    fileRef,
    handleMediaSelect,
    removeMedia,
    clearMedia,
  };
}
