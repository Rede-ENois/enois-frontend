import type { SubListItemActionsProps } from "@/types/components/profile/edit-profile-dialog/sub-list-item-actions-props";
import { Pencil, Trash2 } from "lucide-react";

export function SubListItemActions({ onEdit, onRemove }: SubListItemActionsProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onEdit}
        className="grid h-8 w-8 place-items-center rounded-lg hover:bg-surface-2"
      >
        <Pencil className="h-4 w-4 text-text-subtle" />
      </button>

      <button
        onClick={onRemove}
        className="grid h-8 w-8 place-items-center rounded-lg hover:bg-surface-2 hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
