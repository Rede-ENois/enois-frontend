import { MapPin, Sparkles } from "lucide-react";

import { useJobApplication } from "@/lib/use-job-application";
import { texts } from "@/texts";
import type { JobCardProps } from "@/types/components/jobs/job-card-props";
import { formatPostedAt } from "@/utils/format-posted-at";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function JobCard({ job }: JobCardProps) {
  const { apply, applying } = useJobApplication(job.id);

  return (
    <article className="surface-card flex flex-col p-5">
      <div className="flex items-start gap-3">
        <Avatar type="root" className="h-12 w-12 rounded-xl">
          {job.logo && (
            <Avatar type="image" src={job.logo} alt={job.company} className="rounded-xl" />
          )}
          <Avatar type="fallback" className="rounded-xl">
            {job.company[0]}
          </Avatar>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="break-words font-semibold">{job.title}</h3>
          <p className="break-words text-sm text-muted-foreground">{job.company}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /><>{job.location}</>
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        {job.matchScore && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 font-medium text-primary">
            <Sparkles className="h-3 w-3" /><>{texts.jobs.match(job.matchScore)}</>
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
        <span>{formatPostedAt(job.postedAt)}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="rounded-full">
            {texts.jobs.details}
          </Button>
          <Button size="sm" className="rounded-full" disabled={applying} onClick={apply}>
            {texts.jobs.apply}
          </Button>
        </div>
      </div>
    </article>
  );
}
