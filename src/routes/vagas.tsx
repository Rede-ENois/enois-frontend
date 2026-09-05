import { useEffect, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { Briefcase, Loader2, MapPin, Sparkles, X } from "lucide-react";

import { jobsApi } from "@/lib/api";
import type { Job } from "@/lib/api";
import { requireAuth } from "@/lib/require-auth";
import { texts } from "@/texts";
import { mergePage } from "@/utils/collections";
import { humanizeEnumLabel } from "@/utils/string";
import { formatJobPostedAt } from "@/utils/time";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { AppContainer } from "@/components/app-container";

const LEVELS = ["JUNIOR", "MID", "SENIOR", "LEAD"];
const TYPES = ["CLT", "PJ", "FREELANCE", "INTERN"];

export const Route = createFileRoute("/vagas")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.jobs.seoTitle }] }),
  component: Vagas,
});

function Vagas() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [skills, setSkills] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [allJobs, setAllJobs] = useState<Job[]>([]);

  const filters = {
    query: query || undefined,
    level: level || undefined,
    location: location || undefined,
    type: type || undefined,
    skills: skills || undefined,
  };

  const { data: jobsData, isFetching } = useQuery({
    queryKey: ["jobs", filters, cursor],
    queryFn: () => jobsApi.list({ ...filters, cursor, limit: 10 }),
  });

  const jobs = jobsData?.items ?? [];
  const nextCursor = jobsData?.nextCursor ?? null;
  const filtersKey = JSON.stringify(filters);
  const previousFiltersKey = useRef(filtersKey);

  useEffect(() => {
    if (previousFiltersKey.current === filtersKey) return;
    setAllJobs([]);
    setCursor(null);
    previousFiltersKey.current = filtersKey;
  }, [filtersKey]);

  useEffect(() => {
    setAllJobs((current) => mergePage(current, jobs, cursor === null));
  }, [jobs, cursor]);

  const apply = useMutation({
    mutationFn: (jobId: string) => jobsApi.apply(jobId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jobs"] }),
  });

  const hasFilters = [level, location, type, skills].some(Boolean);

  const clearFilters = () => {
    setLevel("");
    setLocation("");
    setType("");
    setSkills("");
  };

  return (
    <AppContainer>
      <div className="space-y-6">
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
                onClick={clearFilters}
              >
                <X className="h-4 w-4" /> {texts.jobs.clearFilters}
              </Button>
            )}
          </div>

          <FilterGroup
            label={texts.jobs.filters.level}
            values={LEVELS}
            selected={level}
            onChange={setLevel}
            getLabel={humanizeEnumLabel}
          />
          <FilterGroup
            label={texts.jobs.filters.location}
            values={texts.jobs.filters.locations}
            selected={location}
            onChange={setLocation}
          />
          <FilterGroup
            label={texts.jobs.filters.type}
            values={TYPES}
            selected={type}
            onChange={setType}
          />

          <div className="mt-4 flex flex-wrap gap-3">
            <div className="relative max-w-sm flex-1">
              <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={texts.jobs.searchPlaceholder}
                className="h-9 rounded-full bg-muted pl-9"
              />
            </div>
            <Input
              value={skills}
              onChange={(event) => setSkills(event.target.value)}
              placeholder={texts.jobs.skillsPlaceholder}
              className="h-9 rounded-full bg-muted max-w-xs"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {allJobs.map((job) => (
            <article key={job.id} className="surface-card flex flex-col p-5">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12 rounded-xl">
                  {job.logo && (
                    <AvatarImage src={job.logo} alt={job.company} className="rounded-xl" />
                  )}
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
                  <span className="rounded-full bg-primary-soft px-2.5 py-1 font-medium text-primary inline-flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> {texts.jobs.match(job.matchScore)}
                  </span>
                )}
                <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                  {job.type}
                </span>
                <span className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                  {job.level}
                </span>
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
                    disabled={apply.isPending}
                    onClick={() => apply.mutate(job.id)}
                  >
                    {texts.jobs.apply}
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {isFetching && allJobs.length > 0 && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        <InfiniteScroll
          hasMore={Boolean(nextCursor)}
          loading={isFetching}
          onLoadMore={() => {
            if (nextCursor) setCursor(nextCursor);
          }}
        />

        {!isFetching && allJobs.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">{texts.jobs.empty}</p>
        )}
      </div>
    </AppContainer>
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
        <span className="text-xs font-medium text-muted-foreground mr-1">{label}</span>
        {values.map((value) => (
          <button
            key={value}
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

function InfiniteScroll({
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
