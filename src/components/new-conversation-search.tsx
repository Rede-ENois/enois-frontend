import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Search } from "lucide-react";

import { createConversation as createConversationRequest } from "@/lib/api/messages/create-conversation";
import { listNetworkUsers } from "@/lib/api/network";
import { getCurrentUserId } from "@/lib/get-current-user-id";
import { texts } from "@/texts";
import type { NewConversationSearchProps } from "@/types/components/messages/new-conversation-search-props";

import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/user-avatar";

export function NewConversationSearch({ onSelect, onClose }: NewConversationSearchProps) {
  const currentUserId = getCurrentUserId();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: searchResults } = useQuery({
    queryKey: ["network", "users", searchQuery],
    queryFn: () => listNetworkUsers(searchQuery),
    enabled: searchQuery.length > 0,
  });

  const filteredUsers = (searchResults?.items ?? []).filter((user) => user.id !== currentUserId);

  const createConversation = useMutation({
    mutationFn: (participantId: string) =>
      createConversationRequest({ kind: "DIRECT", participantIds: [participantId] }),
    onSuccess: (conversation) => {
      onSelect(conversation.id);
      onClose();
      setSearchQuery("");
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={texts.messages.searchContacts}
          className="h-9 rounded-full bg-muted pl-9"
          autoFocus
        />
      </div>
      {searchQuery && (
        <div className="space-y-1">
          {filteredUsers.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {texts.messages.noContact}
            </p>
          ) : (
            filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => createConversation.mutate(user.id)}
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
