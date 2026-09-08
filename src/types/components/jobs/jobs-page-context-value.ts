import type { Job } from "@/types/application/job/job";
import type { JobsFilterGroupProps } from "@/types/components/jobs/jobs-filter-group-props";

export type JobsPageContextValue = {
  jobs: Job[];
  query: string;
  skills: string;
  changeQuery: (value: string) => void;
  changeSkills: (value: string) => void;
  clearFilters: () => void;
  hasFilters: boolean;
  filterGroups: JobsFilterGroupProps[];
  hasMore: boolean;
  paginationLoading: boolean;
  loadMore: () => void;
  showLoadingMore: boolean;
  showEmptyState: boolean;
};
