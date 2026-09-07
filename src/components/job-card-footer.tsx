import { texts } from "@/texts";
import type { JobCardFooterProps } from "@/types/components/jobs/job-card-footer-props";

import { Button } from "@/components/ui/button";

export function JobCardFooter({ postedAtLabel, applying, onApply }: JobCardFooterProps) {
  const actions = [
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
      onClick: onApply,
    },
  ];

  return (
    <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
      <span>{postedAtLabel}</span>

      <div className="flex gap-2">
        {actions.map((action) => (
          <Button
            key={action.key}
            size="sm"
            variant={action.variant}
            className="rounded-full"
            disabled={action.disabled}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
