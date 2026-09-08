import { useJobsFiltersInputsController } from "@/utils/components/jobs/use-jobs-filters-inputs-controller";

import { Input } from "@/components/ui/input";

export function JobsFiltersInputs() {
  const { fields } = useJobsFiltersInputsController();

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
