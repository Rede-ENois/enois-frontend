import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { Search } from "lucide-react";

import { messagesApi } from "@/lib/api/messages";
import { networkApi } from "@/lib/api/network";
import { profileApi } from "@/lib/api/profile";
import { getCurrentUserId } from "@/lib/current-user";
import { texts } from "@/texts";
import type { ConversationItemProps } from "@/types/components/messages/conversation-item-props";
import type { MessagesSidebarProps } from "@/types/components/messages/messages-sidebar-props";
import { formatRelativeTime } from "@/utils/format-relative-time";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/user-avatar";

export function MessagesSidebar({ activeId, onSelect }: MessagesSidebarProps) {
  const currentUserId = getCurrentUserId();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const { data: conversationsData } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => messagesApi.listConversations(),
    refetchInterval: 15_000,
  });

  const conversations = conversationsData?.items ?? [];

  const { data: searchResults } = useQuery({
    queryKey: ["network", "users", searchQuery],
    queryFn: () => networkApi.list(searchQuery),
    enabled: searchQuery.length > 0,
  });

  const filteredUsers = (searchResults?.items ?? []).filter((user) => user.id !== currentUserId);

  const createConversation = useMutation({
    mutationFn: (participantId: string) =>
      messagesApi.createConversation({ kind: "DIRECT", participantIds: [participantId] }),
    onSuccess: (conversation) => {
      onSelect(conversation.id);
      setShowSearch(false);
      setSearchQuery("");
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const markAsRead = useMutation({
    mutationFn: (conversationId: string) => messagesApi.markAsRead(conversationId),
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

function ConversationItem({ conversation, isActive, onSelect }: ConversationItemProps) {
  const currentUserId = getCurrentUserId();
  const otherId = conversation.participantIds.find((id) => id !== currentUserId);
  const { data: otherUser } = useQuery({
    queryKey: ["profile", "by-id", otherId],
    queryFn: () => profileApi.getById(otherId ?? ""),
    enabled: !!otherId,
  });

  const title = conversation.title ?? otherUser?.name ?? texts.messages.conversationFallback;

  return (
    <li>
      <button
        onClick={onSelect}
        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
          isActive ? "bg-primary-soft" : "hover:bg-muted"
        }`}
      >
        <Link to="/perfil/$username" params={{ username: otherUser?.username ?? otherId ?? "" }}>
          <UserAvatar src={otherUser?.avatar} alt={title} className="h-11 w-11 shrink-0" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="truncate text-sm font-medium">{title}</span>
            <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
              {conversation.time ? formatRelativeTime(conversation.time) : ""}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-xs text-muted-foreground">
              {conversation.lastMessage ?? ""}
            </p>
            {conversation.unread > 0 && (
              <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                {conversation.unread}
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}
