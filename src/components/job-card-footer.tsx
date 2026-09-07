import { texts } from "@/texts";
import type { JobCardFooterProps } from "@/types/components/jobs/job-card-footer-props";

import { Button } from "@/components/ui/button";

export function JobCardFooter({ postedAtLabel, applying, onApply }: JobCardFooterProps) {
  return (
    <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
      <span>{postedAtLabel}</span>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="rounded-full">
          {texts.jobs.details}
        </Button>

        <Button size="sm" className="rounded-full" disabled={applying} onClick={onApply}>
          {texts.jobs.apply}
        </Button>
      </div>
    </div>
  );
}
