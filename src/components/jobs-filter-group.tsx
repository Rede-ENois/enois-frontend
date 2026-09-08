import { texts } from "@/texts";
import type { JobsFilterGroupProps } from "@/types/components/jobs/jobs-filter-group-props";

import { JobsFilterOptionButton } from "@/components/jobs-filter-option-button";

export function JobsFilterGroup({ label, options }: JobsFilterGroupProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-xs font-medium text-muted-foreground">
        {texts.jobs.filters[label]}
      </span>
      {options.map((option) => (
        <JobsFilterOptionButton key={option.value} option={option} />
      ))}
    </div>
  );
}
