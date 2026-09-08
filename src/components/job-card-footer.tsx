import { useJobCardFooterController } from "@/utils/components/jobs/use-job-card-footer-controller";

import { Button } from "@/components/ui/button";

export function JobCardFooter() {
  const { postedAtLabel, actions } = useJobCardFooterController();

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
