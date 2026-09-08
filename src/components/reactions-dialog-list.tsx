import { texts } from "@/texts";
import { useReactionsDialogContext } from "@/utils/components/post/use-reactions-dialog-context";

import { ReactionsDialogListItem } from "@/components/reactions-dialog-list-item";

export function ReactionsDialogList() {
  const { items, showEmptyState } = useReactionsDialogContext();

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
