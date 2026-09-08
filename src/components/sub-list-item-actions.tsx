import type { SubListItemActionsProps } from "@/types/components/profile/edit-profile-dialog/sub-list-item-actions-props";
import { Pencil, Trash2 } from "lucide-react";

export function SubListItemActions({ onEdit, onRemove }: SubListItemActionsProps) {
  const actions = [
    {
      key: "edit",
      icon: Pencil,
      onClick: onEdit,
      className: "grid h-8 w-8 place-items-center rounded-lg hover:bg-surface-2",
      iconClassName: "h-4 w-4 text-text-subtle",
    },
    {
      key: "delete",
      icon: Trash2,
      onClick: onRemove,
      className:
        "grid h-8 w-8 place-items-center rounded-lg hover:bg-surface-2 hover:text-destructive",
      iconClassName: "h-4 w-4",
    },
  ];

  return (
    <div className="flex items-center gap-1">
      {actions.map((action) => (
        <button key={action.key} onClick={action.onClick} className={action.className}>
          <action.icon className={action.iconClassName} />
        </button>
      ))}
    </div>
  );
}
