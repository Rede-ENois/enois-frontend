import { Briefcase, X } from "lucide-react";

import { JOB_FILTERS } from "@/constants/job-filters";
import { texts } from "@/texts";
import type { JobsFiltersProps } from "@/types/components/jobs/jobs-filters-props";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function JobsFilters({
  query,
  level,
  location,
  type,
  skills,
  onQueryChange,
  onLevelChange,
  onLocationChange,
  onTypeChange,
  onSkillsChange,
  onClear,
}: JobsFiltersProps) {
  const hasFilters = Boolean(level || location || type || skills);

  return (
    <div className="surface-card p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{texts.jobs.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{texts.jobs.description}</p>
        </div>
        {hasFilters && (
          <Button
            size="sm"
            variant="secondary"
            className="rounded-full gap-1.5 text-muted-foreground"
            onClick={onClear}
          >
            <X className="h-4 w-4" /><>{texts.jobs.clearFilters}</>
          </Button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-muted-foreground">
            {texts.jobs.filters.level}
          </span>
          {JOB_FILTERS.levels.map((item) => (
            <button
              key={item}
              onClick={() => onLevelChange(level === item ? "" : item)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                level === item
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.charAt(0) + item.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-muted-foreground">
            {texts.jobs.filters.location}
          </span>
          {JOB_FILTERS.locations.map((item, index) => (
            <button
              key={item}
              onClick={() => onLocationChange(location === item ? "" : item)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                location === item
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {texts.jobs.filters.locations[index]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-muted-foreground">
            {texts.jobs.filters.type}
          </span>
          {JOB_FILTERS.types.map((item) => (
            <button
              key={item}
              onClick={() => onTypeChange(type === item ? "" : item)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                type === item
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

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
    </div>
  );
}
