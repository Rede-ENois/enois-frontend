import { Briefcase } from "lucide-react";

import { texts } from "@/texts";
import { useJobsPageContext } from "@/utils/components/jobs/use-jobs-page-context";

import { Input } from "@/components/ui/input";

export function JobsFiltersInputs() {
  const { query, skills, changeQuery, changeSkills } = useJobsPageContext();
  const fields = [
    {
      key: "query",
      value: query,
      onChange: changeQuery,
      placeholder: texts.jobs.searchPlaceholder,
      className: "h-9 rounded-full bg-muted pl-9",
      wrapperClassName: "relative max-w-sm flex-1",
      icon: Briefcase,
    },
    {
      key: "skills",
      value: skills,
      onChange: changeSkills,
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
