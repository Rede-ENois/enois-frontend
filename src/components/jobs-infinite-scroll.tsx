import { useJobsPageContext } from "@/utils/components/jobs/use-jobs-page-context";

import { InfiniteScroll } from "@/components/infinite-scroll";

export function JobsInfiniteScroll() {
  const { hasMore, paginationLoading, loadMore } = useJobsPageContext();

  return <InfiniteScroll hasMore={hasMore} loading={paginationLoading} onLoadMore={loadMore} />;
}
