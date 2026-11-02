import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

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

  // A ref ainda é null no primeiro render, então a margem não pode ser lida durante o render:
  // ela vem de um state atualizado antes da pintura. Distância até o topo do documento (e não
  // offsetTop, que é relativo ao offsetParent); recalculada porque banners acima da lista
  // (atualizando, novos posts) mudam essa distância.
  const [scrollMargin, setScrollMargin] = useState(0);
  useLayoutEffect(() => {
    const element = listRef.current;
    if (!element) return;
    const update = () =>
      setScrollMargin(Math.round(element.getBoundingClientRect().top + window.scrollY));
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, []);

  // Tamanhos medidos ficam em cache pela chave do item. Sem chave estável o padrão é o índice:
  // um post novo no topo (refetch a cada 30s) desloca todos os índices e cada card herda a
  // altura medida de outro, o que faz a lista pular.
  const getItemKey = useCallback((index: number) => posts[index]?.id ?? index, [posts]);

  const virtualizer = useWindowVirtualizer({
    count: posts.length,
    estimateSize: () => ESTIMATE_SIZE,
    overscan: OVERSCAN,
    scrollMargin,
    getItemKey,
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
