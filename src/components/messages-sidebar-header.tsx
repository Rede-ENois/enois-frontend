import { Search } from "lucide-react";

import { texts } from "@/texts";
import type { MessagesSidebarHeaderProps } from "@/types/components/messages/messages-sidebar-header-props";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { NewConversationSearch } from "@/components/new-conversation-search";

export function MessagesSidebarHeader({
  showSearch,
  searchToggleLabel,
  onToggleSearch,
  onSelect,
  onCloseSearch,
}: MessagesSidebarHeaderProps) {
  return (
    <div className="border-b border-border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold">{texts.messages.title}</h1>

        <Button size="sm" variant="outline" className="rounded-full" onClick={onToggleSearch}>
          {searchToggleLabel}
        </Button>
      </div>

      {showSearch ? (
        <NewConversationSearch onSelect={onSelect} onClose={onCloseSearch} />
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
  );
}
