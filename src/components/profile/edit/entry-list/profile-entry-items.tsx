import { Plus } from "lucide-react";

import { texts } from "@/texts";

import { Button } from "@/components/ui/button";
import { ProfileEntryItem } from "./profile-entry-item";
import type { ProfileEntryField } from "./profile-entry-list-types";

type ProfileEntryItemsProps<T extends { id: string }> = {
  entries: T[];
  fields: ProfileEntryField[];
  emptyMessage: string;
  onEdit: (entry: T) => void;
  onDelete: (entryId: string) => void;
  onAdd: () => void;
};

export function ProfileEntryItems<T extends { id: string }>({
  entries,
  fields,
  emptyMessage,
  onEdit,
  onDelete,
  onAdd,
}: ProfileEntryItemsProps<T>) {
  return (
    <>
      {entries.length === 0 ? (
        <p className="py-8 text-center text-[13px] font-light text-text-subtle">{emptyMessage}</p>
      ) : (
        entries.map((entry) => (
          <ProfileEntryItem
            key={entry.id}
            entry={entry}
            fields={fields}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      )}
      <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={onAdd}>
        <Plus className="h-4 w-4" /> {texts.common.add}
      </Button>
    </>
  );
}
