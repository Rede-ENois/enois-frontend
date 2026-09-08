import type { SubListItemProps } from "@/types/components/profile/edit-profile-dialog/sub-list-item-props";

import { SubListItemActions } from "@/components/sub-list-item-actions";
import { SubListItemContent } from "@/components/sub-list-item-content";

export function SubListItem<T extends Record<"id", string>>({
  item,
  fields,
  onEdit,
  onRemove,
}: SubListItemProps<T>) {
  return (
    <div className="rounded-xl border border-border-soft p-4">
      <div className="flex items-start justify-between gap-3">
        <SubListItemContent item={item} fields={fields} />
        <SubListItemActions
          onEdit={() => onEdit(item)}
          onRemove={() => onRemove(item.id)}
        />
      </div>
    </div>
  );
}
