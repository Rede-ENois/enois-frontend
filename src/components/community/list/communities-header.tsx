import type { ReactNode } from "react";

import { texts } from "@/texts";

export function CommunitiesHeader({ createDialog }: { createDialog: ReactNode }) {
  return (
    <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-4 sm:gap-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{texts.communities.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{texts.communities.description}</p>
      </div>
      {createDialog}
    </div>
  );
}
