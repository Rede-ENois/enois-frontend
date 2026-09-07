import { texts } from "@/texts";
import type { ReactionsDialogListProps } from "@/types/components/post/reactions-dialog-list-props";

import { ReactionsDialogListItem } from "@/components/reactions-dialog-list-item";

export function ReactionsDialogList({ items, showEmptyState }: ReactionsDialogListProps) {
  if (showEmptyState) {
    return (
      <p className="py-8 text-center text-[13px] font-light text-text-subtle">
        {texts.posts.reactions.empty}
      </p>
    );
  }

  return (
    <div className="space-y-2 pt-2">
      {items.map((item) => (
        <ReactionsDialogListItem key={item.key} item={item} />
      ))}
    </div>
  );
}
