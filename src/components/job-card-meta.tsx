import { createJobCardAttributes } from "@/utils/components/jobs/create-job-card-attributes";
import { useJobCardContext } from "@/utils/components/jobs/use-job-card-context";
import { Sparkles } from "lucide-react";

export function JobCardMeta() {
  const { job, matchLabel, showSalary } = useJobCardContext();
  const attributes = createJobCardAttributes(job);

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
