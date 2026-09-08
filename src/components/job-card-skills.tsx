import { useJobCardContext } from "@/utils/components/jobs/use-job-card-context";

import { Badge } from "@/components/ui/badge";

export function JobCardSkills() {
  const { job } = useJobCardContext();

  return (
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
  );
}
