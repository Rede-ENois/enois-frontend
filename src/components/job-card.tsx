import { JobCardFooter } from "@/components/job-card-footer";
import { JobCardIdentity } from "@/components/job-card-identity";
import { JobCardMeta } from "@/components/job-card-meta";
import { JobCardSkills } from "@/components/job-card-skills";

export function JobCard() {
  return (
    <article className="surface-card flex flex-col p-5">
      <JobCardIdentity />
      <JobCardMeta />
      <JobCardSkills />
      <JobCardFooter />
    </article>
  );
}
