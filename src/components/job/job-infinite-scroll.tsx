import { useEffect, useRef } from "react";

type JobInfiniteScrollProps = {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
};

export function JobInfiniteScroll({ hasMore, isLoading, onLoadMore }: JobInfiniteScrollProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = sentinelRef.current;
    if (!element || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoading) onLoadMore();
      },
      { rootMargin: "300px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore]);

  return hasMore ? <div ref={sentinelRef} className="h-4" /> : null;
}
