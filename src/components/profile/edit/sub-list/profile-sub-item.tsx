import { Pencil, Trash2 } from "lucide-react";

import type { ProfileSubField } from "./profile-sub-list.types";

export function ProfileSubItem<T extends { id: string }>({ item, fields, onEdit, onDelete }: {
  item: T;
  fields: ProfileSubField[];
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
}) {
  const values = item as Record<string, unknown>;

  return (
    <div className="rounded-xl border border-border-soft p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 text-[13px] font-light">
          <p className="break-words text-text-strong">{String(values[fields[0].key] ?? "")}</p>
          <p className="break-words text-text-subtle">{String(values[fields[1]?.key] ?? "")}</p>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => onEdit(item)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-surface-2">
            <Pencil className="h-4 w-4 text-text-subtle" />
          </button>
          <button type="button" onClick={() => onDelete(item.id)} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-surface-2 hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
