import type { NewConversationSearchResultItemProps } from "@/types/components/messages/new-conversation-search-result-item-props";
import { useCreateDirectConversation } from "@/utils/components/messages/use-create-direct-conversation";

import { UserAvatar } from "@/components/user-avatar";

export function NewConversationSearchResultItem({ user }: NewConversationSearchResultItemProps) {
  const createConversation = useCreateDirectConversation();

  return (
    <button
      onClick={() => createConversation(user.id)}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-muted"
    >
      <UserAvatar src={user.avatar} alt={user.name} className="h-10 w-10" />

      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{user.name}</p>

        <p className="truncate text-xs text-muted-foreground">{user.headline}</p>
      </div>
    </button>
  );
}
