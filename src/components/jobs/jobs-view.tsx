import { useEffect, useRef } from "react";

import { Briefcase, Loader2, MapPin, Sparkles, X } from "lucide-react";

import type { Job } from "@/lib/api";
import { texts } from "@/texts";
import { humanizeEnumLabel } from "@/utils/string";
import { formatJobPostedAt } from "@/utils/time";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
          <Button
            size="sm"
            variant="secondary"
            className="rounded-full gap-1.5 text-muted-foreground"
            onClick={onClear}
          >
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

export function JobsGrid({
  jobs,
  applying,
  onApply,
}: {
  jobs: Job[];
  applying: boolean;
  onApply: (jobId: string) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} applying={applying} onApply={onApply} />
      ))}
    </div>
  );
}

export function JobsLoading({ visible }: { visible: boolean }) {
  return visible ? (
    <div className="flex justify-center py-6">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  ) : null;
}

export function JobsEmpty({ visible }: { visible: boolean }) {
  return visible ? (
    <p className="py-12 text-center text-sm text-muted-foreground">{texts.jobs.empty}</p>
  ) : null;
}

export function JobsInfiniteScroll({
  hasMore,
  loading,
  onLoadMore,
}: {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = sentinelRef.current;
    if (!element || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading) onLoadMore();
      },
      { rootMargin: "300px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  return hasMore ? <div ref={sentinelRef} className="h-4" /> : null;
}

function JobCard({
  job,
  applying,
  onApply,
}: {
  job: Job;
  applying: boolean;
  onApply: (jobId: string) => void;
}) {
  return (
    <article className="surface-card flex flex-col p-5">
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12 rounded-xl">
          {job.logo && <AvatarImage src={job.logo} alt={job.company} className="rounded-xl" />}
          <AvatarFallback className="rounded-xl">{job.company[0]}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="break-words font-semibold">{job.title}</h3>
          <p className="break-words text-sm text-muted-foreground">{job.company}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {job.location}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        {job.matchScore && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 font-medium text-primary">
            <Sparkles className="h-3 w-3" /> {texts.jobs.match(job.matchScore)}
          </span>
        )}
        <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">{job.type}</span>
        <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">{job.level}</span>
        {job.salary && (
          <span className="rounded-full bg-growth/15 px-2.5 py-1 font-medium text-growth">
            {job.salary}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {job.skills.map((skill) => (
          <Badge
            key={skill}
            variant="secondary"
            className="rounded-full bg-accent font-normal text-accent-foreground"
          >
            {skill}
          </Badge>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
        <span>{formatJobPostedAt(job.postedAt)}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="rounded-full">
            {texts.jobs.details}
          </Button>
          <Button
            size="sm"
            className="rounded-full"
            disabled={applying}
            onClick={() => onApply(job.id)}
          >
            {texts.jobs.apply}
          </Button>
        </div>
      </div>
    </article>
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
