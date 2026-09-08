import type { JobCardProps } from "@/types/components/jobs/job-card-props";
import { useJobCardController } from "@/utils/components/jobs/use-job-card-controller";

import { JobCardFooter } from "@/components/job-card-footer";
import { JobCardIdentity } from "@/components/job-card-identity";
import { JobCardMeta } from "@/components/job-card-meta";
import { JobCardSkills } from "@/components/job-card-skills";

export function JobCard(props: JobCardProps) {
  const { job } = props;
  const controller = useJobCardController(props);

  return (
    <article className="surface-card flex flex-col p-5">
      <JobCardIdentity job={job} companyInitial={controller.companyInitial} />
      <JobCardMeta
        job={job}
        matchLabel={controller.matchLabel}
        showSalary={controller.showSalary}
      />
      <JobCardSkills skills={job.skills} />
      <JobCardFooter
        postedAtLabel={controller.postedAtLabel}
        applying={controller.applying}
        onApply={controller.apply}
      />
    </article>
  );
}
