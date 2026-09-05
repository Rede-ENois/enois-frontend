import { type FormEvent, useEffect, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { ArrowLeft, Search, Send } from "lucide-react";

import { messagesApi, networkApi, profileApi } from "@/lib/api";
import { useAuth } from "@/lib/use-auth";
import { texts } from "@/texts";
import { getOtherParticipantId, sortByTime } from "@/utils/messages";
import { formatRelativeTime } from "@/utils/time";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { AppContainer } from "@/components/app-container";
import { UserAvatar } from "@/components/user-avatar";

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

export const Route = createFileRoute("/mensagens")({
  head: () => ({ meta: [{ title: texts.messages.seoTitle }] }),
  component: Mensagens,
});

function Mensagens() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [text, setText] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversationsData } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => messagesApi.listConversations(),
    refetchInterval: 15_000,
  });

  const conversations = conversationsData?.items ?? [];
  const activeConversation = activeId
    ? conversations.find((conversation) => conversation.id === activeId)
    : null;

  const { data: messagesData } = useQuery({
    queryKey: ["messages", activeConversation?.id],
    queryFn: () => messagesApi.listMessages(activeConversation!.id),
    enabled: Boolean(activeConversation),
    refetchInterval: 10_000,
  });

  const messages = sortByTime(messagesData?.items ?? []);

  const { data: searchResults } = useQuery({
    queryKey: ["network", "users", searchQuery],
    queryFn: () => networkApi.list(searchQuery),
    enabled: searchQuery.length > 0,
  });

  const filteredUsers = (searchResults?.items ?? []).filter(
    (user) => user.id !== currentUser?.id,
  );

  const sendMessage = useMutation({
    mutationFn: ({ conversationId, text }: { conversationId: string; text: string }) =>
      messagesApi.sendMessage(conversationId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", activeConversation?.id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setText("");
    },
  });

  const createConversation = useMutation({
    mutationFn: (participantId: string) =>
      messagesApi.createConversation({ kind: "DIRECT", participantIds: [participantId] }),
    onSuccess: (conversation) => {
      setActiveId(conversation.id);
      setShowSearch(false);
      setSearchQuery("");
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const markAsRead = useMutation({
    mutationFn: (conversationId: string) => messagesApi.markAsRead(conversationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations"] }),
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const content = text.trim();
    if (!content || !activeConversation) return;
    sendMessage.mutate({ conversationId: activeConversation.id, text: content });
  };

  const activeMessages = activeConversation ? messages : [];
  const otherParticipantId = activeConversation
    ? getOtherParticipantId(activeConversation.participantIds, currentUser?.id)
    : undefined;

  const { data: otherUser } = useQuery({
    queryKey: ["profile", "by-id", otherParticipantId],
    queryFn: () => profileApi.getById(otherParticipantId ?? ""),
    enabled: Boolean(otherParticipantId),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length]);

  return (
    <AppContainer>
      <div className="surface-card grid h-[calc(100dvh-11rem)] md:h-[calc(100vh-9rem)] grid-cols-1 overflow-hidden md:grid-cols-[320px_1fr]">
        <div
          className={`flex flex-col border-r border-border ${activeConversation ? "hidden md:flex" : "flex"}`}
        >
          <div className="border-b border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-lg font-semibold">{texts.messages.title}</h1>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={() => setShowSearch((value) => !value)}
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
                  isActive={conversation.id === (activeConversation?.id ?? "")}
                  currentUserId={currentUser?.id ?? ""}
                  onSelect={() => {
                    setActiveId(conversation.id);
                    if (conversation.unread > 0) markAsRead.mutate(conversation.id);
                  }}
                />
              ))
            )}
          </ul>
        </div>

        <div className={`flex min-h-0 flex-col ${activeConversation ? "flex" : "hidden md:flex"}`}>
          {!activeConversation ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">{texts.messages.selectConversation}</p>
            </div>
          ) : (
            <>
              <ConversationHeader
                conversation={activeConversation}
                currentUserId={currentUser?.id ?? ""}
                onBack={() => setActiveId(null)}
              />
              <div className="flex-1 overflow-y-auto bg-muted/30 p-5">
                <div className="space-y-3">
                  {activeMessages.length === 0 ? (
                    <p className="py-16 text-center text-sm text-muted-foreground">
                      {texts.messages.noMessages}
                    </p>
                  ) : (
                    activeMessages.map((message) => {
                      const ownership = message.from === currentUser?.id ? "mine" : "theirs";
                      const styles = messageStyles[ownership];

                      return (
                        <div
                          key={message.id}
                          className={`flex items-end gap-2 ${styles.row}`}
                        >
                          {ownership === "theirs" && (
                            <Link
                              to="/perfil/$username"
                              params={{ username: otherUser?.username ?? otherParticipantId ?? "" }}
                            >
                              <UserAvatar
                                src={otherUser?.avatar}
                                alt={otherUser?.name}
                                className="h-7 w-7 shrink-0 mb-1"
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

              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2 border-t border-border p-3"
              >
                <Input
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder={texts.messages.inputPlaceholder}
                  className="h-10 rounded-full bg-muted"
                />
                <button
                  type="submit"
                  disabled={!text.trim() || sendMessage.isPending}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </AppContainer>
  );
}

function ConversationItem({
  conversation,
  isActive,
  currentUserId,
  onSelect,
}: {
  conversation: {
    id: string;
    title: string | null;
    participantIds: string[];
    lastMessage: string | null;
    time: string | null;
    unread: number;
  };
  isActive: boolean;
  currentUserId: string;
  onSelect: () => void;
}) {
  const otherId = getOtherParticipantId(conversation.participantIds, currentUserId);
  const { data: otherUser } = useQuery({
    queryKey: ["profile", "by-id", otherId],
    queryFn: () => profileApi.getById(otherId ?? ""),
    enabled: Boolean(otherId),
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
}

function ConversationHeader({
  conversation,
  currentUserId,
  onBack,
}: {
  conversation: { id: string; title: string | null; participantIds: string[] };
  currentUserId: string;
  onBack?: () => void;
}) {
  const otherId = getOtherParticipantId(conversation.participantIds, currentUserId);
  const { data: otherUser } = useQuery({
    queryKey: ["profile", "by-id", otherId],
    queryFn: () => profileApi.getById(otherId ?? ""),
    enabled: Boolean(otherId),
  });

  const title = conversation.title ?? otherUser?.name ?? texts.messages.conversationFallback;

  return (
    <header className="flex items-center gap-3 border-b border-border p-4">
      <div className="flex items-center gap-3 min-w-0">
        {onBack && (
          <button
            onClick={onBack}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-muted md:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <Link to="/perfil/$username" params={{ username: otherUser?.username ?? otherId ?? "" }}>
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
  );
}
