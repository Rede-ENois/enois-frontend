import { useEffect, useRef } from "react";

import { useWindowVirtualizer } from "@tanstack/react-virtual";

import type { VirtualizedFeedListProps } from "@/types/components/feed/virtualized-feed-list-props";
import { CaughtUpDivider } from "@rede-enois/design-system/domain";
import { InfiniteScroll } from "@rede-enois/design-system/patterns";

import { PostCard } from "@/components/post-card";

/** Estimated height of a post card in px (text-only, no media). */
const ESTIMATE_SIZE = 280;
/** Extra items rendered above/below the viewport. */
const OVERSCAN = 5;

/**
 * Feed list that only mounts PostCards visible in the viewport. Uses window-level scroll
 * (not a scroll container) so the page scrollbar, scroll-to-top button and scroll
 * restoration work without changes.
 */
export function VirtualizedFeedList({
  posts,
  feedTab,
  caughtUpAt,
  firstPostRef,
  hasMore,
  loadingMore,
  onLoadMore,
  loadingLabel,
  endLabel,
}: VirtualizedFeedListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  const virtualizer = useWindowVirtualizer({
    count: posts.length,
    estimateSize: () => ESTIMATE_SIZE,
    overscan: OVERSCAN,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  const items = virtualizer.getVirtualItems();

  // Trigger load-more when the last virtual item is near the end.
  const lastItem = items[items.length - 1];
  useEffect(() => {
    if (!lastItem) return;
    if (lastItem.index >= posts.length - 3 && hasMore && !loadingMore) {
      onLoadMore();
    }
  }, [lastItem?.index, posts.length, hasMore, loadingMore, onLoadMore]);

  return (
    <div ref={listRef}>
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        <div
          className="absolute left-0 top-0 w-full"
          style={{
            transform: `translateY(${(items[0]?.start ?? 0) - virtualizer.options.scrollMargin}px)`,
          }}
        >
          {items.map((virtualRow) => {
            const post = posts[virtualRow.index];
            const isFirst = virtualRow.index === 0;
            const showDivider = virtualRow.index === caughtUpAt;

            return (
              <div
                key={post.id}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className="pb-4"
              >
                {showDivider && (
                  <div className="pb-4">
                    <CaughtUpDivider />
                  </div>
                )}

                {isFirst ? (
                  <div ref={firstPostRef}>
                    <PostCard post={post} feedTab={feedTab} />
                  </div>
                ) : (
                  <PostCard post={post} feedTab={feedTab} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <InfiniteScroll
        hasMore={hasMore}
        loading={loadingMore}
        onLoadMore={onLoadMore}
        loadingLabel={loadingLabel}
        endLabel={posts.length > 0 ? endLabel : undefined}
      />
    </div>
  );
}
