import { useJobCardContext } from "@/utils/components/jobs/use-job-card-context";
import { MapPin } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";

export function JobCardIdentity() {
  const { job, companyInitial } = useJobCardContext();

  return (
    <div className="flex items-start gap-3">
      <Avatar type="root" className="h-12 w-12 rounded-xl">
        {job.logo && (
          <Avatar type="image" src={job.logo} alt={job.company} className="rounded-xl" />
        )}
        <Avatar type="fallback" className="rounded-xl">
          {companyInitial}
        </Avatar>
      </Avatar>

      <div className="min-w-0 flex-1">
        <h3 className="break-words font-semibold">{job.title}</h3>

        <p className="break-words text-sm text-muted-foreground">{job.company}</p>

        <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />

          <>{job.location}</>
        </p>
      </div>
    </div>
  );
}
