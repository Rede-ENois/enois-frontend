import { texts } from "@/texts";
import type { JobsFiltersInputsProps } from "@/types/components/jobs/jobs-filters-inputs-props";
import { Briefcase } from "lucide-react";

import { Input } from "@/components/ui/input";

export function JobsFiltersInputs({
  query,
  skills,
  onQueryChange,
  onSkillsChange,
}: JobsFiltersInputsProps) {
  const fields = [
    {
      key: "query",
      value: query,
      onChange: onQueryChange,
      placeholder: texts.jobs.searchPlaceholder,
      className: "h-9 rounded-full bg-muted pl-9",
      wrapperClassName: "relative max-w-sm flex-1",
      icon: Briefcase,
    },
    {
      key: "skills",
      value: skills,
      onChange: onSkillsChange,
      placeholder: texts.jobs.skillsPlaceholder,
      className: "h-9 max-w-xs rounded-full bg-muted",
      wrapperClassName: null,
      icon: null,
    },
  ];

  const renderInput = (field: (typeof fields)[number]) => (
    <Input
      key={field.key}
      value={field.value}
      onChange={(event) => field.onChange(event.target.value)}
      placeholder={field.placeholder}
      className={field.className}
    />
  );

  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {fields.map((field) =>
        field.wrapperClassName ? (
          <div key={field.key} className={field.wrapperClassName}>
            {field.icon && (
              <field.icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            )}
            {renderInput(field)}
          </div>
        ) : (
          renderInput(field)
        ),
      )}
    </div>
  );
}
