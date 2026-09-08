import { X } from "lucide-react";

import { createFeedComposerMediaPreviewViewModel } from "@/utils/components/feed/create-feed-composer-media-preview-view-model";
import { useFeedComposerContext } from "@/utils/components/feed/use-feed-composer-context";

export function FeedComposerMediaPreview() {
  const { media, removeMedia } = useFeedComposerContext();
  const { visible, showImages, imageGridClassName, imageItems, videoItem } =
    createFeedComposerMediaPreviewViewModel(media, removeMedia);

  if (!visible) return null;

  return (
    <div className="relative mt-3">
      {showImages ? (
        <div className={`grid gap-2 ${imageGridClassName}`}>
          {imageItems.map(({ key, item, remove }) => (
            <div
              key={key}
              className="relative overflow-hidden rounded-xl border border-border-soft"
            >
              <img src={item.preview} alt="" className="h-48 w-full object-cover bg-surface-1" />

              <button
                type="button"
                onClick={remove}
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-surface-card/80 text-text-strong shadow hover:bg-surface-card"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        videoItem && (
          <div className="relative overflow-hidden rounded-xl border border-border-soft">
            <video src={videoItem.item.preview} controls className="max-h-64 w-full bg-surface-1" />

            <button
              type="button"
              onClick={videoItem.remove}
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-surface-card/80 text-text-strong shadow hover:bg-surface-card"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      )}
    </div>
  );
}
