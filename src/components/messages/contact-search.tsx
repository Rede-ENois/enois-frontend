import { Search } from "lucide-react";

import type { NetworkUser } from "@/lib/api";
import { texts } from "@/texts";

import { UserAvatar } from "@/components/user-avatar";
import { Input } from "@/components/ui/input";

type ContactSearchProps = {
  searchQuery: string;
  searchResults: NetworkUser[];
  onSearchQueryChange: (value: string) => void;
  onCreateConversation: (userId: string) => void;
};

export function ContactSearch({
  searchQuery,
  searchResults,
  onSearchQueryChange,
  onCreateConversation,
}: ContactSearchProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder={texts.messages.searchContacts}
          className="h-9 rounded-full bg-muted pl-9"
          autoFocus
        />
      </div>
      {searchQuery && (
        <div className="space-y-1">
          {searchResults.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{texts.messages.noContact}</p>
          ) : (
            searchResults.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => onCreateConversation(user.id)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-muted"
              >
                <UserAvatar src={user.avatar} alt={user.name} className="h-10 w-10" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.headline}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
