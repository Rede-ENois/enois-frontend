import { useMessagesStore } from "@/stores/messages.store";
import { texts } from "@/texts";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

export function NewConversationSearchInput() {
  const query = useMessagesStore((state) => state.newConversationSearchQuery);
  const setQuery = useMessagesStore((state) => state.setNewConversationSearchQuery);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={texts.messages.searchContacts}
        className="h-9 rounded-full bg-muted pl-9"
        autoFocus
      />
    </div>
  );
}
