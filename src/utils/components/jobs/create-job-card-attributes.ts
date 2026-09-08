import { JOB_CARD_ATTRIBUTES } from "@/constants/job-card-attributes";
import type { Job } from "@/types/application/job/job";

export function createJobCardAttributes(job: Job) {
  return JOB_CARD_ATTRIBUTES.map((attribute) => ({
    ...attribute,
    value: job[attribute.field],
  }));
}
