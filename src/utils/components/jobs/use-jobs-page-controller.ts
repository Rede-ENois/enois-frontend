import { createJobsFilterProps } from "@/utils/components/jobs/create-jobs-filter-props";
import { createListJobsParams } from "@/utils/components/jobs/create-list-jobs-params";
import { useJobsFilterState } from "@/utils/components/jobs/use-jobs-filter-state";
import { useJobsPagination } from "@/utils/components/jobs/use-jobs-pagination";

export function useJobsPageController() {
  const filterState = useJobsFilterState();
  const pagination = useJobsPagination(createListJobsParams(filterState.filters));

  const setFilter = (field: keyof typeof filterState.filters, value: string) => {
    filterState.setFilter(field, value);
    pagination.reset();
  };
  const clearFilters = () => {
    filterState.clearNonQueryFilters();
    pagination.reset();
  };

  return {
    jobs: pagination.jobs,
    filtersProps: createJobsFilterProps(filterState.filters, setFilter, clearFilters),
    infiniteScrollProps: {
      hasMore: pagination.hasMore,
      loading: pagination.isFetching,
      onLoadMore: pagination.loadMore,
    },
    showLoadingMore: pagination.isFetching && pagination.jobs.length > 0,
    showEmptyState: !pagination.isFetching && pagination.jobs.length === 0,
  };
}
