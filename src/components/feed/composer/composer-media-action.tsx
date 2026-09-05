import { useRef } from "react";

import { Film, Image } from "lucide-react";

import { texts } from "@/texts";
import type { LocalMediaItem, LocalMediaType } from "@/utils/media";

import { ComposerAction } from "./composer-action";

export function ComposerMediaAction({
  media,
  mediaType,
  onSelect,
}: {
  media: LocalMediaItem[];
  mediaType: LocalMediaType | null;
  onSelect: (files: FileList) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaLabels: Record<LocalMediaType, string> = {
    image: texts.feed.composer.mediaCount(media.length),
    video: texts.feed.composer.video,
  };
  const label = mediaType ? mediaLabels[mediaType] : texts.feed.composer.media;
  const MediaIcon = mediaType === "video" ? Film : Image;

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(event) => {
          if (event.target.files?.length) onSelect(event.target.files);
          event.target.value = "";
        }}
      />
      <ComposerAction
        icon={MediaIcon}
        label={label}
        active={media.length > 0}
        onClick={() => fileRef.current?.click()}
      />
    </>
  );
}
