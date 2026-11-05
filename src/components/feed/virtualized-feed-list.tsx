import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { type VirtualItem, useWindowVirtualizer } from "@tanstack/react-virtual";

import { texts } from "@/texts";
import type { VirtualizedFeedListProps } from "@/types/components/feed/virtualized-feed-list-props";
import type { HomeTab } from "@/types/routes/feed/home-tab";
import { CaughtUpDivider } from "@rede-enois/design-system/domain";
import { InfiniteScroll } from "@rede-enois/design-system/patterns";
import { Button, useToast } from "@rede-enois/design-system/ui";

import { recordScrollDebug, scrollDebugEnabled, scrollDebugReport } from "@/lib/feed/scroll-debug";

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

  // A ref ainda é null no primeiro render, então a margem não pode ser lida durante o render:
  // ela vem de um state atualizado antes da pintura. Distância até o topo do documento (e não
  // offsetTop, que é relativo ao offsetParent); recalculada porque banners acima da lista
  // (atualizando, novos posts) mudam essa distância.
  const [scrollMargin, setScrollMargin] = useState(0);
  useLayoutEffect(() => {
    const element = listRef.current;
    if (!element) return;
    // offsetTop acumulado: nao e afetado pela barra de endereco do browser mobile
    // (getBoundingClientRect oscila quando o chrome do browser esconde/aparece).
    const measure = () => {
      let top = 0;
      let el: HTMLElement | null = element;
      while (el) {
        top += el.offsetTop;
        el = el.offsetParent as HTMLElement | null;
      }
      return Math.round(top);
    };
    const update = () =>
      setScrollMargin((prev) => {
        const next = measure();
        return prev === next ? prev : next;
      });
    update();
    // Observa so o container acima da lista (o main), nao o document inteiro.
    // O document muda de tamanho a cada scroll (virtualizer) e no mobile quando
    // a barra de endereco esconde. O main so muda quando um banner aparece/desaparece.
    if (typeof ResizeObserver === "undefined") return;
    const target = element.parentElement ?? element;
    const observer = new ResizeObserver(update);
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: posts.length,
    // Sizes are cached by key: keyed by post, a new post on top does not shift every height.
    getItemKey: (index) => posts[index].id,
    estimateSize: () => ESTIMATE_SIZE,
    initialMeasurementsCache: measurementsByTab.get(feedTab),
    overscan: OVERSCAN,
    scrollMargin,
  });

  const items = virtualizer.getVirtualItems();
  const debug = useScrollDebug(virtualizer, posts, scrollMargin);

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

      {debug && <ScrollDebugButton />}
    </div>
  );
}

/**
 * With `?debug=scroll` (see `lib/feed/scroll-debug`), records every card that changes height and
 * what the scroll did, sudden scroll jumps and every change of the post list, so a person who sees
 * the feed jump can send what happened on their device. Behavior is the same with it on: the
 * virtualizer's own resize runs untouched, the probe only reads around it.
 */
function useScrollDebug(
  virtualizer: ReturnType<typeof useWindowVirtualizer>,
  posts: { id: string }[],
  scrollMargin: number,
): boolean {
  const [debug, setDebug] = useState(false);
  // Read after mount: the server render has no URL to read, and both renders must match.
  useEffect(() => setDebug(scrollDebugEnabled()), []);

  useEffect(() => {
    if (!debug) return;
    const original = virtualizer.resizeItem;
    virtualizer.resizeItem = (index, size) => {
      const from = virtualizer.measurementsCache[index]?.size ?? 0;
      const scrollY = window.scrollY;
      original(index, size);
      if (Math.abs(size - from) < 1) return;
      recordScrollDebug({
        t: Math.round(performance.now()),
        kind: "resize",
        index,
        post: String(virtualizer.options.getItemKey(index)),
        from: Math.round(from),
        to: Math.round(size),
        scrollY: Math.round(scrollY),
        scrollAfter: Math.round(window.scrollY),
      });
    };
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) > 150) {
        recordScrollDebug({
          t: Math.round(performance.now()),
          kind: "jump",
          from: Math.round(last),
          to: Math.round(y),
        });
      }
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      virtualizer.resizeItem = original;
      window.removeEventListener("scroll", onScroll);
    };
  }, [debug, virtualizer]);

  useEffect(() => {
    if (!debug) return;
    recordScrollDebug({
      t: Math.round(performance.now()),
      kind: "list",
      count: posts.length,
      first: posts[0]?.id ?? "",
      margin: scrollMargin,
    });
  }, [debug, posts, scrollMargin]);

  return debug;
}

function ScrollDebugButton() {
  const { toast } = useToast();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(scrollDebugReport());
      toast(texts.feed.scrollDebug.copied);
    } catch {
      toast(texts.feed.scrollDebug.failed, "error");
    }
  };
  return (
    <Button
      type="button"
      size="sm"
      onClick={copy}
      className="fixed bottom-28 left-3 z-50 shadow-lg lg:bottom-4"
    >
      {texts.feed.scrollDebug.copy}
    </Button>
  );
}
