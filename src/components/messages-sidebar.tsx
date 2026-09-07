import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { MessagesSidebarProps } from "@/types/components/messages/messages-sidebar-props";
import { Search } from "lucide-react";

import { listConversations } from "@/lib/api/messages";
import { markConversationAsRead } from "@/lib/api/messages/mark-conversation-as-read";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { ConversationItem } from "@/components/conversation-item";
import { NewConversationSearch } from "@/components/new-conversation-search";

export function MessagesSidebar({ activeId, onSelect }: MessagesSidebarProps) {
  const queryClient = useQueryClient();
  const [showSearch, setShowSearch] = useState(false);

  const { data: conversationsData } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => listConversations(),
    refetchInterval: 15_000,
  });

  const conversations = conversationsData?.items ?? [];

  const markAsRead = useMutation({
    mutationFn: markConversationAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations"] }),
  });

  return (
    <div className={`flex flex-col border-r border-border ${activeId ? "hidden md:flex" : "flex"}`}>
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold">{texts.messages.title}</h1>

          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={() => setShowSearch((visible) => !visible)}
          >
            {showSearch ? texts.messages.back : texts.messages.new}
          </Button>
        </div>
        {showSearch ? (
          <NewConversationSearch onSelect={onSelect} onClose={() => setShowSearch(false)} />
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
        {conversations.length === 0 ? (
          <li className="p-4 text-center text-sm text-muted-foreground">
            {texts.messages.noConversations}
          </li>
        ) : (
          conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={conversation.id === (activeId ?? "")}
              onSelect={() => {
                onSelect(conversation.id);
                if (conversation.unread > 0) markAsRead.mutate(conversation.id);
              }}
            />
          ))
        )}
      </ul>
    </div>
  );
}
