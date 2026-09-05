import { Briefcase, X } from "lucide-react";

import { texts } from "@/texts";
import { humanizeEnumLabel } from "@/utils/string";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const LEVELS = ["JUNIOR", "MID", "SENIOR", "LEAD"] as const;
const TYPES = ["CLT", "PJ", "FREELANCE", "INTERN"] as const;

export type JobFilterValues = {
  query: string;
  level: string;
  location: string;
  type: string;
  skills: string;
};

type JobsFiltersProps = {
  values: JobFilterValues;
  onChange: (field: keyof JobFilterValues, value: string) => void;
  onClear: () => void;
};

export function JobsFilters({ values, onChange, onClear }: JobsFiltersProps) {
  const hasFilters = [values.level, values.location, values.type, values.skills].some(Boolean);

  return (
    <div className="surface-card p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{texts.jobs.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{texts.jobs.description}</p>
        </div>
        {hasFilters && (
          <Button size="sm" variant="secondary" className="rounded-full gap-1.5 text-muted-foreground" onClick={onClear}>
            <X className="h-4 w-4" /> {texts.jobs.clearFilters}
          </Button>
        )}
      </div>

      <FilterGroup
        label={texts.jobs.filters.level}
        values={LEVELS}
        selected={values.level}
        onChange={(value) => onChange("level", value)}
        getLabel={humanizeEnumLabel}
      />
      <FilterGroup
        label={texts.jobs.filters.location}
        values={texts.jobs.filters.locations}
        selected={values.location}
        onChange={(value) => onChange("location", value)}
      />
      <FilterGroup
        label={texts.jobs.filters.type}
        values={TYPES}
        selected={values.type}
        onChange={(value) => onChange("type", value)}
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <div className="relative max-w-sm flex-1">
          <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={values.query}
            onChange={(event) => onChange("query", event.target.value)}
            placeholder={texts.jobs.searchPlaceholder}
            className="h-9 rounded-full bg-muted pl-9"
          />
        </div>
        <Input
          value={values.skills}
          onChange={(event) => onChange("skills", event.target.value)}
          placeholder={texts.jobs.skillsPlaceholder}
          className="h-9 max-w-xs rounded-full bg-muted"
        />
      </div>
    </div>
  );
}

function FilterGroup({
  label,
  values,
  selected,
  onChange,
  getLabel = (value) => value,
}: {
  label: string;
  values: readonly string[];
  selected: string;
  onChange: (value: string) => void;
  getLabel?: (value: string) => string;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2 first:mt-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs font-medium text-muted-foreground">{label}</span>
        {values.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(selected === value ? "" : value)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              selected === value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {getLabel(value)}
          </button>
        ))}
      </div>
    </div>
  );
}
