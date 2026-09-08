import { Sparkles } from "lucide-react";

import { JOB_CARD_ATTRIBUTES } from "@/constants/job-card-attributes";
import { useJobCardContext } from "@/utils/components/jobs/use-job-card-context";

export function JobCardMeta() {
  const { job, matchLabel, showSalary } = useJobCardContext();

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
      {matchLabel && (
        <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 font-medium text-primary">
          <Sparkles className="h-3 w-3" />

          <>{matchLabel}</>
        </span>
      )}

      {JOB_CARD_ATTRIBUTES.map((attribute) => (
        <span
          key={attribute.key}
          className="rounded-full bg-muted px-2.5 py-1 text-muted-foreground"
        >
          {job[attribute.field]}
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
