import type { InfiniteScrollProps } from "@/types/components/infinite-scroll-props";
import { useInfiniteScrollController } from "@/utils/components/infinite-scroll/use-infinite-scroll-controller";

export function InfiniteScroll(props: InfiniteScrollProps) {
  const { visible, sentinelRef } = useInfiniteScrollController(props);

  if (!visible) return null;

  return <div ref={sentinelRef} className="h-4" />;
}
