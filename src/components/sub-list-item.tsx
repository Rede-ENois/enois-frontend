import type { SubListItemProps } from "@/types/components/profile/edit-profile-dialog/sub-list-item-props";

import { SubListItemActions } from "@/components/sub-list-item-actions";
import { SubListItemContent } from "@/components/sub-list-item-content";

export function SubListItem({ primaryText, secondaryText, onEdit, onRemove }: SubListItemProps) {
  return (
    <div className="rounded-xl border border-border-soft p-4">
      <div className="flex items-start justify-between gap-3">
        <SubListItemContent primaryText={primaryText} secondaryText={secondaryText} />
        <SubListItemActions onEdit={onEdit} onRemove={onRemove} />
      </div>
    </div>
  );
}
