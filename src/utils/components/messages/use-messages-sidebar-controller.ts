import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { MessagesSidebarProps } from "@/types/components/messages/messages-sidebar-props";

import { listConversations } from "@/lib/api/messages";
import { markConversationAsRead } from "@/lib/api/messages/mark-conversation-as-read";

export function useMessagesSidebarController({ activeId, onSelect }: MessagesSidebarProps) {
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

  return {
    sidebarClassName: activeId ? "hidden md:flex" : "flex",
    showSearch,
    showEmptyState: conversations.length === 0,
    searchToggleLabel: showSearch ? texts.messages.back : texts.messages.new,
    toggleSearch: () => setShowSearch((visible) => !visible),
    closeSearch: () => setShowSearch(false),
    conversations: conversations.map((conversation) => ({
      conversation,
      isActive: conversation.id === (activeId ?? ""),
      select: () => {
        onSelect(conversation.id);
        if (conversation.unread > 0) markAsRead.mutate(conversation.id);
      },
    })),
  };
}
