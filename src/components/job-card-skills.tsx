import type { JobCardSkillsProps } from "@/types/components/jobs/job-card-skills-props";

import { Badge } from "@/components/ui/badge";

export function JobCardSkills({ skills }: JobCardSkillsProps) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {skills.map((skill) => (
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
