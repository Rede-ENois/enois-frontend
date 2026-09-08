import { texts } from "@/texts";
import type { SubListAddActionProps } from "@/types/components/profile/edit-profile-dialog/sub-list-add-action-props";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SubListAddAction({ onCreate }: SubListAddActionProps) {
  return (
    <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={onCreate}>
      <Plus className="h-4 w-4" />

      <>{texts.common.add}</>
    </Button>
  );
}
