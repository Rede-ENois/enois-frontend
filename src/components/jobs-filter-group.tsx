import { texts } from "@/texts";
import type { JobsFilterGroupProps } from "@/types/components/jobs/jobs-filter-group-props";

export function JobsFilterGroup({ label, options }: JobsFilterGroupProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-xs font-medium text-muted-foreground">
        {texts.jobs.filters[label]}
      </span>

      {options.map((option) => (
        <button
          key={option.value}
          onClick={option.onSelect}
          className={`rounded-full border px-3 py-1 text-xs transition ${
            option.selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
