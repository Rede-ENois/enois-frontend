import { Sparkles } from "lucide-react";

import type { JobCardMetaProps } from "@/types/components/jobs/job-card-meta-props";

export function JobCardMeta({ job, matchLabel, showSalary }: JobCardMetaProps) {
  const attributes = [
    { key: "type", value: job.type },
    { key: "level", value: job.level },
  ];

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
      {matchLabel && (
        <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 font-medium text-primary">
          <Sparkles className="h-3 w-3" />

          <>{matchLabel}</>
        </span>
      )}

      {attributes.map((attribute) => (
        <span
          key={attribute.key}
          className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground"
        >
          {attribute.value}
        </span>
      ))}

      {showSalary && (
        <span className="rounded-full bg-growth/15 px-2.5 py-1 font-medium text-growth">
          {job.salary}
        </span>
      )}
    </div>
  );
}
