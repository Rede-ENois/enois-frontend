import { X } from "lucide-react";

import type { ComposerMediaPreviewProps } from "@/types/components/feed/composer-media-preview-props";

export function ComposerMediaPreview({ media, mediaType, onRemove }: ComposerMediaPreviewProps) {
  if (media.length === 0) return null;

  return (
    <div className="relative mt-3">
      {mediaType === "image" ? (
        <div className={`grid gap-2 ${media.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {media.map((item, index) => (
            <div key={item.preview} className="relative overflow-hidden rounded-xl border border-border-soft">
              <img src={item.preview} alt="" className="h-48 w-full object-cover bg-surface-1" />
              <button type="button" onClick={() => onRemove(index)} className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-surface-card/80 text-text-strong shadow hover:bg-surface-card">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-border-soft">
          <video src={media[0].preview} controls className="max-h-64 w-full bg-surface-1" />
          <button type="button" onClick={() => onRemove(0)} className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-surface-card/80 text-text-strong shadow hover:bg-surface-card">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
