import type { SubListCollectionProps } from "@/types/components/profile/edit-profile-dialog/sub-list-collection-props";

import { SubListAddAction } from "@/components/sub-list-add-action";
import { SubListEmptyState } from "@/components/sub-list-empty-state";
import { SubListItem } from "@/components/sub-list-item";

export function SubListCollection({ items, emptyMessage, onCreate }: SubListCollectionProps) {
  return (
    <>
      {items.length === 0 ? (
        <SubListEmptyState message={emptyMessage} />
      ) : (
        items.map((item) => <SubListItem key={item.id} {...item} />)
      )}

      <SubListAddAction onCreate={onCreate} />
    </>
  );
}
