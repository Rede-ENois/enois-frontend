import { type FormEventHandler, useEffect, useRef } from "react";

import { Link } from "@tanstack/react-router";

import { ArrowLeft, Search, Send } from "lucide-react";

import type { Conversation, Message, NetworkUser, Profile } from "@/lib/api";
import { texts } from "@/texts";
import { getOtherParticipantId } from "@/utils/messages";
import { formatRelativeTime } from "@/utils/time";

import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ConversationWithUser = {
  conversation: Conversation;
  otherUser?: Profile;
};

const messageStyles = {
  mine: {
    row: "justify-end",
    bubble: "rounded-br-md bg-primary text-primary-foreground",
    time: "text-primary-foreground/70",
  },
  theirs: {
    row: "justify-start",
    bubble: "rounded-bl-md bg-card text-foreground",
    time: "text-muted-foreground",
  },
} as const;

type MessagesSidebarProps = {
  conversations: ConversationWithUser[];
  activeId: string | null;
  currentUserId: string;
  showSearch: boolean;
  searchQuery: string;
  searchResults: NetworkUser[];
  onToggleSearch: () => void;
  onSearchQueryChange: (value: string) => void;
  onCreateConversation: (userId: string) => void;
  onSelectConversation: (conversation: Conversation) => void;
};

export function MessagesSidebar({
  conversations,
  activeId,
  currentUserId,
  showSearch,
  searchQuery,
  searchResults,
  onToggleSearch,
  onSearchQueryChange,
  onCreateConversation,
  onSelectConversation,
}: MessagesSidebarProps) {
  return (
    <div
      className={`flex flex-col border-r border-border ${activeId ? "hidden md:flex" : "flex"}`}
    >
      <div className="border-b border-border p-4">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">{texts.messages.title}</h1>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={onToggleSearch}
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
                onChange={(event) => onSearchQueryChange(event.target.value)}
                placeholder={texts.messages.searchContacts}
                className="h-9 rounded-full bg-muted pl-9"
                autoFocus
              />
            </div>
            {searchQuery && (
              <div className="space-y-1">
                {searchResults.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    {texts.messages.noContact}
                  </p>
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
          conversations.map(({ conversation, otherUser }) => {
            const title = conversation.title ?? otherUser?.name ?? texts.messages.conversationFallback;
            const otherUserId =
              getOtherParticipantId(conversation.participantIds, currentUserId) ?? currentUserId;

            return (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => onSelectConversation(conversation)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                    conversation.id === activeId ? "bg-primary-soft" : "hover:bg-muted"
                  }`}
                >
                  <Link
                    to="/perfil/$username"
                    params={{ username: otherUser?.username ?? otherUserId }}
                  >
                    <UserAvatar src={otherUser?.avatar} alt={title} className="h-11 w-11 shrink-0" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm font-medium">{title}</span>
                      <span className="ml-2 shrink-0 text-[11px] text-muted-foreground">
                        {formatRelativeTime(conversation.time)}
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
          })
        )}
      </ul>
    </div>
  );
}

type MessageThreadProps = {
  conversation: Conversation | null;
  otherUser?: Profile;
  currentUserId: string;
  messages: Message[];
  text: string;
  sending: boolean;
  onBack: () => void;
  onTextChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function MessageThread({
  conversation,
  otherUser,
  currentUserId,
  messages,
  text,
  sending,
  onBack,
  onTextChange,
  onSubmit,
}: MessageThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!conversation) {
    return (
      <div className="hidden min-h-0 flex-col md:flex">
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-muted-foreground">{texts.messages.selectConversation}</p>
        </div>
      </div>
    );
  }

  const title = conversation.title ?? otherUser?.name ?? texts.messages.conversationFallback;
  const otherUserId =
    getOtherParticipantId(conversation.participantIds, currentUserId) ?? currentUserId;

  return (
    <div className="flex min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-border p-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-muted md:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <Link
            to="/perfil/$username"
            params={{ username: otherUser?.username ?? otherUserId }}
          >
            <UserAvatar src={otherUser?.avatar} alt={title} className="h-10 w-10 shrink-0" />
          </Link>
          <div className="min-w-0">
            <p className="truncate font-semibold">{title}</p>
            {otherUser?.headline && (
              <p className="truncate text-xs text-muted-foreground">{otherUser.headline}</p>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-muted/30 p-5">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              {texts.messages.noMessages}
            </p>
          ) : (
            messages.map((message) => {
              const ownership = message.from === currentUserId ? "mine" : "theirs";
              const styles = messageStyles[ownership];

              return (
                <div key={message.id} className={`flex items-end gap-2 ${styles.row}`}>
                  {ownership === "theirs" && (
                    <Link
                      to="/perfil/$username"
                      params={{ username: otherUser?.username ?? otherUserId }}
                    >
                      <UserAvatar
                        src={otherUser?.avatar}
                        alt={otherUser?.name}
                        className="mb-1 h-7 w-7 shrink-0"
                      />
                    </Link>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${styles.bubble}`}
                  >
                    <p className="break-words">{message.text}</p>
                    <p className={`mt-1 text-[10px] ${styles.time}`}>
                      {formatRelativeTime(message.time)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-border p-3">
        <Input
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          placeholder={texts.messages.inputPlaceholder}
          className="h-10 rounded-full bg-muted"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
