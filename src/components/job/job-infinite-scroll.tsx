import { useEffect, useRef } from "react";

import type { JobInfiniteScrollProps } from "@/types/components/job/job-infinite-scroll-props";

export function JobInfiniteScroll({ hasMore, isLoading, onLoadMore }: JobInfiniteScrollProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => { const element = sentinelRef.current; if (!element || !hasMore) return; const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting && !isLoading) onLoadMore(); }, { rootMargin: "300px" }); observer.observe(element); return () => observer.disconnect(); }, [hasMore, isLoading, onLoadMore]);
  return hasMore ? <div ref={sentinelRef} className="h-4" /> : null;
}
