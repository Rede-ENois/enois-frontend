import { texts } from "@/texts";
import type { MessagesSidebarProps } from "@/types/components/messages/messages-sidebar-props";
import { Search } from "lucide-react";

import { useMessagesSidebarController } from "@/utils/components/messages/use-messages-sidebar-controller";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { ConversationItem } from "@/components/conversation-item";
import { NewConversationSearch } from "@/components/new-conversation-search";

export function MessagesSidebar(props: MessagesSidebarProps) {
  const { onSelect } = props;
  const {
    sidebarClassName,
    showSearch,
    showEmptyState,
    searchToggleLabel,
    toggleSearch,
    closeSearch,
    conversations,
  } = useMessagesSidebarController(props);

  return (
    <div className={`flex flex-col border-r border-border ${sidebarClassName}`}>
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold">{texts.messages.title}</h1>

          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={toggleSearch}
          >
            {searchToggleLabel}
          </Button>
        </div>
        {showSearch ? (
          <NewConversationSearch onSelect={onSelect} onClose={closeSearch} />
        ) : (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={texts.messages.searchConversations}
              className="h-9 rounded-full bg-muted pl-9"
            />
          </div>
        )}
      </div>

      <ul className="flex-1 overflow-y-auto">
        {showEmptyState ? (
          <li className="p-4 text-center text-sm text-muted-foreground">
            {texts.messages.noConversations}
          </li>
        ) : (
          conversations.map((item) => (
            <ConversationItem
              key={item.conversation.id}
              conversation={item.conversation}
              isActive={item.isActive}
              onSelect={item.select}
            />
          ))
        )}
      </ul>
    </div>
  );
}
