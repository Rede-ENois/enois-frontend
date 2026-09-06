import { Pencil, Trash2 } from "lucide-react";

import type { ProfileEntryField } from "./profile-entry-list-types";

type ProfileEntryItemProps<T extends { id: string }> = {
  entry: T;
  fields: ProfileEntryField[];
  onEdit: (entry: T) => void;
  onDelete: (entryId: string) => void;
};

export function ProfileEntryItem<T extends { id: string }>({
  entry,
  fields,
  onEdit,
  onDelete,
}: ProfileEntryItemProps<T>) {
  const entryValues = entry as Record<string, unknown>;

  return (
    <div className="rounded-xl border border-border-soft p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 text-[13px] font-light">
          <p className="break-words text-text-strong">
            {String(entryValues[fields[0].key] ?? "")}
          </p>
          <p className="break-words text-text-subtle">
            {String(entryValues[fields[1]?.key] ?? "")}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(entry)}
            className="grid h-8 w-8 place-items-center rounded-lg hover:bg-surface-2"
          >
            <Pencil className="h-4 w-4 text-text-subtle" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(entry.id)}
            className="grid h-8 w-8 place-items-center rounded-lg hover:bg-surface-2 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
