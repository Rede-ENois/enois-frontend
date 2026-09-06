import { Search } from "lucide-react";

import type { Conversation, NetworkUser } from "@/lib/api";
import { texts } from "@/texts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContactSearch } from "./contact-search";
import { ConversationList } from "./conversation-list";
import type { ConversationViewModel } from "./conversation-view-model";

type MessageSidebarProps = {
  conversations: ConversationViewModel[];
  activeConversationId: string | null;
  currentUserId: string;
  isContactSearchVisible: boolean;
  searchQuery: string;
  searchResults: NetworkUser[];
  onToggleSearch: () => void;
  onSearchQueryChange: (value: string) => void;
  onCreateConversation: (userId: string) => void;
  onSelectConversation: (conversation: Conversation) => void;
};

export function MessageSidebar({
  conversations,
  activeConversationId,
  currentUserId,
  isContactSearchVisible,
  searchQuery,
  searchResults,
  onToggleSearch,
  onSearchQueryChange,
  onCreateConversation,
  onSelectConversation,
}: MessageSidebarProps) {
  return (
    <div className={`flex flex-col border-r border-border ${activeConversationId ? "hidden md:flex" : "flex"}`}>
      <div className="border-b border-border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">{texts.messages.title}</h1>
          <Button size="sm" variant="outline" className="rounded-full" onClick={onToggleSearch}>
            {isContactSearchVisible ? texts.messages.back : texts.messages.new}
          </Button>
        </div>

        {isContactSearchVisible ? (
          <ContactSearch
            searchQuery={searchQuery}
            searchResults={searchResults}
            onSearchQueryChange={onSearchQueryChange}
            onCreateConversation={onCreateConversation}
          />
        ) : (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder={texts.messages.searchConversations} className="h-9 rounded-full bg-muted pl-9" />
          </div>
        )}
      </div>

      <ConversationList
        conversations={conversations}
        activeConversationId={activeConversationId}
        currentUserId={currentUserId}
        onSelectConversation={onSelectConversation}
      />
    </div>
  );
}
