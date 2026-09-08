import type { PostContentMediaProps } from "@/types/components/post/post-content-media-props";

import { MediaGrid } from "@/components/post-media-grid";

export function PostContentMedia({ mediaIds }: PostContentMediaProps) {
  return (
    <div className="mt-4">
      <MediaGrid mediaIds={mediaIds} />
    </div>
  );
}
