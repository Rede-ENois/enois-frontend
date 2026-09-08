import type { JobsFiltersProps } from "@/types/components/jobs/jobs-filters-props";
import { createJobsFiltersViewModel } from "@/utils/components/jobs/create-jobs-filters-view-model";

import { JobsFilterGroup } from "@/components/jobs-filter-group";
import { JobsFiltersHeader } from "@/components/jobs-filters-header";
import { JobsFiltersInputs } from "@/components/jobs-filters-inputs";

export function JobsFilters(props: JobsFiltersProps) {
  const { query, skills, onQueryChange, onSkillsChange, onClear } = props;
  const { hasFilters, groups } = createJobsFiltersViewModel(props);

  return (
    <div className="surface-card p-4 sm:p-6">
      <JobsFiltersHeader hasFilters={hasFilters} onClear={onClear} />

      <div className="mt-4 space-y-3">
        {groups.map((group) => (
          <JobsFilterGroup key={group.label} label={group.label} options={group.options} />
        ))}
      </div>

      <JobsFiltersInputs
        query={query}
        skills={skills}
        onQueryChange={onQueryChange}
        onSkillsChange={onSkillsChange}
      />
    </div>
  );
}
