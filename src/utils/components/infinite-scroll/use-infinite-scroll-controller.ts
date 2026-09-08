import { useEffect, useRef } from "react";

import type { InfiniteScrollProps } from "@/types/components/infinite-scroll-props";

export function useInfiniteScrollController({ hasMore, loading, onLoadMore }: InfiniteScrollProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = sentinelRef.current;
    if (!element || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading) onLoadMore();
      },
      { rootMargin: "300px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  return {
    visible: hasMore,
    sentinelRef,
  };
}
