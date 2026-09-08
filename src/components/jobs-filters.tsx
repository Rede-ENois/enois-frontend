import { useJobsPageContext } from "@/utils/components/jobs/use-jobs-page-context";

import { JobsFilterGroup } from "@/components/jobs-filter-group";
import { JobsFiltersHeader } from "@/components/jobs-filters-header";
import { JobsFiltersInputs } from "@/components/jobs-filters-inputs";

export function JobsFilters() {
  const { filterGroups } = useJobsPageContext();

  return (
    <div className="surface-card p-4 sm:p-6">
      <JobsFiltersHeader />

      <div className="mt-4 space-y-3">
        {filterGroups.map((group) => (
          <JobsFilterGroup key={group.label} label={group.label} options={group.options} />
        ))}
      </div>

      <JobsFiltersInputs />
    </div>
  );
}
