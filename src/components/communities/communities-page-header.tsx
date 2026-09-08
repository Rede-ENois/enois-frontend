import { texts } from "@/texts";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { CreateCommunityDialogProvider } from "@/components/communities/create-community-dialog-provider";

export function CommunitiesPageHeader() {
  return (
    <header className="surface-card flex flex-wrap items-center justify-between gap-3 p-4 sm:gap-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{texts.communities.title}</h1>

        <p className="mt-1 text-sm text-muted-foreground">{texts.communities.description}</p>
      </div>

      <CreateCommunityDialogProvider>
        <Button className="rounded-full gap-1.5">
          <Plus className="h-4 w-4" />

          <>{texts.communities.createCommunity}</>
        </Button>
      </CreateCommunityDialogProvider>
    </header>
  );
}
