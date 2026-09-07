import type { ReactionsDialogListItemProps } from "@/types/components/post/reactions-dialog-list-item-props";

import { UserAvatar } from "@/components/user-avatar";

export function ReactionsDialogListItem({ item }: ReactionsDialogListItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-surface-1 p-3">
      <UserAvatar src={item.avatar} alt={item.name} className="h-9 w-9 shrink-0" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-light text-text-strong">{item.name}</p>
      </div>

      <span className="text-xl">{item.emoji}</span>
    </div>
  );
}
