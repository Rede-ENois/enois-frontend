import { Search } from "lucide-react";

import { texts } from "@/texts";
import type { NewConversationSearchInputProps } from "@/types/components/messages/new-conversation-search-input-props";

import { Input } from "@/components/ui/input";

export function NewConversationSearchInput({
  query,
  onQueryChange,
}: NewConversationSearchInputProps) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder={texts.messages.searchContacts}
        className="h-9 rounded-full bg-muted pl-9"
        autoFocus
      />
    </div>
  );
}
