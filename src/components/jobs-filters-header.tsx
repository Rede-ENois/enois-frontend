import { X } from "lucide-react";

import { texts } from "@/texts";
import { useJobsPageContext } from "@/utils/components/jobs/use-jobs-page-context";

import { Button } from "@/components/ui/button";

export function JobsFiltersHeader() {
  const { hasFilters, clearFilters } = useJobsPageContext();

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{texts.jobs.title}</h1>

        <p className="mt-1 text-sm text-muted-foreground">{texts.jobs.description}</p>
      </div>

      {hasFilters && (
        <Button
          size="sm"
          variant="secondary"
          className="rounded-full gap-1.5 text-muted-foreground"
          onClick={clearFilters}
        >
          <X className="h-4 w-4" />

          <>{texts.jobs.clearFilters}</>
        </Button>
      )}
    </div>
  );
}
