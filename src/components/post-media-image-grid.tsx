import type { PostMediaImageGridProps } from "@/types/components/post/post-media-image-grid-props";

export function PostMediaImageGrid({
  imageItems,
  imageGridClassName,
  openFullscreen,
}: PostMediaImageGridProps) {
  return (
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
  );
}
