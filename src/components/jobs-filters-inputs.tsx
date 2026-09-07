import { Briefcase } from "lucide-react";

import { texts } from "@/texts";
import type { JobsFiltersInputsProps } from "@/types/components/jobs/jobs-filters-inputs-props";

import { Input } from "@/components/ui/input";

export function JobsFiltersInputs({
  query,
  skills,
  onQueryChange,
  onSkillsChange,
}: JobsFiltersInputsProps) {
  return (
    <div className="mt-4 flex flex-wrap gap-3">
      <div className="relative max-w-sm flex-1">
        <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={texts.jobs.searchPlaceholder}
          className="h-9 rounded-full bg-muted pl-9"
        />
      </div>

      <Input
        value={skills}
        onChange={(event) => onSkillsChange(event.target.value)}
        placeholder={texts.jobs.skillsPlaceholder}
        className="h-9 max-w-xs rounded-full bg-muted"
      />
    </div>
  );
}
