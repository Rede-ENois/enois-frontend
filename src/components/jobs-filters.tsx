import { texts } from "@/texts";
import type { JobsFiltersProps } from "@/types/components/jobs/jobs-filters-props";
import { Briefcase, X } from "lucide-react";

import { createJobsFiltersViewModel } from "@/utils/components/jobs/create-jobs-filters-view-model";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function JobsFilters(props: JobsFiltersProps) {
  const { query, skills, onQueryChange, onSkillsChange, onClear } = props;
  const { hasFilters, levelOptions, locationOptions, typeOptions } =
    createJobsFiltersViewModel(props);

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
            <X className="h-4 w-4" />

            <>{texts.jobs.clearFilters}</>
          </Button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-muted-foreground">
            {texts.jobs.filters.level}
          </span>
          {levelOptions.map((option) => (
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
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-muted-foreground">
            {texts.jobs.filters.location}
          </span>
          {locationOptions.map((option) => (
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
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-muted-foreground">
            {texts.jobs.filters.type}
          </span>
          {typeOptions.map((option) => (
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
