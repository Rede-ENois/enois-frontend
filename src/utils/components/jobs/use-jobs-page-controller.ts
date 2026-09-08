import { createJobsFiltersViewModel } from "@/utils/components/jobs/create-jobs-filters-view-model";
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
  const filterView = createJobsFiltersViewModel(filterState.filters, setFilter);

  return {
    jobs: pagination.jobs,
    query: filterState.filters.query,
    skills: filterState.filters.skills,
    changeQuery: (value: string) => setFilter("query", value),
    changeSkills: (value: string) => setFilter("skills", value),
    clearFilters,
    hasFilters: filterView.hasFilters,
    filterGroups: filterView.groups,
    hasMore: pagination.hasMore,
    paginationLoading: pagination.isFetching,
    loadMore: pagination.loadMore,
    showLoadingMore: pagination.isFetching && pagination.jobs.length > 0,
    showEmptyState: !pagination.isFetching && pagination.jobs.length === 0,
  };
}
