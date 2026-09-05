import { Plus } from "lucide-react";

import { texts } from "@/texts";

import { Button } from "@/components/ui/button";
import { ProfileSubItem } from "./profile-sub-item";
import type { ProfileSubField } from "./profile-sub-list.types";

export function ProfileSubItems<T extends { id: string }>({ items, fields, emptyMessage, onEdit, onDelete, onAdd }: {
  items: T[];
  fields: ProfileSubField[];
  emptyMessage: string;
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <>
      {items.length === 0 ? (
        <p className="py-8 text-center text-[13px] font-light text-text-subtle">{emptyMessage}</p>
      ) : (
        items.map((item) => <ProfileSubItem key={item.id} item={item} fields={fields} onEdit={onEdit} onDelete={onDelete} />)
      )}
      <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={onAdd}>
        <Plus className="h-4 w-4" /> {texts.common.add}
      </Button>
    </>
  );
}
