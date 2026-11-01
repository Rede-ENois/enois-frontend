import { useEffect, useRef } from "react";

import { type VirtualItem, useWindowVirtualizer } from "@tanstack/react-virtual";

import type { VirtualizedFeedListProps } from "@/types/components/feed/virtualized-feed-list-props";
import type { HomeTab } from "@/types/routes/feed/home-tab";
import { CaughtUpDivider } from "@rede-enois/design-system/domain";
import { InfiniteScroll } from "@rede-enois/design-system/patterns";

import { PostCard } from "@/components/post-card";

/** Estimated height of a post card in px (text-only, no media). */
const ESTIMATE_SIZE = 280;
/** Extra items rendered above/below the viewport. */
const OVERSCAN = 5;

/**
 * Measured card heights per feed tab, kept across unmounts. Opening a post unmounts the feed;
 * without this the list comes back with every unseen card at the estimate, so the saved scroll
 * offset lands on the wrong post and the list shifts as the cards measure again.
 */
// ponytail: module memory, lives for the tab session; sessionStorage if reloads must keep it.
const measurementsByTab = new Map<HomeTab, VirtualItem[]>();

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
    // Sizes are cached by key: keyed by post, a new post on top does not shift every height.
    getItemKey: (index) => posts[index].id,
    estimateSize: () => ESTIMATE_SIZE,
    initialMeasurementsCache: measurementsByTab.get(feedTab),
    overscan: OVERSCAN,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  const items = virtualizer.getVirtualItems();

  useEffect(
    () => () => {
      measurementsByTab.set(feedTab, virtualizer.measurementsCache);
    },
    [feedTab, virtualizer],
  );

  // Trigger load-more when the last virtual item is near the end.
  const lastIndex = items.at(-1)?.index;
  useEffect(() => {
    if (lastIndex === undefined) return;
    if (lastIndex >= posts.length - 3 && hasMore && !loadingMore) {
      onLoadMore();
    }
  }, [lastIndex, posts.length, hasMore, loadingMore, onLoadMore]);

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
                    <PostCard post={post} feedTab={feedTab} virtualized />
                  </div>
                ) : (
                  <PostCard post={post} feedTab={feedTab} virtualized />
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
