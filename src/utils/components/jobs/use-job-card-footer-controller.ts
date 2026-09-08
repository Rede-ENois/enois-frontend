import { texts } from "@/texts";
import { useJobCardContext } from "@/utils/components/jobs/use-job-card-context";

export function useJobCardFooterController() {
  const { postedAtLabel, applying, apply } = useJobCardContext();

  return {
    postedAtLabel,
    actions: [
      {
        key: "details",
        label: texts.jobs.details,
        variant: "outline" as const,
        disabled: false,
        onClick: undefined,
      },
      {
        key: "apply",
        label: texts.jobs.apply,
        variant: "default" as const,
        disabled: applying,
        onClick: apply,
      },
    ],
  };
}
