import { useEffect, useRef, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { Loader2 } from "lucide-react";

import { jobsApi } from "@/lib/api/jobs";
import { requireAuth } from "@/lib/require-auth";
import { texts } from "@/texts";
import type { Job } from "@/types/application/job/job";

import { AppContainer } from "@/components/app-container";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { JobCard } from "@/components/job-card";
import { JobsFilters } from "@/components/jobs-filters";

export const Route = createFileRoute("/vagas")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.jobs.seoTitle }] }),
  component: Vagas,
});

function Vagas() {
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
  const prevKey = useRef(filtersKey);

  useEffect(() => {
    if (prevKey.current !== filtersKey) {
      setAllJobs([]);
      setCursor(null);
      prevKey.current = filtersKey;
    }
  }, [filtersKey]);

  useEffect(() => {
    if (cursor === null && jobs.length > 0) {
      setAllJobs(jobs);
    } else if (cursor !== null && jobs.length > 0) {
      setAllJobs((previous) => [...previous, ...jobs]);
    }
  }, [jobs, cursor]);

  const clearFilters = () => {
    setLevel("");
    setLocation("");
    setType("");
    setSkills("");
  };

  return (
    <AppContainer>
      <div className="space-y-6">
        <JobsFilters
          query={query}
          level={level}
          location={location}
          type={type}
          skills={skills}
          onQueryChange={setQuery}
          onLevelChange={setLevel}
          onLocationChange={setLocation}
          onTypeChange={setType}
          onSkillsChange={setSkills}
          onClear={clearFilters}
        />

        <div className="grid gap-4 md:grid-cols-2">
          {allJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>

        {isFetching && allJobs.length > 0 && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        <InfiniteScroll
          hasMore={!!nextCursor}
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
