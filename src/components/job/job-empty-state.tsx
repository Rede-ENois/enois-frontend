import { texts } from "@/texts";

type JobEmptyStateProps = {
  isVisible: boolean;
};

export function JobEmptyState({ isVisible }: JobEmptyStateProps) {
  return isVisible ? (
    <p className="py-12 text-center text-sm text-muted-foreground">{texts.jobs.empty}</p>
  ) : null;
}
